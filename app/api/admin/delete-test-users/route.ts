import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/admin/delete-test-users
 * Development only - Delete test users for clean testing
 */
export async function DELETE(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const emails = searchParams.get("emails")?.split(",") || [];

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No emails provided. Use ?emails=email1,email2" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting test users: ${emails.join(", ")}`);

    // First get user IDs
    const usersToDelete = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });

    const userIds = usersToDelete.map(
      (user: { id: string; email: string }) => user.id
    );

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found with those emails",
        emails: emails,
      });
    }

    // Delete related records first (foreign key constraints)
    const deletedSessions = await prisma.userSession.deleteMany({
      where: { userId: { in: userIds } },
    });

    const deletedSecurityLogs = await prisma.securityLog.deleteMany({
      where: { userId: { in: userIds } },
    });

    const deletedPasswordResets = await prisma.passwordReset.deleteMany({
      where: { userId: { in: userIds } },
    });

    // Delete any exam codes
    const deletedExamCodes = await prisma.examCode.deleteMany({
      where: { userId: { in: userIds } },
    });

    // Delete any payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: { userId: { in: userIds } },
    });

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log(`✅ Deleted ${deletedUsers.count} users`);
    console.log(`✅ Deleted ${deletedSessions.count} sessions`);
    console.log(`✅ Deleted ${deletedSecurityLogs.count} security logs`);
    console.log(`✅ Deleted ${deletedPasswordResets.count} password resets`);
    console.log(`✅ Deleted ${deletedExamCodes.count} exam codes`);
    console.log(`✅ Deleted ${deletedPayments.count} payments`);

    return NextResponse.json({
      success: true,
      deleted: {
        users: deletedUsers.count,
        sessions: deletedSessions.count,
        securityLogs: deletedSecurityLogs.count,
        passwordResets: deletedPasswordResets.count,
        examCodes: deletedExamCodes.count,
        payments: deletedPayments.count,
      },
      emails: emails,
    });
  } catch (error) {
    console.error("Error deleting test users:", error);
    return NextResponse.json(
      { error: "Failed to delete test users", details: error },
      { status: 500 }
    );
  }
}

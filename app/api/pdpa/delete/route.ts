import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUserData } from "@/lib/pdpa";
import { csrfProtection } from "@/lib/csrf";
import { z } from "zod";

// DELETE request schema
const deleteRequestSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  confirmDelete: z.literal(true).refine((val) => val === true, {
    message: "Please confirm deletion",
  }),
});

// DELETE /api/pdpa/delete - Delete user data (Right to Erasure)
export async function DELETE(request: NextRequest) {
  return csrfProtection(request, async (req) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json();

    // Validate request
    const validatedData = deleteRequestSchema.parse(body);

    // Perform data deletion
    const result = await deleteUserData(session.user.id, validatedData.reason);

    // Destroy the session after deletion
    // Note: In production, you'd want to invalidate all user sessions
    
    return NextResponse.json({
      success: true,
      message: "Your data has been successfully deleted",
      messageThai: "ข้อมูลของคุณถูกลบเรียบร้อยแล้ว",
      deletedRecords: result.deletedRecords,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request", details: error.issues },
          { status: 400 }
        );
      }

      console.error("Error deleting user data:", error);
      return NextResponse.json(
        { error: "Failed to delete user data" },
        { status: 500 }
      );
    }
  });
}
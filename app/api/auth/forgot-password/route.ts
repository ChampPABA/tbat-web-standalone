import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-gmail";
import crypto from "crypto";

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/auth/forgot-password
 * Password reset request endpoint with rate limiting and security logging
 */
export const POST = withRateLimit(
  async (req: NextRequest) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = forgotPasswordSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid email format",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const { email } = validation.data;

      // Check if user exists
      if (!prisma) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, thaiName: true }
      });

      // Always return success to prevent email enumeration attacks
      // But only send email if user exists
      if (user) {
        // Generate secure reset token (24-hour expiry)
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token in PasswordReset table
        await prisma.passwordReset.create({
          data: {
            userId: user.id,
            resetToken,
            expiresAt,
          },
        });

        // Send reset email
        try {
          await sendEmail({
            to: user.email,
            subject: "รีเซ็ตรหัสผ่าน - TBAT Mock Exam @ChiangMai",
            html: getPasswordResetEmailTemplate(user.thaiName, resetToken),
          });
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);

          // Clean up the reset token if email fails
          await prisma.passwordReset.delete({
            where: { resetToken },
          });

          return NextResponse.json(
            { error: "Failed to send reset email. Please try again." },
            { status: 500 }
          );
        }

        // Security logging for password reset request
        await prisma.securityLog.create({
          data: {
            eventType: "PASSWORD_RESET_REQUEST",
            userId: user.id,
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            metadata: {
              email: user.email,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      // Always return success response (security measure)
      return NextResponse.json(
        {
          success: true,
          message: "หากอีเมลของคุณมีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้คุณ",
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      return NextResponse.json(
        { error: "An error occurred processing your request" },
        { status: 500 }
      );
    }
  },
  rateLimitConfigs.passwordReset // 3 requests per hour per IP
);

/**
 * Generate password reset email template in Thai
 */
function getPasswordResetEmailTemplate(thaiName: string, resetToken: string): string {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TBAT Mock Exam @ChiangMai</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">ระบบจำลองข้อสอบ TBAT สำหรับภาคเหนือ</p>
      </div>

      <div style="padding: 30px 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">รีเซ็ตรหัสผ่านของคุณ</h2>

        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          สวัสดีคุณ <strong>${thaiName}</strong>,
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 15px 30px; background-color: #dc2626; color: white;
                    text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
            รีเซ็ตรหัสผ่าน
          </a>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ ข้อมูลสำคัญด้านความปลอดภัย:</strong><br>
            • ลิงก์นี้จะหมดอายุใน <strong>24 ชั่วโมง</strong><br>
            • อย่าแชร์ลิงก์นี้กับผู้อื่น<br>
            • หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          หากปุ่มไม่ทำงาน กรุณาคัดลอกลิงก์นี้ไปวางในแถบที่อยู่ของเบราว์เซอร์:
        </p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 4px;">
          ${resetUrl}
        </p>
      </div>

      <div style="background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">TBAT Mock Exam @ChiangMai</p>
        <p style="margin: 5px 0 0 0;">Chiang Mai, Thailand</p>
        <p style="margin: 10px 0 0 0;">© 2024 สงวนลิขสิทธิ์</p>
      </div>
    </div>
  `;
}
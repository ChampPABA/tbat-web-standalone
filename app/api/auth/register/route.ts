import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateExamCode } from "@/lib/exam-code";
import { validateThaiNationalId, cleanNationalId, getNationalIdErrorMessage } from "@/lib/national-id-validation";

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  thaiName: z.string().min(2, "Thai name must be at least 2 characters").optional(),
  nickname: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^(\+66|0)[0-9]{8,9}$/, "Invalid Thai phone number")
    .optional(),
  lineid: z.string().optional(),
  school: z.string().min(1, "School is required").optional(),
  grade: z.string().min(1, "Grade is required").optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  nationalId: z
    .string()
    .min(1, "กรุณากรอกเลขบัตรประชาชน")
    .refine(
      (val) => {
        if (!val) return false; // Required field
        const validation = validateThaiNationalId(val);
        return validation.isValid;
      },
      {
        message: "รูปแบบเลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      }
    ),
  pdpaConsent: z.boolean().refine((val) => val === true, {
    message: "You must accept the PDPA terms to register",
  }),
  packageType: z.enum(["FREE", "ADVANCED"]).default("FREE"),
  subject: z.enum(["BIOLOGY", "CHEMISTRY", "PHYSICS"]).optional(),
  sessionTime: z.enum(["09:00-12:00", "13:00-16:00"]).optional(),
  // Payment metadata for webhook processing (AC3: Registration Flow Coordination)
  paymentSessionId: z.string().optional(),
  paymentStatus: z.enum(["completed", "pending", "failed"]).optional(),
  paymentAmount: z.number().optional(),
  paymentCurrency: z.string().optional(),
});

/**
 * POST /api/auth/register
 * User registration endpoint with rate limiting and validation
 */
export const POST = withRateLimit(
  async (req: NextRequest) => {
    let body: any;
    try {
      // Parse and validate request body
      body = await req.json();
      console.log('Registration request body:', body);
      console.log('Thai name received:', body.thaiName);
      console.log('Thai name buffer:', Buffer.from(body.thaiName || '', 'utf8').toString('hex'));
      
      const validation = registerSchema.safeParse(body);

      if (!validation.success) {
        console.error('Validation failed:', validation.error.flatten());
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const { email, password, name, thaiName, nickname, phoneNumber, lineid, school, grade, parentName, parentPhone, nationalId, pdpaConsent, packageType, subject, sessionTime, paymentSessionId, paymentStatus, paymentAmount, paymentCurrency } = validation.data;

      // Check if user already exists
      if (!prisma) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      // Check for duplicate National ID if provided
      if (nationalId) {
        const cleanedNationalId = cleanNationalId(nationalId);
        const existingNationalId = await prisma.user.findUnique({
          where: { nationalId: cleanedNationalId },
        });

        if (existingNationalId) {
          // Log duplicate National ID attempt
          await prisma.securityLog.create({
            data: {
              eventType: "NATIONAL_ID_DUPLICATE_ATTEMPT",
              ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
              userAgent: req.headers.get("user-agent") || "unknown",
              metadata: {
                action: "DUPLICATE_NATIONAL_ID_REGISTRATION",
                nationalIdProvided: !!nationalId,
                timestamp: new Date().toISOString(),
              },
            },
          });

          return NextResponse.json(
            {
              error: getNationalIdErrorMessage("DUPLICATE_ID"),
              errorCode: "DUPLICATE_NATIONAL_ID"
            },
            { status: 409 }
          );
        }

        // Log successful National ID validation
        await prisma.securityLog.create({
          data: {
            eventType: "NATIONAL_ID_VALIDATION_SUCCESS",
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            metadata: {
              action: "NATIONAL_ID_VALIDATED",
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Get full school and grade names for both database and email
      const schoolNames = {
        montfort: "มงฟอร์ตวิทยาลัย",
        yuparaj: "ยุพราชวิทยาลัย",
        dara: "ดาราวิทยาลัย",
        regina: "เรยีนาเชลีวิทยาลัย",
        prince: "ปรินส์รอยแยลส์วิทยาลัย",
        wachirawit: "วชิรวิทย์",
        nawaminda: "นวมินทราชูทิศ",
        other: "อื่นๆ"
      };

      const gradeNames = {
        m4: "ม.4",
        m5: "ม.5",
        m6: "ม.6",
        other: "อื่นๆ"
      };


      // Create user in database
      const user = await prisma!.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          thaiName: thaiName || name || "",
          nickname: nickname || null,
          phone: phoneNumber,
          lineId: lineid || null,
          school: schoolNames[school as keyof typeof schoolNames] || school || null,
          grade: gradeNames[grade as keyof typeof gradeNames] || grade || null,
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          nationalId: nationalId ? cleanNationalId(nationalId) : null,
          packageType: packageType || "FREE",
          pdpaConsent,
          // Store payment metadata for audit and coordination (AC3)
          metadata: paymentSessionId ? {
            paymentSessionId,
            paymentStatus,
            paymentAmount,
            paymentCurrency,
            paymentConfirmedAt: new Date().toISOString(),
          } : undefined,
        },
        select: {
          id: true,
          email: true,
          thaiName: true,
          nationalId: true,
          createdAt: true,
        },
      });


      // Log registration for security audit
      await prisma!.securityLog.create({
        data: {
          eventType: "AUTHENTICATION_SUCCESS",
          userId: user.id,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          metadata: {
            action: "USER_REGISTERED",
            email: user.email,
            nationalIdProvided: !!nationalId,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Generate exam code based on package type
      let examCode = null;
      let welcomeEmailResult = null;
      try {
        console.log("🎫 Generating exam code for package:", packageType);

        // AC3: Validate payment for Advanced packages
        if (packageType === "ADVANCED") {
          if (!paymentSessionId || paymentStatus !== "completed") {
            console.error("❌ Advanced package requires completed payment");
            return NextResponse.json(
              { error: "Payment confirmation required for Advanced package" },
              { status: 400 }
            );
          }
          console.log("✅ Payment confirmed for Advanced package:", paymentSessionId);
        }

        if (packageType === "FREE") {
          if (!subject) {
            console.error("❌ FREE package requires subject selection");
            return NextResponse.json(
              { error: "Subject selection is required for FREE package" },
              { status: 400 }
            );
          }
          examCode = await generateExamCode({
            packageType: "FREE",
            subject,
            userId: user.id,
            sessionTime,
          });
        } else {
          examCode = await generateExamCode({
            packageType: "ADVANCED",
            userId: user.id,
            sessionTime,
          });
        }

        console.log("✅ Exam code generated:", examCode.code);

        // Send welcome email with exam code
        console.log("📧 Sending welcome email to:", user.email);

        welcomeEmailResult = await sendEmail(user.email, "registration", {
          name: user.thaiName || name,
          email: user.email,
          packageType: packageType,
          examCode: examCode.code,
          sessionTime: sessionTime,
          phone: phoneNumber,
          lineId: lineid,
          school: schoolNames[school as keyof typeof schoolNames] || school,
          grade: gradeNames[grade as keyof typeof gradeNames] || grade,
          nickname: nickname,
          nationalId: user.nationalId
        });

        if (!welcomeEmailResult.success) {
          console.error("⚠️ Welcome email failed:", welcomeEmailResult.error);
        } else {
          console.log("✅ Welcome email sent successfully");
        }

      } catch (error) {
        console.error("❌ Exam code generation failed:", error);
        // Don't fail registration if exam code generation fails
        // User can get exam code later through another flow

        // Still send welcome email without exam code
        console.log("📧 Sending welcome email without exam code...");
        welcomeEmailResult = await sendEmail(user.email, "registration", {
          name: user.thaiName || name,
          email: user.email,
          packageType: packageType,
          examCode: "ระบบกำลังสร้างรหัสสอบ โปรดรอสักครู่",
          sessionTime: sessionTime,
          phone: phoneNumber,
          lineId: lineid,
          school: schoolNames[school as keyof typeof schoolNames] || school,
          grade: gradeNames[grade as keyof typeof gradeNames] || grade,
          nickname: nickname,
          nationalId: user.nationalId
        });
      }

      // Return success response with proper UTF-8 encoding
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "Registration successful. Welcome to TBAT Mock Exam!",
          user: {
            id: user.id,
            email: user.email,
            thaiName: user.thaiName,
          },
          examCode: examCode ? {
            code: examCode.code,
            packageType: examCode.packageType,
            subject: examCode.subject,
            generatedAt: examCode.generatedAt,
          } : null,
          emailStatus: {
            welcomeEmail: welcomeEmailResult?.success || false,
          },
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        email: body?.email || 'unknown',
        packageType: body?.packageType || 'unknown',
        school: body?.school || 'unknown',
        grade: body?.grade || 'unknown'
      });
      return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 });
    }
  },
  rateLimitConfigs.register // Apply registration rate limiting
);


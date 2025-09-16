import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { getDateCapacitySummary, getCapacityStatusForUI } from "@/lib/capacity-management";

// Request validation schema
const sessionsQuerySchema = z.object({
  examDate: z.string().optional(),
  timezone: z.string().optional().default("Asia/Bangkok"),
});

// Updated response interface that complies with Story 3.1 "no numbers" rule
interface SessionResponseV2 {
  sessionTime: "MORNING" | "AFTERNOON";
  displayTime: string;
  displayTimeThai: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
  descriptionEn: string;
  availability: {
    status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
    message: string; // Thai message
    messageEn: string; // English message
    canRegisterFree: boolean;
    canRegisterAdvanced: boolean;
    showDisabledState: boolean;
    // Note: No exact numbers exposed per Story 3.1 AC1, AC5
  };
}

interface SessionsApiResponseV2 {
  success: boolean;
  data?: {
    examDate: string;
    examDateThai: string;
    sessions: SessionResponseV2[];
    overallAvailability: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
    metadata: {
      lastUpdated: string;
      timezone: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

// Session configuration with Thai timezone support
const SESSION_CONFIG = {
  MORNING: {
    displayTime: "09:00-12:00",
    displayTimeThai: "เช้า 09:00-12:00 น.",
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    duration: 180,
    description: "ช่วงเช้า - สอบเวลา 09:00 ถึง 12:00 น.",
    descriptionEn: "Morning Session - Exam from 09:00 to 12:00",
  },
  AFTERNOON: {
    displayTime: "13:00-16:00",
    displayTimeThai: "บ่าย 13:00-16:00 น.",
    startHour: 13,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    duration: 180,
    description: "ช่วงบ่าย - สอบเวลา 13:00 ถึง 16:00 น.",
    descriptionEn: "Afternoon Session - Exam from 13:00 to 16:00",
  },
} as const;

// Thai month names for date formatting
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

/**
 * GET /api/sessions - Updated for Story 3.1 compliance
 * Returns sessions without exposing exact capacity numbers
 */
export async function GET(request: NextRequest): Promise<NextResponse<SessionsApiResponseV2>> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, rateLimitConfigs.api);
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<SessionsApiResponseV2>;
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      examDate: url.searchParams.get("examDate") || "2025-09-27",
      timezone: url.searchParams.get("timezone") || "Asia/Bangkok",
    };

    const validatedParams = sessionsQuerySchema.parse(queryParams);
    const examDate = validatedParams.examDate || "2025-09-27";

    // Get capacity summary using Story 3.1 compliant service
    const capacitySummary = await getDateCapacitySummary(new Date(examDate));

    // Build session responses with UI-compliant capacity info
    const sessions: SessionResponseV2[] = await Promise.all([
      buildSessionResponseV2("MORNING", examDate, validatedParams.timezone, capacitySummary.sessions.morning),
      buildSessionResponseV2("AFTERNOON", examDate, validatedParams.timezone, capacitySummary.sessions.afternoon),
    ]);

    // Format Thai date
    const examDateObj = new Date(examDate);
    const thaiYear = examDateObj.getFullYear() + 543;
    const examDateThai = `${examDateObj.getDate()} ${THAI_MONTHS[examDateObj.getMonth()]} ${thaiYear}`;

    return NextResponse.json({
      success: true,
      data: {
        examDate: examDate,
        examDateThai,
        sessions,
        overallAvailability: capacitySummary.overall_availability,
        metadata: {
          lastUpdated: new Date().toISOString(),
          timezone: validatedParams.timezone,
        },
      },
    });

  } catch (error) {
    console.error("Error in GET /api/sessions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: "INVALID_PARAMETERS",
          message: "Invalid query parameters",
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch session information",
      },
    }, { status: 500 });
  }
}

/**
 * Build individual session response compliant with Story 3.1 "no numbers" rule
 */
async function buildSessionResponseV2(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: string,
  timezone: string,
  availabilityData: any
): Promise<SessionResponseV2> {
  const config = SESSION_CONFIG[sessionTime];
  const examDateObj = new Date(examDate);

  // Create start and end times
  const startTime = new Date(examDateObj);
  startTime.setHours(config.startHour, config.startMinute, 0, 0);

  const endTime = new Date(examDateObj);
  endTime.setHours(config.endHour, config.endMinute, 0, 0);

  return {
    sessionTime,
    displayTime: config.displayTime,
    displayTimeThai: config.displayTimeThai,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: config.duration,
    description: config.description,
    descriptionEn: config.descriptionEn,
    availability: {
      status: availabilityData.availability_status,
      message: availabilityData.message,
      messageEn: availabilityData.message_en,
      canRegisterFree: availabilityData.can_register_free,
      canRegisterAdvanced: availabilityData.can_register_advanced,
      showDisabledState: availabilityData.show_disabled_state,
      // No exact numbers per Story 3.1 AC1, AC5
    },
  };
}

/**
 * POST /api/sessions/validate - Updated for Story 3.1 compliance
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, rateLimitConfigs.api);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // Validate request body
    const validateSchema = z.object({
      sessionTime: z.enum(["MORNING", "AFTERNOON"]),
      examDate: z.string(),
      packageType: z.enum(["FREE", "ADVANCED"]),
    });

    const validatedData = validateSchema.parse(body);

    // Use Story 3.1 compliant capacity check
    const availabilityData = await getCapacityStatusForUI(
      validatedData.sessionTime,
      new Date(validatedData.examDate)
    );

    // Check registration eligibility
    const canRegister = validatedData.packageType === "FREE"
      ? availabilityData.can_register_free
      : availabilityData.can_register_advanced;

    let validationMessage = availabilityData.message;
    let validationMessageEn = availabilityData.message_en;

    if (!canRegister) {
      if (validatedData.packageType === "FREE" && !availabilityData.can_register_free && availabilityData.can_register_advanced) {
        validationMessage = "Free Package เต็มแล้ว - พิจารณาอัปเกรดเป็น Advanced Package";
        validationMessageEn = "Free Package full - Consider upgrading to Advanced Package";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: canRegister,
        message: validationMessage,
        messageEn: validationMessageEn,
        recommendations: !canRegister ? generateRecommendationsV2(validatedData, availabilityData) : [],
        availability: {
          status: availabilityData.availability_status,
          canRegisterFree: availabilityData.can_register_free,
          canRegisterAdvanced: availabilityData.can_register_advanced,
          showDisabledState: availabilityData.show_disabled_state,
        },
      },
    });

  } catch (error) {
    console.error("Error in POST /api/sessions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Invalid request data",
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to validate session selection",
      },
    }, { status: 500 });
  }
}

/**
 * Generate recommendations when session is not available (Story 3.1 compliant)
 */
function generateRecommendationsV2(
  requestData: { sessionTime: "MORNING" | "AFTERNOON"; packageType: "FREE" | "ADVANCED" },
  availabilityData: any
): string[] {
  const recommendations: string[] = [];

  if (requestData.packageType === "FREE" && !availabilityData.can_register_free && availabilityData.can_register_advanced) {
    recommendations.push("พิจารณาอัปเกรดเป็น Advanced Package");
    recommendations.push("เลือกช่วงเวลาอื่น (เช้า/บ่าย)");
  } else if (availabilityData.show_disabled_state) {
    recommendations.push("เลือกช่วงเวลาอื่น (เช้า/บ่าย)");
    recommendations.push("ติดตามการเปิดรับสมัครรอบถัดไป");
  }

  return recommendations;
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "PUT method not supported for sessions endpoint",
    },
  }, { status: 405 });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "DELETE method not supported for sessions endpoint",
    },
  }, { status: 405 });
}
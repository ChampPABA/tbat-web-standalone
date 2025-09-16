import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { 
  calculateSessionCapacity, 
  getDateCapacitySummary 
} from "@/lib/capacity";
import { getCachedSessionTemplates } from "@/lib/edge-config";

// Request validation schema
const sessionsQuerySchema = z.object({
  examDate: z.string().optional(),
  includeCapacity: z.string().optional().default("true"),
  includeConflicts: z.string().optional().default("false"),
  timezone: z.string().optional().default("Asia/Bangkok"),
});

// Response interfaces
interface SessionResponse {
  sessionTime: "MORNING" | "AFTERNOON";
  displayTime: string;
  displayTimeThai: string;
  startTime: string; // ISO datetime string in Thai timezone
  endTime: string; // ISO datetime string in Thai timezone
  duration: number; // Duration in minutes
  description: string;
  descriptionEn: string;
  capacity?: {
    current: number;
    maximum: number;
    available: number;
    percentageFull: number;
    status: string;
    message: string;
    messageEn: string;
    registrationCounts: {
      free: number | undefined; // Hidden based on business logic
      advanced: number;
      total: number;
    };
  };
  conflicts?: string[];
}

interface SessionsApiResponse {
  success: boolean;
  data?: {
    examDate: string;
    examDateThai: string;
    sessions: SessionResponse[];
    summary: {
      totalSessions: number;
      totalCapacity: number;
      totalOccupied: number;
      overallAvailability: string;
    };
    metadata: {
      lastUpdated: string;
      timezone: string;
      cacheHit: boolean;
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
    duration: 180, // 3 hours in minutes
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
    duration: 180, // 3 hours in minutes
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
 * GET /api/sessions
 * Returns time slot information with registration counts and Thai timezone formatting
 */
export async function GET(request: NextRequest): Promise<NextResponse<SessionsApiResponse>> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, rateLimitConfigs.api);
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<SessionsApiResponse>;
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      examDate: url.searchParams.get("examDate") || "2025-09-27",
      includeCapacity: url.searchParams.get("includeCapacity") || "true",
      includeConflicts: url.searchParams.get("includeConflicts") || "false",
      timezone: url.searchParams.get("timezone") || "Asia/Bangkok",
    };

    const validatedParams = sessionsQuerySchema.parse(queryParams);
    const examDate = validatedParams.examDate || "2025-09-27"; // Ensure examDate is defined
    let cacheHit = false;

    // Get session templates (cached in Edge Config for static data)
    const sessionTemplates = await getCachedSessionTemplates();
    if (sessionTemplates) {
      cacheHit = true;
    }

    // Get capacity data if requested
    let capacitySummary = null;
    if (validatedParams.includeCapacity === "true") {
      capacitySummary = await getDateCapacitySummary(new Date(examDate));
    }

    // Build session responses
    const sessions: SessionResponse[] = await Promise.all([
      buildSessionResponse("MORNING", examDate, validatedParams.timezone, capacitySummary?.sessions.morning),
      buildSessionResponse("AFTERNOON", examDate, validatedParams.timezone, capacitySummary?.sessions.afternoon),
    ]);

    // Add conflict detection if requested
    if (validatedParams.includeConflicts === "true") {
      sessions.forEach(session => {
        session.conflicts = detectSessionConflicts(session, sessions);
      });
    }

    // Calculate summary statistics
    const summary = {
      totalSessions: sessions.length,
      totalCapacity: capacitySummary?.totalCapacity || 600, // 300 per session * 2 sessions
      totalOccupied: capacitySummary?.totalOccupied || 0,
      overallAvailability: capacitySummary?.overallAvailability || "AVAILABLE",
    };

    // Format Thai date
    const examDateObj = new Date(examDate);
    const thaiYear = examDateObj.getFullYear() + 543; // Convert to Thai Buddhist year
    const examDateThai = `${examDateObj.getDate()} ${THAI_MONTHS[examDateObj.getMonth()]} ${thaiYear}`;

    return NextResponse.json({
      success: true,
      data: {
        examDate: examDate,
        examDateThai,
        sessions,
        summary,
        metadata: {
          lastUpdated: new Date().toISOString(),
          timezone: validatedParams.timezone,
          cacheHit,
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
 * Build individual session response with Thai timezone formatting
 */
async function buildSessionResponse(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: string,
  timezone: string,
  capacityData?: any
): Promise<SessionResponse> {
  const config = SESSION_CONFIG[sessionTime];
  const examDateObj = new Date(examDate);
  
  // Create start and end times in Thai timezone
  const startTime = new Date(examDateObj);
  startTime.setHours(config.startHour, config.startMinute, 0, 0);
  
  const endTime = new Date(examDateObj);
  endTime.setHours(config.endHour, config.endMinute, 0, 0);

  // Format times for Thai timezone (UTC+7)
  const startTimeStr = startTime.toISOString();
  const endTimeStr = endTime.toISOString();

  const session: SessionResponse = {
    sessionTime,
    displayTime: config.displayTime,
    displayTimeThai: config.displayTimeThai,
    startTime: startTimeStr,
    endTime: endTimeStr,
    duration: config.duration,
    description: config.description,
    descriptionEn: config.descriptionEn,
  };

  // Add capacity information if available
  if (capacityData) {
    session.capacity = {
      current: capacityData.totalCount,
      maximum: capacityData.maxCapacity,
      available: capacityData.maxCapacity - capacityData.totalCount,
      percentageFull: capacityData.percentageFull,
      status: capacityData.availabilityStatus,
      message: capacityData.message,
      messageEn: capacityData.messageEn,
      registrationCounts: {
        // Hide exact free count as per business requirement AC6
        free: capacityData.hideExactCount ? undefined : capacityData.freeCount,
        advanced: capacityData.advancedCount,
        total: capacityData.totalCount,
      },
    };
  }

  return session;
}

/**
 * Detect potential session conflicts (for future enhancement)
 */
function detectSessionConflicts(currentSession: SessionResponse, allSessions: SessionResponse[]): string[] {
  const conflicts: string[] = [];
  
  // Check for scheduling conflicts (currently none expected for TBAT exam)
  // This is a placeholder for future conflict detection logic
  
  // Example: If sessions overlap in time
  const currentStart = new Date(currentSession.startTime);
  const currentEnd = new Date(currentSession.endTime);
  
  for (const otherSession of allSessions) {
    if (otherSession.sessionTime === currentSession.sessionTime) continue;
    
    const otherStart = new Date(otherSession.startTime);
    const otherEnd = new Date(otherSession.endTime);
    
    // Check for time overlap (shouldn't happen with current TBAT schedule)
    if (currentStart < otherEnd && currentEnd > otherStart) {
      conflicts.push(`Time overlap detected with ${otherSession.displayTimeThai}`);
    }
  }
  
  return conflicts;
}

/**
 * POST /api/sessions/validate
 * Validate session selection and check for conflicts
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
    
    // Get capacity data for validation
    const capacityData = await calculateSessionCapacity(
      validatedData.sessionTime,
      validatedData.examDate
    );

    // Check if session is valid for the package type
    let isValid = true;
    let validationMessage = "เซสชันนี้ใช้งานได้";
    let validationMessageEn = "Session is available";
    
    if (validatedData.packageType === "FREE" && capacityData.freeCount >= capacityData.freeLimit) {
      isValid = false;
      validationMessage = "Free Package เต็มแล้วสำหรับเซสชันนี้";
      validationMessageEn = "Free Package is full for this session";
    } else if (capacityData.totalCount >= capacityData.maxCapacity) {
      isValid = false;
      validationMessage = "เซสชันนี้เต็มแล้ว";
      validationMessageEn = "This session is full";
    }

    // Build session info
    const sessionInfo = await buildSessionResponse(
      validatedData.sessionTime,
      validatedData.examDate,
      "Asia/Bangkok",
      capacityData
    );

    return NextResponse.json({
      success: true,
      data: {
        valid: isValid,
        message: validationMessage,
        messageEn: validationMessageEn,
        sessionInfo,
        recommendations: isValid ? [] : generateRecommendations(validatedData, capacityData),
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
 * Generate recommendations when session is not available
 */
function generateRecommendations(
  requestData: { sessionTime: "MORNING" | "AFTERNOON"; packageType: "FREE" | "ADVANCED" },
  capacityData: any
): string[] {
  const recommendations: string[] = [];

  if (requestData.packageType === "FREE" && capacityData.freeCount >= capacityData.freeLimit) {
    recommendations.push("พิจารณาอัปเกรดเป็น Advanced Package");
    recommendations.push("เลือกช่วงเวลาอื่น (เช้า/บ่าย)");
  } else if (capacityData.totalCount >= capacityData.maxCapacity) {
    recommendations.push("เลือกช่วงเวลาอื่น (เช้า/บ่าย)");
    recommendations.push("ติดตามการเปิดรับสมัครรอบถัดไป");
  }

  return recommendations;
}

/**
 * PUT method not supported for sessions endpoint
 * Session schedules are managed by administrators only
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "PUT method not supported for sessions endpoint",
    },
  }, { status: 405 });
}

/**
 * DELETE method not supported for sessions endpoint
 * Session schedules are managed by administrators only
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "DELETE method not supported for sessions endpoint",
    },
  }, { status: 405 });
}
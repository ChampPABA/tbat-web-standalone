import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { 
  calculateSessionCapacity, 
  checkCapacityAvailability, 
  getDateCapacitySummary,
  CapacityData 
} from "@/lib/capacity";
import { getCachedSessionCapacity } from "@/lib/edge-config";

// Request validation schema
const capacityQuerySchema = z.object({
  sessionTime: z.enum(["MORNING", "AFTERNOON"]).optional(),
  examDate: z.string().optional(),
  packageType: z.enum(["FREE", "ADVANCED"]).optional(),
  format: z.enum(["summary", "detailed"]).optional().default("detailed"),
});

// Response interfaces
interface CapacityResponse {
  success: boolean;
  data?: {
    examDate: string;
    sessions: {
      morning?: SessionCapacityInfo;
      afternoon?: SessionCapacityInfo;
    };
    overall?: {
      totalCapacity: number;
      totalOccupied: number;
      occupancyRate: number;
      overallStatus: string;
    };
    metadata: {
      lastUpdated: string;
      cacheHit: boolean;
      hideExactCounts: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

interface SessionCapacityInfo {
  sessionTime: "MORNING" | "AFTERNOON";
  displayTime: string;
  totalCount: number;
  maxCapacity: number;
  availabilityStatus: string;
  message: string;
  messageEn: string;
  percentageFull: number;
  freeCount?: number; // Hidden based on business logic
  advancedCount: number;
  freeLimit: number;
  warnings?: string[];
}

// Thai time display mapping
const SESSION_DISPLAY_TIMES = {
  MORNING: "09:00-12:00 น.",
  AFTERNOON: "13:00-16:00 น.",
} as const;

// Capacity-specific rate limiting (60 requests/minute per user)
const capacityRateLimit = {
  ...rateLimitConfigs.api,
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many capacity requests. Please slow down.",
};

/**
 * GET /api/capacity
 * Returns real-time session availability with appropriate messaging logic
 * Implements capacity logic hiding exact Free availability as per AC6
 */
export async function GET(request: NextRequest): Promise<NextResponse<CapacityResponse>> {
  try {
    // Apply stricter rate limiting for capacity endpoint (to prevent abuse)
    const rateLimitResponse = await rateLimit(request, capacityRateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<CapacityResponse>;
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      sessionTime: url.searchParams.get("sessionTime") as "MORNING" | "AFTERNOON" | undefined,
      examDate: url.searchParams.get("examDate") || "2025-09-27",
      packageType: url.searchParams.get("packageType") as "FREE" | "ADVANCED" | undefined,
      format: url.searchParams.get("format") as "summary" | "detailed" | undefined || "detailed",
    };

    const validatedParams = capacityQuerySchema.parse(queryParams);
    const examDate = validatedParams.examDate || "2025-09-27"; // Ensure examDate is defined
    let cacheHit = false;

    // If specific session requested, return just that session
    if (validatedParams.sessionTime) {
      const capacityData = await calculateSessionCapacity(
        validatedParams.sessionTime,
        examDate
      );
      
      const sessionInfo = formatSessionCapacityInfo(capacityData);
      
      // Apply package-specific filtering if requested
      if (validatedParams.packageType) {
        applyPackageFiltering(sessionInfo, validatedParams.packageType);
      }

      return NextResponse.json({
        success: true,
        data: {
          examDate: examDate,
          sessions: {
            [validatedParams.sessionTime.toLowerCase()]: sessionInfo,
          },
          metadata: {
            lastUpdated: new Date().toISOString(),
            cacheHit,
            hideExactCounts: sessionInfo.freeCount === undefined,
          },
        },
      });
    }

    // Return capacity for all sessions
    const capacitySummary = await getDateCapacitySummary(new Date(examDate));
    
    const morningInfo = formatSessionCapacityInfo(capacitySummary.sessions.morning);
    const afternoonInfo = formatSessionCapacityInfo(capacitySummary.sessions.afternoon);

    // Apply package filtering if requested
    if (validatedParams.packageType) {
      applyPackageFiltering(morningInfo, validatedParams.packageType);
      applyPackageFiltering(afternoonInfo, validatedParams.packageType);
    }

    // Calculate overall statistics
    const overall = {
      totalCapacity: capacitySummary.totalCapacity,
      totalOccupied: capacitySummary.totalOccupied,
      occupancyRate: Math.round((capacitySummary.totalOccupied / capacitySummary.totalCapacity) * 100) / 100,
      overallStatus: capacitySummary.overallAvailability,
    };

    const responseData = {
      examDate: examDate,
      sessions: {
        morning: morningInfo,
        afternoon: afternoonInfo,
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        cacheHit,
        hideExactCounts: morningInfo.freeCount === undefined,
      },
    };

    // Add overall statistics for detailed format
    if (validatedParams.format === "detailed") {
      (responseData as any).overall = overall;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Error in GET /api/capacity:", error);

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
        message: "Failed to fetch capacity information",
      },
    }, { status: 500 });
  }
}

/**
 * Format capacity data for API response with Thai business logic
 */
function formatSessionCapacityInfo(capacityData: CapacityData): SessionCapacityInfo {
  const warnings: string[] = [];
  
  // Add warnings based on capacity thresholds
  if (capacityData.percentageFull >= 0.9) {
    warnings.push("Session is nearly full");
  } else if (capacityData.percentageFull >= 0.8) {
    warnings.push("Limited seats remaining");
  }

  // Check for Free package specific warnings
  if (capacityData.freeCount >= capacityData.freeLimit * 0.9) {
    warnings.push("Free package nearly full");
  }

  return {
    sessionTime: capacityData.sessionTime,
    displayTime: SESSION_DISPLAY_TIMES[capacityData.sessionTime],
    totalCount: capacityData.totalCount,
    maxCapacity: capacityData.maxCapacity,
    availabilityStatus: capacityData.availabilityStatus,
    message: capacityData.message,
    messageEn: capacityData.messageEn,
    percentageFull: capacityData.percentageFull,
    // Hide exact free count as per AC6 business requirement
    freeCount: capacityData.hideExactCount ? undefined : capacityData.freeCount,
    advancedCount: capacityData.advancedCount,
    freeLimit: capacityData.freeLimit,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Apply package-specific filtering to session info
 */
function applyPackageFiltering(
  sessionInfo: SessionCapacityInfo, 
  packageType: "FREE" | "ADVANCED"
) {
  if (packageType === "FREE") {
    // For Free package, show if Free quota is available
    if (sessionInfo.freeCount !== undefined && sessionInfo.freeCount >= sessionInfo.freeLimit) {
      sessionInfo.availabilityStatus = "FULL";
      sessionInfo.message = "Free Package เต็มแล้ว";
      sessionInfo.messageEn = "Free Package is full";
    }
  } else if (packageType === "ADVANCED") {
    // For Advanced package, show overall availability (can use any remaining capacity)
    if (sessionInfo.totalCount >= sessionInfo.maxCapacity) {
      sessionInfo.availabilityStatus = "FULL";
      sessionInfo.message = "เต็มแล้ว";
      sessionInfo.messageEn = "Session is full";
    }
  }
}

/**
 * POST /api/capacity/check
 * Check if capacity is available for specific registration
 * Used during registration flow to prevent race conditions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, capacityRateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    
    // Validate request body
    const checkSchema = z.object({
      sessionTime: z.enum(["MORNING", "AFTERNOON"]),
      examDate: z.string(),
      packageType: z.enum(["FREE", "ADVANCED"]),
    });

    const validatedData = checkSchema.parse(body);
    
    // Check capacity availability
    const availabilityCheck = await checkCapacityAvailability(
      validatedData.sessionTime,
      new Date(validatedData.examDate),
      validatedData.packageType
    );

    return NextResponse.json({
      success: true,
      data: {
        available: availabilityCheck.available,
        reason: availabilityCheck.reason,
        capacityInfo: formatSessionCapacityInfo(availabilityCheck.capacityData),
        recommendation: availabilityCheck.available 
          ? "ท่านสามารถลงทะเบียนได้"
          : validatedData.packageType === "FREE" 
            ? "แนะนำให้อัปเกรดเป็น Advanced Package หรือเลือกช่วงเวลาอื่น"
            : "กรุณาเลือกช่วงเวลาอื่น",
      },
    });

  } catch (error) {
    console.error("Error in POST /api/capacity:", error);

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
        message: "Failed to check capacity availability",
      },
    }, { status: 500 });
  }
}

/**
 * PUT method not supported for capacity endpoint
 * Capacity is updated through registration flow only
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "PUT method not supported for capacity endpoint",
    },
  }, { status: 405 });
}

/**
 * DELETE method not supported for capacity endpoint
 * Capacity changes are managed through business processes
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "DELETE method not supported for capacity endpoint",
    },
  }, { status: 405 });
}
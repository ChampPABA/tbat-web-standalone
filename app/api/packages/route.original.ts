import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { getCachedData, getCachedPackages } from "@/lib/edge-config";
import { 
  getCachedPackageData, 
  setCachedPackageData,
  getCachedPackageAvailability,
  setCachedPackageAvailability 
} from "@/lib/redis";
import { calculateSessionCapacity } from "@/lib/capacity";

const prisma = new PrismaClient();

// Request validation schema
const packagesQuerySchema = z.object({
  includeAvailability: z.string().optional().default("true"),
  sessionTime: z.enum(["MORNING", "AFTERNOON"]).optional(),
  examDate: z.string().optional(),
});

// Response interfaces
interface PackageResponse {
  id: string;
  type: "FREE" | "ADVANCED";
  price: number;
  currency: string;
  features: string[];
  description: string;
  isActive: boolean;
  availability?: {
    available: boolean;
    message: string;
    messageEn: string;
    sessionCapacity?: {
      morning: any;
      afternoon: any;
    };
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    packages: PackageResponse[];
    metadata: {
      totalPackages: number;
      activePackages: number;
      examDate?: string;
      lastUpdated: string;
      cacheHit: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /api/packages
 * Returns package information with pricing, features, and availability
 * Implements hybrid caching: Edge Config → Redis → Database
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, rateLimitConfigs.api);
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<ApiResponse>;
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      includeAvailability: url.searchParams.get("includeAvailability") || "true",
      sessionTime: url.searchParams.get("sessionTime") as "MORNING" | "AFTERNOON" | undefined,
      examDate: url.searchParams.get("examDate"),
    };

    const validatedParams = packagesQuerySchema.parse(queryParams);
    const examDate = validatedParams.examDate || "2025-09-27"; // Default exam date
    
    let cacheHit = false;

    // Get packages using hybrid caching strategy
    let packages = await getCachedPackageData();
    
    if (packages) {
      cacheHit = true;
    } else {
      // Cache miss - fetch from database
      packages = await prisma.package.findMany({
        where: { isActive: true },
        orderBy: { type: "asc" }, // FREE first, then ADVANCED
      });

      // Cache for 5 minutes
      await setCachedPackageData(packages);
    }

    // Transform packages and add availability if requested
    const packageResponses: PackageResponse[] = await Promise.all(
      packages.map(async (pkg: any) => {
        const packageResponse: PackageResponse = {
          id: pkg.id,
          type: pkg.type,
          price: pkg.price,
          currency: pkg.currency,
          features: pkg.features,
          description: pkg.description,
          isActive: pkg.isActive,
        };

        // Add availability information if requested
        if (validatedParams.includeAvailability === "true") {
          packageResponse.availability = await getPackageAvailability(
            pkg.type,
            examDate,
            validatedParams.sessionTime
          );
        }

        return packageResponse;
      })
    );

    // Prepare response metadata
    const metadata = {
      totalPackages: packages.length,
      activePackages: packages.filter((pkg: any) => pkg.isActive).length,
      examDate: validatedParams.includeAvailability === "true" ? examDate : undefined,
      lastUpdated: new Date().toISOString(),
      cacheHit,
    };

    return NextResponse.json({
      success: true,
      data: {
        packages: packageResponses,
        metadata,
      },
    });

  } catch (error) {
    console.error("Error in GET /api/packages:", error);

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
        message: "Failed to fetch packages",
      },
    }, { status: 500 });
  }
}

/**
 * Get package availability information with caching
 */
async function getPackageAvailability(
  packageType: "FREE" | "ADVANCED",
  examDate: string,
  sessionTime?: "MORNING" | "AFTERNOON"
) {
  try {
    // Try to get availability from cache first
    let availability = await getCachedPackageAvailability(packageType);
    
    if (!availability) {
      // Calculate availability for both sessions
      const [morningCapacity, afternoonCapacity] = await Promise.all([
        calculateSessionCapacity("MORNING", examDate),
        calculateSessionCapacity("AFTERNOON", examDate),
      ]);

      // Determine package-specific availability
      let available = true;
      let message = "ยังมีที่นั่งว่าง";
      let messageEn = "Seats available";

      if (packageType === "FREE") {
        // Check Free package availability
        const morningFreeAvailable = morningCapacity.freeCount < morningCapacity.freeLimit;
        const afternoonFreeAvailable = afternoonCapacity.freeCount < afternoonCapacity.freeLimit;
        
        if (!morningFreeAvailable && !afternoonFreeAvailable) {
          available = false;
          message = "Free Package เต็มแล้ว - กรุณาอัปเกรดเป็น Advanced Package";
          messageEn = "Free Package full - Please upgrade to Advanced Package";
        } else if (!morningFreeAvailable || !afternoonFreeAvailable) {
          message = "Free Package ที่นั่งเหลือน้อย";
          messageEn = "Limited Free Package seats remaining";
        }
      } else {
        // Check Advanced package availability (can use remaining capacity after Free)
        const morningTotalAvailable = morningCapacity.totalCount < morningCapacity.maxCapacity;
        const afternoonTotalAvailable = afternoonCapacity.totalCount < afternoonCapacity.maxCapacity;
        
        if (!morningTotalAvailable && !afternoonTotalAvailable) {
          available = false;
          message = "เต็มแล้ว";
          messageEn = "Session is full";
        }
      }

      availability = {
        available,
        message,
        messageEn,
        sessionCapacity: {
          morning: {
            ...morningCapacity,
            // Hide exact free count as per business requirements
            freeCount: morningCapacity.hideExactCount ? undefined : morningCapacity.freeCount,
          },
          afternoon: {
            ...afternoonCapacity,
            // Hide exact free count as per business requirements
            freeCount: afternoonCapacity.hideExactCount ? undefined : afternoonCapacity.freeCount,
          },
        },
      };

      // Cache availability for 1 minute (dynamic data)
      await setCachedPackageAvailability(packageType, availability);
    }

    // Filter by session time if specified
    if (sessionTime) {
      const sessionKey = sessionTime.toLowerCase() as keyof typeof availability.sessionCapacity;
      availability = {
        ...availability,
        sessionCapacity: {
          [sessionKey]: availability.sessionCapacity[sessionKey],
        },
      };
    }

    return availability;
  } catch (error) {
    console.error("Error getting package availability:", error);
    
    // Return safe defaults on error
    return {
      available: true,
      message: "ยังมีที่นั่งว่าง",
      messageEn: "Seats available",
      sessionCapacity: undefined,
    };
  }
}

/**
 * POST method not supported for packages endpoint
 * Packages are managed through admin interface only
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "POST method not supported for packages endpoint",
    },
  }, { status: 405 });
}

/**
 * PUT method not supported for packages endpoint
 * Packages are managed through admin interface only  
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "PUT method not supported for packages endpoint",
    },
  }, { status: 405 });
}

/**
 * DELETE method not supported for packages endpoint
 * Packages are managed through admin interface only
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "DELETE method not supported for packages endpoint",
    },
  }, { status: 405 });
}
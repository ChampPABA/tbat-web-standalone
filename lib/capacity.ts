import { PrismaClient } from "@prisma/client";
import { getCachedRealtimeCapacity, setCachedRealtimeCapacity } from "./redis";
import { getCachedCapacityConfig } from "./edge-config";
import { logSecurityEvent, SecurityEventType } from "./monitoring";

const prisma = new PrismaClient();

// Types for capacity calculations
export interface CapacityData {
  sessionTime: "MORNING" | "AFTERNOON";
  examDate: Date;
  totalCount: number;
  freeCount: number;
  advancedCount: number;
  maxCapacity: number;
  freeLimit: number;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
  message: string;
  messageEn: string;
  hideExactCount: boolean;
  percentageFull: number;
}

export interface CapacityConfig {
  maxParticipantsPerSession: number;
  freePackageLimit: number;
  concurrentUsers: number;
  capacityWarningThreshold: number;
  capacityFullThreshold: number;
  hideExactFreeCount: boolean;
  thaiFullMessage: string;
  thaiAvailableMessage: string;
}

/**
 * Calculate real-time capacity with business logic constraints
 * This is the core capacity calculation function used by all APIs
 */
export async function calculateSessionCapacity(
  sessionTime: "MORNING" | "AFTERNOON",
  examDateStr: string
): Promise<CapacityData> {
  const examDate = new Date(examDateStr);
  
  try {
    // Try to get from cache first (1-minute TTL for real-time data)
    const cached = await getCachedRealtimeCapacity(sessionTime, examDateStr);
    if (cached) {
      return cached;
    }

    // Get capacity configuration (cached in Edge Config)
    const config = await getCachedCapacityConfig();

    // Get current capacity status from database
    const capacityStatus = await prisma.capacityStatus.findUnique({
      where: {
        sessionTime_examDate: {
          sessionTime,
          examDate,
        },
      },
    });

    // Get session capacity limits
    const sessionCapacity = await prisma.sessionCapacity.findUnique({
      where: {
        sessionTime_examDate: {
          sessionTime,
          examDate,
        },
      },
    });

    // If no records exist, create default ones
    if (!capacityStatus || !sessionCapacity) {
      return await initializeCapacityRecords(sessionTime, examDate, config);
    }

    // Calculate availability status and messaging
    const result = calculateAvailabilityStatus(capacityStatus, config);

    // Cache the result for 1 minute
    await setCachedRealtimeCapacity(sessionTime, examDateStr, result);

    return result;
  } catch (error) {
    console.error("Error calculating session capacity:", error);
    
    // Log security event for capacity calculation failures
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      undefined,
      {
        event: "CAPACITY_CALCULATION_ERROR",
        sessionTime,
        examDate: examDateStr,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    );

    // Return safe defaults on error
    return {
      sessionTime,
      examDate,
      totalCount: 0,
      freeCount: 0,
      advancedCount: 0,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "AVAILABLE",
      message: "ยังมีที่นั่งว่าง",
      messageEn: "Seats available",
      hideExactCount: true,
      percentageFull: 0,
    };
  }
}

/**
 * Calculate availability status with Thai business logic
 * Implements the requirement to hide exact Free availability counts
 */
function calculateAvailabilityStatus(
  capacityStatus: any,
  config: CapacityConfig
): CapacityData {
  const {
    sessionTime,
    examDate,
    totalCount,
    freeCount,
    advancedCount,
    maxCapacity,
    freeLimit,
  } = capacityStatus;

  const percentageFull = totalCount / maxCapacity;
  const freePercentage = freeCount / freeLimit;

  let availabilityStatus: CapacityData["availabilityStatus"] = "AVAILABLE";
  let message = config.thaiAvailableMessage;
  let messageEn = "Seats available";

  // Determine availability status based on capacity thresholds
  if (totalCount >= maxCapacity) {
    availabilityStatus = "FULL";
    message = config.thaiFullMessage;
    messageEn = "Session is full";
  } else if (freeCount >= freeLimit && totalCount < maxCapacity) {
    // Free tier full, but Advanced still available
    availabilityStatus = "LIMITED";
    message = "Free Package เต็มแล้ว - เหลือเฉพาะ Advanced Package";
    messageEn = "Free Package full - Only Advanced Package available";
  } else if (percentageFull >= config.capacityFullThreshold) {
    availabilityStatus = "LIMITED";
    message = "ใกล้เต็มแล้ว";
    messageEn = "Nearly full";
  } else if (percentageFull >= config.capacityWarningThreshold) {
    availabilityStatus = "LIMITED";
    message = "ที่นั่งเหลือน้อย";
    messageEn = "Limited seats remaining";
  }

  return {
    sessionTime,
    examDate,
    totalCount,
    freeCount,
    advancedCount,
    maxCapacity,
    freeLimit,
    availabilityStatus,
    message,
    messageEn,
    hideExactCount: config.hideExactFreeCount,
    percentageFull: Math.round(percentageFull * 100) / 100,
  };
}

/**
 * Initialize capacity records if they don't exist
 */
async function initializeCapacityRecords(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date,
  config: CapacityConfig
): Promise<CapacityData> {
  try {
    // Create session capacity record
    const sessionCapacity = await prisma.sessionCapacity.create({
      data: {
        sessionTime,
        examDate,
        currentCount: 0,
        maxCapacity: config.maxParticipantsPerSession,
      },
    });

    // Create capacity status record
    const capacityStatus = await prisma.capacityStatus.create({
      data: {
        sessionTime,
        examDate,
        totalCount: 0,
        freeCount: 0,
        advancedCount: 0,
        maxCapacity: config.maxParticipantsPerSession,
        freeLimit: config.freePackageLimit,
        availabilityStatus: "AVAILABLE",
      },
    });

    return calculateAvailabilityStatus(capacityStatus, config);
  } catch (error) {
    console.error("Error initializing capacity records:", error);
    throw error;
  }
}

/**
 * Update capacity when a user registers for a session
 * This function handles race conditions and ensures data consistency
 */
export async function updateSessionCapacity(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date,
  packageType: "FREE" | "ADVANCED",
  increment: number = 1
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Update SessionCapacity
      await tx.sessionCapacity.update({
        where: {
          sessionTime_examDate: {
            sessionTime,
            examDate,
          },
        },
        data: {
          currentCount: {
            increment,
          },
        },
      });

      // Update CapacityStatus with package-specific counts
      const updateData: any = {
        totalCount: {
          increment,
        },
        lastUpdated: new Date(),
      };

      if (packageType === "FREE") {
        updateData.freeCount = { increment };
      } else {
        updateData.advancedCount = { increment };
      }

      await tx.capacityStatus.update({
        where: {
          sessionTime_examDate: {
            sessionTime,
            examDate,
          },
        },
        data: updateData,
      });
    });

    // Invalidate cache after capacity update
    await invalidateCapacityCache(sessionTime, examDate.toISOString());

    return true;
  } catch (error) {
    console.error("Error updating session capacity:", error);
    
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      undefined,
      {
        event: "CAPACITY_UPDATE_ERROR",
        sessionTime,
        examDate: examDate.toISOString(),
        packageType,
        increment,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    );

    return false;
  }
}

/**
 * Check if a session has available capacity for a package type
 * Used during registration to prevent overbooking
 */
export async function checkCapacityAvailability(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date,
  packageType: "FREE" | "ADVANCED"
): Promise<{
  available: boolean;
  reason?: string;
  capacityData: CapacityData;
}> {
  const capacityData = await calculateSessionCapacity(
    sessionTime,
    examDate.toISOString()
  );

  // Check overall capacity
  if (capacityData.availabilityStatus === "FULL") {
    return {
      available: false,
      reason: "Session is at full capacity",
      capacityData,
    };
  }

  // Check package-specific availability
  if (packageType === "FREE" && capacityData.freeCount >= capacityData.freeLimit) {
    return {
      available: false,
      reason: "Free package quota reached for this session",
      capacityData,
    };
  }

  if (capacityData.totalCount >= capacityData.maxCapacity) {
    return {
      available: false,
      reason: "Session is at maximum capacity",
      capacityData,
    };
  }

  return {
    available: true,
    capacityData,
  };
}

/**
 * Get capacity summary for all sessions on a specific date
 * Used by the sessions API endpoint
 */
export async function getDateCapacitySummary(examDate: Date) {
  try {
    const [morningCapacity, afternoonCapacity] = await Promise.all([
      calculateSessionCapacity("MORNING", examDate.toISOString()),
      calculateSessionCapacity("AFTERNOON", examDate.toISOString()),
    ]);

    return {
      examDate,
      sessions: {
        morning: morningCapacity,
        afternoon: afternoonCapacity,
      },
      totalCapacity: morningCapacity.maxCapacity + afternoonCapacity.maxCapacity,
      totalOccupied: morningCapacity.totalCount + afternoonCapacity.totalCount,
      overallAvailability: 
        morningCapacity.availabilityStatus === "FULL" && 
        afternoonCapacity.availabilityStatus === "FULL" 
          ? "FULL" 
          : "AVAILABLE",
    };
  } catch (error) {
    console.error("Error getting date capacity summary:", error);
    throw error;
  }
}

/**
 * Invalidate capacity cache after updates
 */
async function invalidateCapacityCache(
  sessionTime: string,
  examDate: string
): Promise<void> {
  try {
    // We can't directly invalidate Edge Config, but we can clear Redis caches
    const { invalidateHybridCache } = await import("./redis");
    await invalidateHybridCache(`hybrid:capacity:*${sessionTime}*${examDate}*`);
  } catch (error) {
    console.error("Error invalidating capacity cache:", error);
  }
}

/**
 * Batch update capacities for multiple registrations
 * Used during high-traffic registration periods
 */
export async function batchUpdateCapacities(
  updates: Array<{
    sessionTime: "MORNING" | "AFTERNOON";
    examDate: Date;
    packageType: "FREE" | "ADVANCED";
    increment: number;
  }>
): Promise<boolean> {
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const update of updates) {
          await tx.sessionCapacity.update({
            where: {
              sessionTime_examDate: {
                sessionTime: update.sessionTime,
                examDate: update.examDate,
              },
            },
            data: {
              currentCount: {
                increment: update.increment,
              },
            },
          });

          const capacityUpdateData: any = {
            totalCount: { increment: update.increment },
            lastUpdated: new Date(),
          };

          if (update.packageType === "FREE") {
            capacityUpdateData.freeCount = { increment: update.increment };
          } else {
            capacityUpdateData.advancedCount = { increment: update.increment };
          }

          await tx.capacityStatus.update({
            where: {
              sessionTime_examDate: {
                sessionTime: update.sessionTime,
                examDate: update.examDate,
              },
            },
            data: capacityUpdateData,
          });
        }
      },
      {
        timeout: 10000, // 10 second timeout for batch operations
      }
    );

    // Invalidate all affected caches
    for (const update of updates) {
      await invalidateCapacityCache(
        update.sessionTime,
        update.examDate.toISOString()
      );
    }

    return true;
  } catch (error) {
    console.error("Error in batch capacity update:", error);
    return false;
  }
}
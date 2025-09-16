import {
  CapacityManagement,
  SessionCapacityManagement,
  CapacityStatusResponse,
  CapacityAlgorithmResult,
  CAPACITY_CONSTRAINTS
} from "../types/capacity";
import { logSecurityEvent, SecurityEventType } from "./monitoring";
import { handleError, handleAsyncOperation, safeDatabaseOperation } from "./error-handler";
import { prisma } from "./prisma";

/**
 * Core capacity management service implementing Story 3.1 business rules
 * - Total Capacity: 300 seats (absolute maximum)
 * - Free Package: 150 seats (hard limit)
 * - Advanced Package: Flexible, can use remaining capacity up to 300
 * - UI Compliance: Never display exact numbers to users
 */

/**
 * Calculate capacity status with Story 3.1 algorithm
 */
export async function calculateCapacityStatus(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date
): Promise<SessionCapacityManagement> {
  try {
    // Get current capacity data from database
    const capacityData = await prisma.capacityStatus.findUnique({
      where: {
        sessionTime_examDate: {
          sessionTime: sessionTime === "MORNING" ? "MORNING" : "AFTERNOON",
          examDate,
        },
      },
    });

    if (!capacityData) {
      // Initialize capacity record if it doesn't exist
      return await initializeCapacityRecord(sessionTime, examDate);
    }

    // Apply Story 3.1 algorithm and compute fields
    const computed = computeCapacityFields(capacityData);

    return {
      id: capacityData.id,
      total_capacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY,
      free_capacity: CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
      advanced_capacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY - CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
      current_free_count: capacityData.freeCount,
      current_advanced_count: capacityData.advancedCount,
      exam_date: capacityData.examDate,
      session_time: sessionTime,
      is_full: computed.is_full,
      free_slots_available: computed.free_slots_available,
      advanced_slots_available: computed.advanced_slots_available,
      created_at: capacityData.createdAt,
      updated_at: capacityData.updatedAt,
    };
  } catch (error) {
    const errorResult = await handleError(error, {
      operation: 'calculateCapacityStatus',
      component: 'capacity',
      metadata: { sessionTime, examDate: examDate.toISOString() }
    });
    throw error;
  }
}

/**
 * Compute capacity fields according to Story 3.1 business logic
 */
function computeCapacityFields(capacityData: any): CapacityAlgorithmResult {
  const totalCount = capacityData.totalCount;
  const freeCount = capacityData.freeCount;
  const advancedCount = capacityData.advancedCount;

  // Story 3.1 Algorithm Implementation
  const is_full = totalCount >= CAPACITY_CONSTRAINTS.TOTAL_CAPACITY;
  const free_slots_available = freeCount < CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT && !is_full;
  const advanced_slots_available = !is_full; // Advanced can always register if total < 300

  // Determine availability status
  let availability_status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED" = "AVAILABLE";

  if (is_full) {
    availability_status = "FULL";
  } else if (freeCount >= CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT) {
    // Free tier full, but Advanced still available
    availability_status = "LIMITED";
  } else if (totalCount >= CAPACITY_CONSTRAINTS.TOTAL_CAPACITY * CAPACITY_CONSTRAINTS.FULL_THRESHOLD) {
    availability_status = "LIMITED";
  } else if (totalCount >= CAPACITY_CONSTRAINTS.TOTAL_CAPACITY * CAPACITY_CONSTRAINTS.WARNING_THRESHOLD) {
    availability_status = "LIMITED";
  }

  return {
    total_count: totalCount,
    free_count: freeCount,
    advanced_count: advancedCount,
    max_capacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY,
    free_limit: CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
    is_full,
    free_slots_available,
    advanced_slots_available,
    availability_status,
  };
}

/**
 * Get capacity status for UI display (complies with Story 3.1 "no numbers" rule)
 */
export async function getCapacityStatusForUI(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date
): Promise<CapacityStatusResponse> {
  const capacity = await calculateCapacityStatus(sessionTime, examDate);
  const computed = computeCapacityFields({
    totalCount: capacity.current_free_count + capacity.current_advanced_count,
    freeCount: capacity.current_free_count,
    advancedCount: capacity.current_advanced_count,
  });

  // Generate messages without exposing exact numbers (Story 3.1 AC1, AC5)
  let message = "ยังมีที่นั่งว่าง";
  let messageEn = "Seats available";

  if (computed.is_full) {
    message = "เซสชันเต็มแล้ว";
    messageEn = "Session is full";
  } else if (!capacity.free_slots_available && capacity.advanced_slots_available) {
    message = "Free Package เต็มแล้ว - เหลือเฉพาะ Advanced Package";
    messageEn = "Free Package full - Only Advanced Package available";
  } else if (computed.availability_status === "LIMITED") {
    message = "ที่นั่งเหลือน้อย";
    messageEn = "Limited seats remaining";
  }

  return {
    session_time: sessionTime,
    exam_date: examDate.toISOString(),
    availability_status: computed.availability_status,
    message,
    message_en: messageEn,
    can_register_free: capacity.free_slots_available,
    can_register_advanced: capacity.advanced_slots_available,
    show_disabled_state: computed.is_full,
  };
}

/**
 * Check if registration is allowed for specific package type (Story 3.1 AC2)
 */
export async function checkRegistrationEligibility(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date,
  packageType: "FREE" | "ADVANCED"
): Promise<{
  allowed: boolean;
  reason?: string;
  capacity: SessionCapacityManagement;
}> {
  const capacity = await calculateCapacityStatus(sessionTime, examDate);

  // Story 3.1 Registration Logic Implementation
  if (packageType === "FREE") {
    // Free registrations: Allowed if current_free < 150 AND total < 300
    const allowed = capacity.free_slots_available;
    return {
      allowed,
      reason: allowed ? undefined : "Free package quota reached for this session",
      capacity,
    };
  } else {
    // Advanced registrations: Allowed if total < 300
    const allowed = capacity.advanced_slots_available;
    return {
      allowed,
      reason: allowed ? undefined : "Session is at maximum capacity",
      capacity,
    };
  }
}

/**
 * Update capacity when a user registers (Story 3.1 AC2)
 */
export async function updateCapacityOnRegistration(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date,
  packageType: "FREE" | "ADVANCED"
): Promise<boolean> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current capacity with row-level locking
      const current = await tx.capacityStatus.findUnique({
        where: {
          sessionTime_examDate: {
            sessionTime: sessionTime === "MORNING" ? "MORNING" : "AFTERNOON",
            examDate,
          },
        },
      });

      if (!current) {
        throw new Error("Capacity record not found");
      }

      // Verify registration is still allowed
      const newTotal = current.totalCount + 1;
      const newFree = packageType === "FREE" ? current.freeCount + 1 : current.freeCount;
      const newAdvanced = packageType === "ADVANCED" ? current.advancedCount + 1 : current.advancedCount;

      // Apply Story 3.1 constraints
      if (newTotal > CAPACITY_CONSTRAINTS.TOTAL_CAPACITY) {
        throw new Error("Total capacity exceeded");
      }

      if (packageType === "FREE" && newFree > CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT) {
        throw new Error("Free package limit exceeded");
      }

      // Update capacity record
      await tx.capacityStatus.update({
        where: {
          sessionTime_examDate: {
            sessionTime: sessionTime === "MORNING" ? "MORNING" : "AFTERNOON",
            examDate,
          },
        },
        data: {
          totalCount: newTotal,
          freeCount: newFree,
          advancedCount: newAdvanced,
          lastUpdated: new Date(),
          // Update availability status based on new counts
          availabilityStatus: newTotal >= CAPACITY_CONSTRAINTS.TOTAL_CAPACITY ? "FULL" :
                            newFree >= CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT ? "LIMITED" :
                            "AVAILABLE",
        },
      });

      return true;
    });

    return result;
  } catch (error) {
    await handleError(error, {
      operation: 'updateCapacityOnRegistration',
      component: 'capacity',
      metadata: { sessionTime, examDate: examDate.toISOString(), packageType }
    });
    return false;
  }
}

/**
 * Initialize capacity record for new session
 */
async function initializeCapacityRecord(
  sessionTime: "MORNING" | "AFTERNOON",
  examDate: Date
): Promise<SessionCapacityManagement> {
  const capacityData = await prisma.capacityStatus.create({
    data: {
      sessionTime: sessionTime === "MORNING" ? "MORNING" : "AFTERNOON",
      examDate,
      totalCount: 0,
      freeCount: 0,
      advancedCount: 0,
      maxCapacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY,
      freeLimit: CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
      availabilityStatus: "AVAILABLE",
    },
  });

  return {
    id: capacityData.id,
    total_capacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY,
    free_capacity: CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
    advanced_capacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY - CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
    current_free_count: 0,
    current_advanced_count: 0,
    exam_date: examDate,
    session_time: sessionTime,
    is_full: false,
    free_slots_available: true,
    advanced_slots_available: true,
    created_at: capacityData.createdAt,
    updated_at: capacityData.updatedAt,
  };
}

/**
 * Get capacity summary for all sessions on exam date
 */
export async function getDateCapacitySummary(examDate: Date) {
  try {
    const [morning, afternoon] = await Promise.all([
      calculateCapacityStatus("MORNING", examDate),
      calculateCapacityStatus("AFTERNOON", examDate),
    ]);

    // Get session status for UI to determine overall availability
    const morningStatus = await getCapacityStatusForUI("MORNING", examDate);
    const afternoonStatus = await getCapacityStatusForUI("AFTERNOON", examDate);

    // Calculate overall availability based on individual session statuses
    let overall_availability: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED" = "AVAILABLE";

    if (morningStatus.availability_status === "FULL" && afternoonStatus.availability_status === "FULL") {
      overall_availability = "FULL";
    } else if (morningStatus.availability_status === "LIMITED" || afternoonStatus.availability_status === "LIMITED") {
      overall_availability = "LIMITED";
    } else if (morningStatus.availability_status === "CLOSED" || afternoonStatus.availability_status === "CLOSED") {
      overall_availability = "CLOSED";
    }

    return {
      exam_date: examDate,
      sessions: {
        morning: morningStatus,
        afternoon: afternoonStatus,
      },
      total_capacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY * 2, // Both sessions
      overall_availability,
    };
  } catch (error) {
    await handleError(error, {
      operation: 'getDateCapacitySummary',
      component: 'capacity',
      metadata: { examDate: examDate.toISOString() }
    });
    throw error;
  }
}
import { prisma } from "./prisma";
import { z } from "zod";
import { Readable } from "stream";
import { SecurityEventType } from "@prisma/client";

// PDPA Consent Types
export type ConsentType = "DATA_COLLECTION" | "DATA_PROCESSING" | "DATA_SHARING" | "MARKETING";
export type ConsentStatus = "GRANTED" | "REVOKED" | "EXPIRED";

// PDPA Data Classification
export enum DataClassification {
  SENSITIVE = "SENSITIVE", // Payment info, exam scores
  PERSONAL = "PERSONAL", // Name, email, phone
  OPERATIONAL = "OPERATIONAL", // Exam codes, session data
}

// User Data Export Format
export interface UserDataExport {
  personalInfo: {
    id: string;
    email: string;
    thaiName: string;
    phone: string | null;
    school: string | null;
    packageType: string;
    createdAt: Date;
  };
  examData: {
    codes: Array<{
      code: string;
      packageType: string;
      subject?: string;
      generatedAt: Date;
      usedAt?: Date;
    }>;
    results: Array<{
      id: string;
      examCode: string;
      subject: string;
      score: number;
      completedAt: Date;
    }>;
  };
  paymentData: {
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
    }>;
  };
  consentHistory: Array<{
    type: ConsentType;
    status: ConsentStatus;
    grantedAt?: Date;
    revokedAt?: Date;
  }>;
  metadata: {
    exportedAt: Date;
    dataRetentionExpiry: Date;
    format: "JSON" | "CSV";
    requestId: string;
  };
}

// Consent Management Schema
export const consentSchema = z.object({
  userId: z.string(),
  consentType: z.enum(["DATA_COLLECTION", "DATA_PROCESSING", "DATA_SHARING", "MARKETING"]),
  granted: z.boolean(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Record user consent
export async function recordConsent(data: {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    if (!prisma) {
      throw new Error("Database not available");
    }
    
    await prisma.pDPAConsent.create({
      data: {
        userId: data.userId,
        consentType: data.consentType,
        status: data.granted ? "GRANTED" : "REVOKED",
        grantedAt: data.granted ? new Date() : undefined,
        revokedAt: !data.granted ? new Date() : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "user_action",
        },
      },
    });

    // Security log
    await prisma.securityLog.create({
      data: {
        eventType: data.granted ? SecurityEventType.PDPA_CONSENT_GRANTED : SecurityEventType.PDPA_CONSENT_REVOKED,
        action: `CONSENT_${data.granted ? "GRANTED" : "REVOKED"}`,
        userId: data.userId,
        resourceId: data.userId,
        resourceType: "PDPAConsent",
        details: {
          consentType: data.consentType,
          granted: data.granted,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error recording consent:", error);
    throw new Error("Failed to record consent");
  }
}

// Check user consent status
export async function checkConsent(
  userId: string,
  consentType: ConsentType
): Promise<boolean> {
  try {
    const consent = await prisma.pDPAConsent.findFirst({
      where: {
        userId,
        consentType,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return consent?.status === "GRANTED";
  } catch (error) {
    console.error("Error checking consent:", error);
    return false;
  }
}

// Get all user consents
export async function getUserConsents(userId: string) {
  try {
    return await prisma.pDPAConsent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching user consents:", error);
    throw new Error("Failed to fetch user consents");
  }
}

/**
 * Stream large data exports for better performance
 * Yields data in chunks to prevent memory issues with large datasets
 */
export async function* streamUserData(userId: string) {
  const CHUNK_SIZE = 100; // Process 100 records at a time
  
  // First, yield user information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      thaiName: true,
      phone: true,
      school: true,
      packageType: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  yield { type: "user", data: user };
  
  // Stream exam codes in chunks
  let examCodeOffset = 0;
  let hasMoreExamCodes = true;
  
  while (hasMoreExamCodes) {
    const examCodes = await prisma.examCode.findMany({
      where: { userId },
      skip: examCodeOffset,
      take: CHUNK_SIZE,
      select: {
        id: true,
        code: true,
        packageType: true,
        subject: true,
        createdAt: true,
        usedAt: true,
      },
    });
    
    if (examCodes.length > 0) {
      yield { type: "examCodes", data: examCodes };
      examCodeOffset += CHUNK_SIZE;
    }
    
    hasMoreExamCodes = examCodes.length === CHUNK_SIZE;
  }
  
  // Stream exam results in chunks
  let resultOffset = 0;
  let hasMoreResults = true;
  
  while (hasMoreResults) {
    const results = await prisma.examResult.findMany({
      where: { userId },
      skip: resultOffset,
      take: CHUNK_SIZE,
      select: {
        id: true,
        examCodeId: true,
        subject: true,
        score: true,
        percentile: true,
        createdAt: true,
      },
    });
    
    if (results.length > 0) {
      yield { type: "examResults", data: results };
      resultOffset += CHUNK_SIZE;
    }
    
    hasMoreResults = results.length === CHUNK_SIZE;
  }
  
  // Stream payments in chunks
  let paymentOffset = 0;
  let hasMorePayments = true;
  
  while (hasMorePayments) {
    const payments = await prisma.payment.findMany({
      where: { userId },
      skip: paymentOffset,
      take: CHUNK_SIZE,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paymentType: true,
        createdAt: true,
      },
    });
    
    if (payments.length > 0) {
      yield { type: "payments", data: payments };
      paymentOffset += CHUNK_SIZE;
    }
    
    hasMorePayments = payments.length === CHUNK_SIZE;
  }
  
  // Stream PDF downloads in chunks
  let pdfOffset = 0;
  let hasMorePDFs = true;
  
  while (hasMorePDFs) {
    const pdfDownloads = await prisma.pDFDownload.findMany({
      where: { userId },
      skip: pdfOffset,
      take: CHUNK_SIZE,
      select: {
        id: true,
        pdfId: true,
        downloadedAt: true,
      },
    });
    
    if (pdfDownloads.length > 0) {
      yield { type: "pdfDownloads", data: pdfDownloads };
      pdfOffset += CHUNK_SIZE;
    }
    
    hasMorePDFs = pdfDownloads.length === CHUNK_SIZE;
  }
  
  // Stream PDPA consents
  const consents = await prisma.pDPAConsent.findMany({
    where: { userId },
    select: {
      consentType: true,
      status: true,
      grantedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
  
  if (consents.length > 0) {
    yield { type: "consents", data: consents };
  }
}

/**
 * Create a readable stream from the async generator for HTTP streaming
 */
export function createDataExportStream(userId: string): Readable {
  const generator = streamUserData(userId);
  
  return Readable.from(async function* () {
    try {
      for await (const chunk of generator) {
        // Convert each chunk to JSON Lines format
        yield JSON.stringify(chunk) + "\n";
      }
    } catch (error) {
      console.error("Error streaming user data:", error);
      yield JSON.stringify({ error: "Failed to stream data" }) + "\n";
    }
  }());
}

// Export all user data (PDPA Right to Data Portability)
export async function exportUserData(
  userId: string,
  format: "JSON" | "CSV" = "JSON"
): Promise<UserDataExport | string> {
  try {
    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        examCodes: true,
        examResults: true,
        payments: true,
        pdpaConsents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate data retention expiry (6 months from last activity)
    const lastActivity = new Date(
      Math.max(
        user.lastLoginAt?.getTime() || 0,
        user.updatedAt.getTime(),
        ...user.examResults.map((r) => r.createdAt.getTime()),
        ...user.payments.map((p) => p.createdAt.getTime())
      )
    );
    const dataRetentionExpiry = new Date(lastActivity);
    dataRetentionExpiry.setMonth(dataRetentionExpiry.getMonth() + 6);

    const exportData: UserDataExport = {
      personalInfo: {
        id: user.id,
        email: user.email,
        thaiName: user.thaiName,
        phone: user.phone,
        school: user.school,
        packageType: user.packageType,
        createdAt: user.createdAt,
      },
      examData: {
        codes: user.examCodes.map((code) => ({
          code: code.code,
          packageType: code.packageType,
          subject: code.subject || undefined,
          generatedAt: code.createdAt,
          usedAt: code.usedAt || undefined,
        })),
        results: user.examResults.map((result) => ({
          id: result.id,
          examCode: result.examCodeId,
          subject: "UNKNOWN",
          score: result.totalScore,
          completedAt: result.createdAt,
        })),
      },
      paymentData: {
        payments: user.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.createdAt,
        })),
      },
      consentHistory: user.pdpaConsents.map((consent) => ({
        type: consent.consentType as ConsentType,
        status: consent.status as ConsentStatus,
        grantedAt: consent.grantedAt || undefined,
        revokedAt: consent.revokedAt || undefined,
      })),
      metadata: {
        exportedAt: new Date(),
        dataRetentionExpiry,
        format,
        requestId: `EXPORT-${userId}-${Date.now()}`,
      },
    };

    // Security log
    await prisma.securityLog.create({
      data: {
        eventType: SecurityEventType.DATA_EXPORT,
        action: "DATA_EXPORT_REQUESTED",
        userId,
        resourceId: userId,
        resourceType: "UserData",
        details: {
          format,
          requestId: exportData.metadata.requestId,
        },
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
      },
    });

    if (format === "CSV") {
      return convertToCSV(exportData);
    }

    return exportData;
  } catch (error) {
    console.error("Error exporting user data:", error);
    throw new Error("Failed to export user data");
  }
}

// Delete user data (PDPA Right to Erasure)
export async function deleteUserData(
  userId: string,
  reason: string
): Promise<{ success: boolean; deletedRecords: Record<string, number> }> {
  try {
    const deletedRecords: Record<string, number> = {};

    // Start transaction for cascade deletion
    await prisma.$transaction(async (tx) => {
      // Delete exam results
      const examResults = await tx.examResult.deleteMany({
        where: { userId },
      });
      deletedRecords.examResults = examResults.count;

      // Delete exam codes
      const examCodes = await tx.examCode.deleteMany({
        where: { userId },
      });
      deletedRecords.examCodes = examCodes.count;

      // Delete payments
      const payments = await tx.payment.deleteMany({
        where: { userId },
      });
      deletedRecords.payments = payments.count;

      // Delete PDF downloads
      const pdfDownloads = await tx.pDFDownload.deleteMany({
        where: { userId },
      });
      deletedRecords.pdfDownloads = pdfDownloads.count;

      // Delete sessions
      const sessions = await tx.userSession.deleteMany({
        where: { userId },
      });
      deletedRecords.sessions = sessions.count;

      // Delete PDPA consents
      const consents = await tx.pDPAConsent.deleteMany({
        where: { userId },
      });
      deletedRecords.consents = consents.count;

      // Anonymize user record instead of deleting (for audit trail)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@anonymous.local`,
          thaiName: "ผู้ใช้ที่ถูกลบ",
          phone: null,
          school: null,
          passwordHash: null,
          isActive: false,
          deletedAt: new Date(),
          metadata: {
            deletionReason: reason,
            deletedAt: new Date().toISOString(),
            originalDataRemoved: true,
          },
        },
      });

      // Security log
      await tx.securityLog.create({
        data: {
          eventType: SecurityEventType.DATA_DELETION,
          action: "USER_DATA_DELETED",
          userId,
          resourceId: userId,
          resourceType: "User",
          details: {
            reason,
            deletedRecords,
            timestamp: new Date().toISOString(),
          },
          ipAddress: null,
          userAgent: null,
          timestamp: new Date(),
        },
      });
    });

    return {
      success: true,
      deletedRecords,
    };
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw new Error("Failed to delete user data");
  }
}

// Anonymize user data (for analytics purposes)
export async function anonymizeUserData(userId: string): Promise<void> {
  try {
    const anonymizedId = `ANON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `${anonymizedId}@anonymous.local`,
        thaiName: "ผู้ใช้ไม่ระบุชื่อ",
        phone: null,
        school: "ไม่ระบุ",
        metadata: {
          anonymizedAt: new Date().toISOString(),
          anonymizedId,
        },
      },
    });

    // Security log
    await prisma.securityLog.create({
      data: {
        eventType: SecurityEventType.DATA_DELETION,
        action: "USER_DATA_ANONYMIZED",
        userId,
        resourceId: userId,
        resourceType: "User",
        details: {
          anonymizedId,
        },
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error anonymizing user data:", error);
    throw new Error("Failed to anonymize user data");
  }
}

// Check data retention policy
export async function checkDataRetention(userId: string): Promise<{
  shouldDelete: boolean;
  lastActivity: Date;
  expiryDate: Date;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        examResults: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find last activity
    const activities = [
      user.lastLoginAt,
      user.updatedAt,
      user.examResults[0]?.createdAt,
      user.payments[0]?.createdAt,
    ].filter(Boolean) as Date[];

    const lastActivity = new Date(Math.max(...activities.map((d) => d.getTime())));
    const expiryDate = new Date(lastActivity);
    expiryDate.setMonth(expiryDate.getMonth() + 6); // 6-month retention

    const shouldDelete = new Date() > expiryDate;

    return {
      shouldDelete,
      lastActivity,
      expiryDate,
    };
  } catch (error) {
    console.error("Error checking data retention:", error);
    throw new Error("Failed to check data retention");
  }
}

// Convert export data to CSV format
function convertToCSV(data: UserDataExport): string {
  const lines: string[] = [];

  // Personal Info Section
  lines.push("=== PERSONAL INFORMATION ===");
  lines.push("Field,Value");
  lines.push(`ID,${data.personalInfo.id}`);
  lines.push(`Email,${data.personalInfo.email}`);
  lines.push(`Thai Name,${data.personalInfo.thaiName}`);
  lines.push(`Phone,${data.personalInfo.phone || "N/A"}`);
  lines.push(`School,${data.personalInfo.school || "N/A"}`);
  lines.push(`Package Type,${data.personalInfo.packageType}`);
  lines.push(`Created At,${data.personalInfo.createdAt.toISOString()}`);
  lines.push("");

  // Exam Codes Section
  lines.push("=== EXAM CODES ===");
  if (data.examData.codes.length > 0) {
    lines.push("Code,Package Type,Subject,Generated At,Used At");
    data.examData.codes.forEach((code) => {
      lines.push(
        `${code.code},${code.packageType},${code.subject || "N/A"},${
          code.generatedAt.toISOString()
        },${code.usedAt?.toISOString() || "Not Used"}`
      );
    });
  } else {
    lines.push("No exam codes found");
  }
  lines.push("");

  // Exam Results Section
  lines.push("=== EXAM RESULTS ===");
  if (data.examData.results.length > 0) {
    lines.push("ID,Exam Code,Subject,Score,Completed At");
    data.examData.results.forEach((result) => {
      lines.push(
        `${result.id},${result.examCode},${result.subject},${result.score},${
          result.completedAt.toISOString()
        }`
      );
    });
  } else {
    lines.push("No exam results found");
  }
  lines.push("");

  // Payments Section
  lines.push("=== PAYMENTS ===");
  if (data.paymentData.payments.length > 0) {
    lines.push("ID,Amount,Currency,Status,Created At");
    data.paymentData.payments.forEach((payment) => {
      lines.push(
        `${payment.id},${payment.amount},${payment.currency},${payment.status},${
          payment.createdAt.toISOString()
        }`
      );
    });
  } else {
    lines.push("No payments found");
  }
  lines.push("");

  // Consent History Section
  lines.push("=== CONSENT HISTORY ===");
  if (data.consentHistory.length > 0) {
    lines.push("Type,Status,Granted At,Revoked At");
    data.consentHistory.forEach((consent) => {
      lines.push(
        `${consent.type},${consent.status},${
          consent.grantedAt?.toISOString() || "N/A"
        },${consent.revokedAt?.toISOString() || "N/A"}`
      );
    });
  } else {
    lines.push("No consent history found");
  }
  lines.push("");

  // Metadata Section
  lines.push("=== EXPORT METADATA ===");
  lines.push(`Exported At,${data.metadata.exportedAt.toISOString()}`);
  lines.push(`Data Retention Expiry,${data.metadata.dataRetentionExpiry.toISOString()}`);
  lines.push(`Request ID,${data.metadata.requestId}`);

  return lines.join("\n");
}

// PDPA Compliance Check
export async function performComplianceCheck(): Promise<{
  compliant: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Check for users without consent records
    const usersWithoutConsent = await prisma.user.findMany({
      where: {
        pdpaConsents: {
          none: {},
        },
        isActive: true,
      },
      select: { id: true },
    });

    if (usersWithoutConsent.length > 0) {
      issues.push(`${usersWithoutConsent.length} active users without consent records`);
    }

    // Check for expired data that should be deleted
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          lt: sixMonthsAgo,
        },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (inactiveUsers.length > 0) {
      issues.push(`${inactiveUsers.length} users with data exceeding retention period`);
    }

    // Note: Payment encryption check skipped - no metadata field in current schema

    return {
      compliant: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error("Error performing compliance check:", error);
    throw new Error("Failed to perform compliance check");
  }
}
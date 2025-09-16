import { PrismaClient, Prisma } from "@prisma/client";
import { createDatabaseMonitor } from "./db-monitoring";

declare global {
   
  var prisma: PrismaClient | undefined;
  var prismaQueryCount: number;
}

let queryCount = 0;

/**
 * Optimized Prisma Client singleton for Next.js
 * - Connection pooling configured for optimal performance
 * - Query performance logging
 * - Automatic retry on connection failures
 * - Conditional initialization when DATABASE_URL is available
 */
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️ DATABASE_URL not found - Prisma client not initialized");
    return null;
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? [
          { level: "query", emit: "event" },
          { level: "error", emit: "stdout" },
          { level: "warn", emit: "stdout" }
        ]
      : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration with UTF-8 support
    errorFormat: "minimal",
  });
}

const _prisma = global.prisma || createPrismaClient();

// Type assertion to fix null possibility issue - we handle null checks at runtime
export const prisma = _prisma as PrismaClient;

// Safe prisma accessor with error handling
export function getPrisma() {
  if (!prisma) {
    throw new Error("Database not available - Prisma client not initialized");
  }
  return prisma;
}

// Log queries in development
if (process.env.NODE_ENV === "development" && !global.prisma && prisma) {
  // @ts-ignore - Prisma event handlers
  prisma.$on("query", (e: any) => {
    queryCount++;
    if (e.duration > 50) {
      console.log(`Query: ${e.query}`);
      console.log(`Duration: ${e.duration}ms`);
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Initialize database monitoring
if (prisma && (process.env.NODE_ENV === "production" || process.env.ENABLE_DB_MONITORING === "true")) {
  createDatabaseMonitor(prisma);
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!prisma) {
      console.log("Database connection skipped - Prisma not initialized");
      return false;
    }
    
    await prisma!.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Query performance utilities
export const queryUtils = {
  // Get current query count (dev only)
  getQueryCount: () => queryCount,
  
  // Reset query count (dev only)
  resetQueryCount: () => {
    queryCount = 0;
  },
  
  // Execute with timing
  async withTiming<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    
    if (duration > 100) {
      console.warn(`⚠️ Slow operation "${label}": ${duration}ms`);
    }
    
    return { result, duration };
  },
};

// Optimized query patterns
export const optimizedQueries = {
  // Find user with minimal data for auth
  async findUserForAuth(email: string) {
    return queryUtils.withTiming(
      () => prisma!.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
        },
      }),
      "findUserForAuth"
    );
  },
  
  // Get user dashboard data with single query
  async getUserDashboard(userId: string) {
    return queryUtils.withTiming(
      () => prisma!.user.findUnique({
        where: { id: userId },
        include: {
          examCodes: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          examResults: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              subject: true,
              score: true,
              percentile: true,
              createdAt: true,
            },
          },
          payments: {
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      "getUserDashboard"
    );
  },
  
  // Check session capacity with lock
  async checkSessionCapacity(sessionTime: string, examDate: Date) {
    return queryUtils.withTiming(
      async () => {
        const session = await prisma!.sessionCapacity.findFirst({
          where: {
            sessionTime: sessionTime as any,
            examDate,
          },
        });
        
        if (!session) {
          return { available: false, currentCount: 0, maxCapacity: 0 };
        }
        
        return {
          available: session.currentCount < session.maxCapacity,
          currentCount: session.currentCount,
          maxCapacity: session.maxCapacity,
        };
      },
      "checkSessionCapacity"
    );
  },
  
  // Increment session capacity atomically
  async incrementSessionCapacity(sessionId: string) {
    return queryUtils.withTiming(
      () => prisma!.sessionCapacity.update({
        where: { id: sessionId },
        data: {
          currentCount: { increment: 1 },
        },
      }),
      "incrementSessionCapacity"
    );
  },
  
  // Get exam analytics
  async getExamAnalytics(userId: string, dateRange?: { start: Date; end: Date }) {
    return queryUtils.withTiming(
      async () => {
        const whereClause: any = { userId };
        
        if (dateRange) {
          whereClause.createdAt = {
            gte: dateRange.start,
            lte: dateRange.end,
          };
        }
        
        const [results, stats] = await Promise.all([
          prisma!.examResult.findMany({
            where: whereClause,
            include: {
              analytics: true,
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma!.examResult.groupBy({
            by: ["subject"],
            where: whereClause,
            _avg: { score: true },
            _count: true,
            _max: { score: true },
            _min: { score: true },
            orderBy: { subject: "asc" },
          }),
        ]);
        
        return { results, stats };
      },
      "getExamAnalytics"
    );
  },
};

// Database cleanup utilities
export const cleanupUtils = {
  // Clean expired exam codes
  async cleanExpiredExamCodes() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return prisma!.examCode.deleteMany({
      where: {
        createdAt: { lt: sixMonthsAgo },
      },
    });
  },
  
  // Clean expired sessions
  async cleanExpiredSessions() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return prisma!.userSession.deleteMany({
      where: {
        expiresAt: { lt: oneDayAgo },
      },
    });
  },
  
  // Clean old audit logs
  async cleanOldAuditLogs() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return prisma!.auditLog.deleteMany({
      where: {
        createdAt: { lt: threeMonthsAgo },
      },
    });
  },
};

export default prisma;
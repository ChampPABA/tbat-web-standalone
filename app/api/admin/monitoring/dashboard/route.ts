import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { trackAPIPerformance } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check admin status
    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    
    const admin = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    });
    
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    // Get dashboard metrics
    const [
      userMetrics,
      examMetrics,
      paymentMetrics,
      systemMetrics,
      recentErrors,
      activeAlerts,
    ] = await Promise.all([
      // User metrics
      getUserMetrics(),
      // Exam metrics
      getExamMetrics(),
      // Payment metrics
      getPaymentMetrics(),
      // System metrics
      getSystemMetrics(),
      // Recent errors
      getRecentErrors(),
      // Active alerts
      getActiveAlerts(),
    ]);
    
    const dashboardData = {
      timestamp: new Date().toISOString(),
      metrics: {
        users: userMetrics,
        exams: examMetrics,
        payments: paymentMetrics,
        system: systemMetrics,
      },
      errors: recentErrors,
      alerts: activeAlerts,
      performance: {
        responseTime: Date.now() - startTime,
      },
    };
    
    trackAPIPerformance("/api/admin/monitoring/dashboard", "GET", Date.now() - startTime, 200);
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    trackAPIPerformance("/api/admin/monitoring/dashboard", "GET", Date.now() - startTime, 500);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

async function getUserMetrics() {
  if (!prisma) return { total: 0, todayCount: 0, monthCount: 0, activeUsers: 0, growth: "0" };
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [total, todayCount, monthCount, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thisMonth } },
    }),
    prisma.userSession.count({
      where: { expiresAt: { gt: now } },
    }),
  ]);
  
  return {
    total,
    todayCount,
    monthCount,
    activeUsers,
    growth: monthCount > 0 ? ((todayCount / monthCount) * 100).toFixed(2) : "0",
  };
}

async function getExamMetrics() {
  if (!prisma) return { totalExams: 0, todayExams: 0, avgScore: "0", completionRate: "0" };
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const [totalExams, todayExams, avgScore, completionRate] = await Promise.all([
    prisma.examResult.count(),
    prisma.examResult.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.examResult.aggregate({
      _avg: { score: true },
    }),
    prisma.examCode.count({
      where: { isUsed: true },
    }).then(used => 
      prisma!.examCode.count().then(total => 
        total > 0 ? ((used / total) * 100).toFixed(2) : "0"
      )
    ),
  ]);
  
  return {
    totalExams,
    todayExams,
    avgScore: avgScore._avg.score?.toFixed(2) || "0",
    completionRate,
  };
}

async function getPaymentMetrics() {
  if (!prisma) return { monthlyRevenue: 0, totalRevenue: 0, successRate: "0", avgTransaction: "0" };
  
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [monthlyRevenue, totalRevenue, successRate, avgTransaction] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: thisMonth },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { status: "COMPLETED" },
    }).then(completed =>
      prisma!.payment.count().then(total =>
        total > 0 ? ((completed / total) * 100).toFixed(2) : "0"
      )
    ),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _avg: { amount: true },
    }),
  ]);
  
  return {
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    totalRevenue: totalRevenue._sum.amount || 0,
    successRate,
    avgTransaction: avgTransaction._avg.amount?.toFixed(2) || "0",
  };
}

async function getSystemMetrics() {
  if (!prisma) return { database: "unhealthy", cache: "healthy", sessionCapacity: [], uptime: process.uptime() };
  
  const [dbStatus, cacheStatus, sessionCapacity] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => "healthy").catch(() => "unhealthy"),
    // Cache check would go here if Redis is configured
    Promise.resolve("healthy"),
    prisma.sessionCapacity.findMany({
      where: { examDate: { gte: new Date() } },
      select: {
        sessionTime: true,
        currentCount: true,
        maxCapacity: true,
      },
    }),
  ]);
  
  const capacityUsage = sessionCapacity.map(s => ({
    session: s.sessionTime,
    usage: ((s.currentCount / s.maxCapacity) * 100).toFixed(2),
  }));
  
  return {
    database: dbStatus,
    cache: cacheStatus,
    sessionCapacity: capacityUsage,
    uptime: process.uptime(),
  };
}

async function getRecentErrors() {
  if (!prisma) return [];
  
  return prisma.securityLog.findMany({
    where: {
      eventType: {
        in: [
          "UNAUTHORIZED_ACCESS",
          "RATE_LIMIT_EXCEEDED",
          "AUTHENTICATION_FAILED",
        ],
      },
    },
    orderBy: { timestamp: "desc" },
    take: 10,
    select: {
      eventType: true,
      userId: true,
      ipAddress: true,
      timestamp: true,
      details: true,
    },
  });
}

async function getActiveAlerts() {
  if (!prisma) return [];
  
  const alerts = [];
  
  // Check for high error rate
  const recentErrors = await prisma.securityLog.count({
    where: {
      timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      eventType: { in: ["AUTHENTICATION_FAILED", "UNAUTHORIZED_ACCESS"] },
    },
  });
  
  if (recentErrors > 10) {
    alerts.push({
      type: "error_rate",
      severity: "high",
      message: `High error rate detected: ${recentErrors} errors in last 5 minutes`,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Check session capacity
  const sessions = await prisma.sessionCapacity.findMany({
    where: { examDate: { gte: new Date() } },
  });
  
  for (const session of sessions) {
    const usage = (session.currentCount / session.maxCapacity) * 100;
    if (usage > 90) {
      alerts.push({
        type: "capacity",
        severity: "warning",
        message: `Session ${session.sessionTime} at ${usage.toFixed(0)}% capacity`,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  return alerts;
}
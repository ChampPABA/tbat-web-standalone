import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
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
    
    // Get Sentry performance data
    const performanceData = {
      transactions: getTransactionMetrics(),
      errors: getErrorMetrics(),
      vitals: getWebVitalsMetrics(),
      customMetrics: getCustomMetrics(),
    };
    
    return NextResponse.json(performanceData);
  } catch (error) {
    console.error("Sentry monitoring error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Sentry data" },
      { status: 500 }
    );
  }
}

function getTransactionMetrics() {
  // These would typically come from Sentry API
  // For now, returning mock data structure
  return {
    p50: 200,
    p75: 350,
    p95: 800,
    p99: 1500,
    throughput: 1000,
    errorRate: 0.02,
  };
}

function getErrorMetrics() {
  return {
    total24h: 45,
    uniqueErrors: 12,
    affectedUsers: 8,
    topErrors: [
      {
        message: "Database connection timeout",
        count: 15,
        lastSeen: new Date().toISOString(),
      },
      {
        message: "Payment processing failed",
        count: 8,
        lastSeen: new Date().toISOString(),
      },
    ],
  };
}

function getWebVitalsMetrics() {
  return {
    lcp: { value: 2.5, rating: "needs-improvement" },
    fid: { value: 100, rating: "good" },
    cls: { value: 0.1, rating: "good" },
    fcp: { value: 1.8, rating: "good" },
    ttfb: { value: 800, rating: "needs-improvement" },
  };
}

function getCustomMetrics() {
  return {
    examCompletionTime: { avg: 45, min: 20, max: 120 },
    pdfDownloadTime: { avg: 3.2, min: 1.5, max: 8.5 },
    registrationConversion: 0.65,
    paymentSuccess: 0.92,
  };
}

export async function POST(request: NextRequest) {
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
    
    const { action, data } = await request.json();
    
    switch (action) {
      case "create_alert":
        return createSentryAlert(data);
      case "test_error":
        return testSentryError(data);
      case "configure_threshold":
        return configureSentryThreshold(data);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Sentry action error:", error);
    return NextResponse.json(
      { error: "Failed to perform Sentry action" },
      { status: 500 }
    );
  }
}

async function createSentryAlert(data: any) {
  // Configure Sentry alert
  // This would typically use Sentry API
  Sentry.captureMessage(`Alert configured: ${data.name}`, "info");
  
  return NextResponse.json({
    success: true,
    alert: {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      condition: data.condition,
      threshold: data.threshold,
      created: new Date().toISOString(),
    },
  });
}

async function testSentryError(data: any) {
  // Send test error to Sentry
  Sentry.captureException(new Error(`Test error: ${data.message}`));
  
  return NextResponse.json({
    success: true,
    message: "Test error sent to Sentry",
  });
}

async function configureSentryThreshold(data: any) {
  // Configure performance thresholds
  // This would typically update Sentry project settings
  
  return NextResponse.json({
    success: true,
    thresholds: {
      transaction: data.transaction || 3000,
      database: data.database || 100,
      api: data.api || 500,
    },
  });
}
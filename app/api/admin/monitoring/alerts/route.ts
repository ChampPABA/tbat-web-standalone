import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/monitoring";

interface Alert {
  id: string;
  name: string;
  type: "performance" | "error" | "capacity" | "security";
  condition: string;
  threshold: number;
  action: "email" | "sms" | "webhook";
  recipients: string[];
  enabled: boolean;
  lastTriggered?: Date;
}

// In-memory storage for alerts (in production, use database)
const alerts: Map<string, Alert> = new Map();

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
    
    // Get all configured alerts
    const configuredAlerts = Array.from(alerts.values());
    
    // Check current alert status
    const alertStatus = await checkAlertConditions(configuredAlerts);
    
    return NextResponse.json({
      alerts: configuredAlerts,
      status: alertStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Alert fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
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
    
    const alertData = await request.json();
    
    // Create new alert
    const alert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      name: alertData.name,
      type: alertData.type,
      condition: alertData.condition,
      threshold: alertData.threshold,
      action: alertData.action,
      recipients: alertData.recipients,
      enabled: alertData.enabled ?? true,
    };
    
    alerts.set(alert.id, alert);
    
    // Log alert creation
    await logSecurityEvent(
      "ADMIN_DATA_ACCESS",
      admin.id,
      {
        action: "create_alert",
        alertId: alert.id,
        alertName: alert.name,
      },
      request.headers.get("x-forwarded-for") || undefined
    );
    
    return NextResponse.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error("Alert creation error:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const { id, ...updates } = await request.json();
    
    const alert = alerts.get(id);
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    
    // Update alert
    const updatedAlert = { ...alert, ...updates };
    alerts.set(id, updatedAlert);
    
    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    });
  } catch (error) {
    console.error("Alert update error:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }
    
    const deleted = alerts.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    console.error("Alert deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}

async function checkAlertConditions(configuredAlerts: Alert[]) {
  const triggeredAlerts = [];
  
  for (const alert of configuredAlerts) {
    if (!alert.enabled) continue;
    
    let shouldTrigger = false;
    let currentValue = 0;
    
    switch (alert.type) {
      case "performance":
        // Check API response times
        currentValue = await getAverageResponseTime();
        shouldTrigger = currentValue > alert.threshold;
        break;
        
      case "error":
        // Check error rate
        currentValue = await getErrorRate();
        shouldTrigger = currentValue > alert.threshold;
        break;
        
      case "capacity":
        // Check session capacity
        currentValue = await getCapacityUsage();
        shouldTrigger = currentValue > alert.threshold;
        break;
        
      case "security":
        // Check security events
        currentValue = await getSecurityEventCount();
        shouldTrigger = currentValue > alert.threshold;
        break;
    }
    
    if (shouldTrigger) {
      triggeredAlerts.push({
        alertId: alert.id,
        alertName: alert.name,
        currentValue,
        threshold: alert.threshold,
        triggered: new Date().toISOString(),
      });
      
      // Trigger alert action
      await triggerAlertAction(alert, currentValue);
    }
  }
  
  return triggeredAlerts;
}

async function getAverageResponseTime(): Promise<number> {
  // In production, this would query actual metrics
  return Math.random() * 1000; // Mock value in ms
}

async function getErrorRate(): Promise<number> {
  if (!prisma) return 0;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const errors = await prisma.securityLog.count({
    where: {
      timestamp: { gte: fiveMinutesAgo },
      eventType: { in: ["AUTHENTICATION_FAILED", "UNAUTHORIZED_ACCESS"] },
    },
  });
  return errors;
}

async function getCapacityUsage(): Promise<number> {
  if (!prisma) return 0;
  
  const sessions = await prisma.sessionCapacity.findMany({
    where: { examDate: { gte: new Date() } },
  });
  
  if (sessions.length === 0) return 0;
  
  const totalUsage = sessions.reduce((sum, s) => {
    return sum + (s.currentCount / s.maxCapacity) * 100;
  }, 0);
  
  return totalUsage / sessions.length;
}

async function getSecurityEventCount(): Promise<number> {
  if (!prisma) return 0;
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.securityLog.count({
    where: {
      timestamp: { gte: oneHourAgo },
      eventType: {
        in: [
          "UNAUTHORIZED_ACCESS",
          "MULTIPLE_LOGIN_ATTEMPTS",
          "SUSPICIOUS_ACTIVITY",
        ],
      },
    },
  });
}

async function triggerAlertAction(alert: Alert, currentValue: number) {
  console.log(`Alert triggered: ${alert.name} (${currentValue} > ${alert.threshold})`);
  
  // Update last triggered time
  alert.lastTriggered = new Date();
  alerts.set(alert.id, alert);
  
  // In production, implement actual alert actions:
  // - Send emails via Resend
  // - Send SMS via Twilio
  // - Call webhooks
  // - Create support tickets
}
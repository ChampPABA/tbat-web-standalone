import * as Sentry from "@sentry/nextjs";
import { SecurityEventType } from "@prisma/client";
import { prisma } from "./prisma";

// Re-export Prisma's SecurityEventType for consistency
export { SecurityEventType };

// Severity levels
export enum SeverityLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "fatal",
}

// Metrics tracking
export const metrics = {
  security: {
    failedLogins: "auth.login.failed",
    accountLockouts: "auth.account.locked",
    rateLimitHits: "ratelimit.exceeded",
    unauthorizedAccess: "access.unauthorized",
  },
  pdpa: {
    dataExports: "pdpa.export.count",
    dataDeletions: "pdpa.delete.count",
    consentUpdates: "pdpa.consent.updated",
  },
  performance: {
    codeGenTime: "examcode.generation.duration",
    validationTime: "validation.duration",
    apiResponseTime: "api.response.duration",
    capacityUpdateTime: "capacity.update.duration",
    fallbackActivation: "api.fallback.activated",
    clientCacheHit: "client.cache.hit",
  },
  exam: {
    codesGenerated: "exam.codes.generated",
    examsCompleted: "exam.completed",
    examsAbandoned: "exam.abandoned",
  },
  payment: {
    successCount: "payment.success",
    failureCount: "payment.failure",
    totalAmount: "payment.amount.total",
  },
};

// Initialize Sentry (call this in app initialization)
export function initializeSentry(): void {
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
  
  if (process.env.SENTRY_DSN && process.env.SENTRY_ENABLED !== "false") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment,
      tracesSampleRate: environment === "production" ? 0.1 : 1.0,
      profilesSampleRate: environment === "production" ? 0.1 : 1.0,
      integrations: [
        Sentry.captureConsoleIntegration({
          levels: ["error", "warn"],
        }),
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
            delete event.request.headers["x-api-key"];
          }
          // Remove sensitive data from body
          if (event.request && event.request.data && typeof event.request.data === 'object') {
            const data = event.request.data as Record<string, any>;
            const sensitiveFields = ["password", "passwordHash", "creditCard", "cvv"];
            sensitiveFields.forEach((field) => {
              if (data[field]) {
                data[field] = "[REDACTED]";
              }
            });
          }
        }
        
        // Filter out non-critical errors in development
        if (environment === "development") {
          const error = hint.originalException;
          if (error && error instanceof Error) {
            // Skip common development errors
            if (error.message.includes("NEXT_NOT_FOUND")) {
              return null;
            }
          }
        }
        
        return event;
      },
      ignoreErrors: [
        // Browser errors
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        // Network errors
        "NetworkError",
        "Network request failed",
        // Common non-critical errors
        "Non-Error promise rejection captured",
      ],
    });
  }
}

// Log error to Sentry
export function logError(
  error: Error | string,
  context?: Record<string, any>,
  severity: SeverityLevel = SeverityLevel.ERROR
): void {
  const errorMessage = typeof error === "string" ? error : error.message;
  
  console.error(`[${severity.toUpperCase()}]`, errorMessage, context);
  
  if (process.env.SENTRY_ENABLED !== "false") {
    if (typeof error === "string") {
      Sentry.captureMessage(error, severity as Sentry.SeverityLevel);
    } else {
      Sentry.captureException(error, {
        level: severity as Sentry.SeverityLevel,
        contexts: {
          custom: context || {},
        },
      });
    }
  }
}

// Log security event
export async function logSecurityEvent(
  eventType: SecurityEventType,
  userId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    // Log to Sentry
    Sentry.captureMessage(`Security Event: ${eventType}`, {
      level: eventType.includes("FAILURE") || eventType.includes("UNAUTHORIZED") 
        ? "warning" 
        : "info",
      tags: {
        eventType,
        userId: userId || "anonymous",
      },
      contexts: {
        security: {
          eventType,
          userId,
          ipAddress,
          ...details,
        },
      },
    });
    
    // Log to database security log
    if (prisma) {
      await prisma.securityLog.create({
      data: {
        eventType: eventType,
        action: eventType,
        userId: userId || "system",
        resourceId: details?.resourceId || null,
        resourceType: "SecurityEvent",
        details: {
          ...details,
          eventType,
        },
        ipAddress,
        userAgent: details?.userAgent || null,
        timestamp: new Date(),
      },
    });
    }
    
    // Check for critical security events
    if (
      eventType === SecurityEventType.MULTIPLE_LOGIN_ATTEMPTS ||
      eventType === SecurityEventType.PDF_UNAUTHORIZED_ACCESS ||
      eventType === SecurityEventType.ADMIN_DATA_ACCESS
    ) {
      await sendSecurityAlert(eventType, userId, details, ipAddress);
    }
  } catch (error) {
    console.error("Failed to log security event:", error);
    logError(error as Error, { eventType, userId });
  }
}

// Send security alert for critical events
async function sendSecurityAlert(
  eventType: SecurityEventType,
  userId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    // In production, this would send email/SMS alerts to administrators
    const alert = {
      type: "SECURITY_ALERT",
      severity: "HIGH",
      eventType,
      userId,
      ipAddress,
      details,
      timestamp: new Date().toISOString(),
    };
    
    // Log critical alert
    Sentry.captureMessage(`CRITICAL SECURITY ALERT: ${eventType}`, {
      level: "error",
      tags: {
        alertType: "security",
        critical: true,
      },
      contexts: {
        alert,
      },
    });
    
    console.error("🚨 SECURITY ALERT:", alert);
    
    // Here you would integrate with notification service (email/SMS)
    // await sendEmailAlert(alert);
    // await sendSMSAlert(alert);
  } catch (error) {
    logError(error as Error, { context: "sendSecurityAlert" });
  }
}

// Track metric
export function trackMetric(
  metricName: string,
  value: number,
  tags?: Record<string, string>
): void {
  try {
    // Note: Sentry metrics API is still in beta
    // For now, we'll use custom context to track metrics
    Sentry.setContext("custom_metrics", {
      [metricName]: value,
      tags: tags || {},
    });
    
    // Log metric for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`📊 Metric: ${metricName} = ${value}`, tags);
    }
  } catch (error) {
    console.error("Failed to track metric:", error);
  }
}

// Track API performance
export function trackAPIPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
): void {
  trackMetric(metrics.performance.apiResponseTime, duration, {
    endpoint,
    method,
    status: statusCode.toString(),
    statusGroup: `${Math.floor(statusCode / 100)}xx`,
  });
  
  // Log slow API responses
  if (duration > 1000) {
    logError(
      `Slow API response: ${method} ${endpoint} took ${duration}ms`,
      {
        endpoint,
        method,
        duration,
        statusCode,
      },
      SeverityLevel.WARNING
    );
  }
}

// Create audit log entry
export async function auditLog(data: {
  action: string;
  userId: string;
  resourceId?: string;
  resourceType?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    if (prisma) {
      await prisma.securityLog.create({
      data: {
        eventType: SecurityEventType.AUTHENTICATION_SUCCESS,
        action: data.action,
        userId: data.userId,
        resourceId: data.resourceId || null,
        resourceType: data.resourceType || null,
        details: data.details || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        timestamp: new Date(),
      },
    });
    }
    
    // Track audit metric
    trackMetric("audit.log.created", 1, {
      action: data.action,
      resourceType: data.resourceType || "unknown",
    });
  } catch (error) {
    logError(error as Error, { context: "auditLog", data });
  }
}

// Monitor rate limit violations
export function monitorRateLimit(
  identifier: string,
  endpoint: string,
  exceeded: boolean
): void {
  if (exceeded) {
    trackMetric(metrics.security.rateLimitHits, 1, {
      endpoint,
      identifier,
    });
    
    logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      identifier,
      { endpoint },
      identifier
    );
  }
}

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      trackMetric(metricName, duration, {
        status: "success",
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackMetric(metricName, duration, {
        status: "error",
      });
      
      throw error;
    }
  }) as T;
}

// Check system health
export async function checkSystemHealth(): Promise<{
  healthy: boolean;
  services: Record<string, boolean>;
  metrics: Record<string, any>;
}> {
  const services: Record<string, boolean> = {};
  const healthMetrics: Record<string, any> = {};
  
  try {
    // Check database connection
    if (prisma) {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      services.database = true;
      healthMetrics.dbResponseTime = Date.now() - dbStart;
    } else {
      services.database = false;
    }
  } catch (error) {
    services.database = false;
    logError(error as Error, { service: "database" });
  }
  
  // Check Sentry connection
  services.sentry = !!process.env.SENTRY_DSN && process.env.SENTRY_ENABLED !== "false";
  
  // Overall health
  const healthy = Object.values(services).every((status) => status);
  
  return {
    healthy,
    services,
    metrics: healthMetrics,
  };
}

// Environment-specific logging
export function getLoggingLevel(): string {
  const environment = process.env.NODE_ENV || "development";
  
  switch (environment) {
    case "production":
      return "error_and_audit";
    case "test":
      return "standard";
    case "development":
    default:
      return "verbose";
  }
}

// Format error for logging
export function formatError(error: Error | unknown): {
  message: string;
  stack?: string;
  type: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    };
  }
  
  return {
    message: String(error),
    type: "UnknownError",
  };
}

// Frontend-Backend Integration Specific Monitoring
export const integrationMonitoring = {
  /**
   * Track capacity update success/failure rates
   */
  trackCapacityUpdate(success: boolean, responseTime: number, errorType?: string) {
    trackMetric(metrics.performance.capacityUpdateTime, responseTime, {
      success: success.toString(),
      errorType: errorType || "none"
    });

    if (!success) {
      logError(
        `Capacity update failed: ${errorType || 'Unknown error'}`,
        {
          responseTime,
          errorType
        },
        SeverityLevel.WARNING
      );
    }
  },

  /**
   * Track when fallback to mock data is activated
   */
  trackFallbackActivation(endpoint: string, reason: string, hasCachedData: boolean) {
    trackMetric(metrics.performance.fallbackActivation, 1, {
      endpoint,
      reason,
      hasCachedData: hasCachedData.toString()
    });

    logError(
      `API fallback activated for ${endpoint}: ${reason}`,
      {
        endpoint,
        reason,
        hasCachedData,
        fallbackActive: true
      },
      SeverityLevel.INFO
    );
  },

  /**
   * Track client-side cache performance
   */
  trackCachePerformance(endpoint: string, cacheHit: boolean, dataAge?: number) {
    trackMetric(metrics.performance.clientCacheHit, cacheHit ? 1 : 0, {
      endpoint,
      cacheHit: cacheHit.toString(),
      dataAge: dataAge ? dataAge.toString() : "0"
    });
  },

  /**
   * Monitor real-time polling performance
   */
  trackPollingHealth(endpoint: string, intervalMs: number, consecutiveFailures: number) {
    if (consecutiveFailures > 0) {
      logError(
        `Polling issues detected for ${endpoint}`,
        {
          endpoint,
          intervalMs,
          consecutiveFailures,
          pollingHealth: "degraded"
        },
        consecutiveFailures > 3 ? SeverityLevel.WARNING : SeverityLevel.INFO
      );
    }

    trackMetric("polling.health", consecutiveFailures, {
      endpoint,
      interval: intervalMs.toString()
    });
  },

  /**
   * Track user experience metrics for loading states
   */
  trackLoadingExperience(component: string, loadingDuration: number, hadError: boolean) {
    trackMetric("user.experience.loading", loadingDuration, {
      component,
      hadError: hadError.toString(),
      experience: loadingDuration < 1000 ? "excellent" : loadingDuration < 3000 ? "good" : "poor"
    });
  }
};
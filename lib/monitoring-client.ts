'use client';

// Disable Sentry temporarily to fix TypeError
// import * as Sentry from "@sentry/nextjs";

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
  // Disabled temporarily to fix TypeError
  return;
  /*
  const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
  
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "false") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
  */
}

// Log error to Sentry
export function logError(
  error: Error | string,
  context?: Record<string, any>,
  severity: SeverityLevel = SeverityLevel.ERROR
): void {
  const errorMessage = typeof error === "string" ? error : error.message;
  
  console.error(`[${severity.toUpperCase()}]`, errorMessage, context);
  
  // Sentry disabled temporarily
  // if (process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "false") {
  //   if (typeof error === "string") {
  //     Sentry.captureMessage(error, severity as Sentry.SeverityLevel);
  //   } else {
  //     Sentry.captureException(error, {
  //       level: severity as Sentry.SeverityLevel,
  //       contexts: {
  //         custom: context || {},
  //       },
  //     });
  //   }
  // }
}

// Track metric
export function trackMetric(
  metricName: string,
  value: number,
  tags?: Record<string, string>
): void {
  try {
    // Sentry disabled temporarily
    // Sentry.setContext("custom_metrics", {
    //   [metricName]: value,
    //   tags: tags || {},
    // });
    
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
  
  // Log slow API responses (increased threshold to reduce noise)
  if (duration > 10000) {
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
  trackCapacityUpdate(success: boolean, responseTime: number, errorType?: string): void {
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
  trackFallbackActivation(endpoint: string, reason: string, hasCachedData: boolean): void {
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
  trackCachePerformance(endpoint: string, cacheHit: boolean, dataAge?: number): void {
    trackMetric(metrics.performance.clientCacheHit, cacheHit ? 1 : 0, {
      endpoint,
      cacheHit: cacheHit.toString(),
      dataAge: dataAge ? dataAge.toString() : "0"
    });
  },

  /**
   * Monitor real-time polling performance
   */
  trackPollingHealth(endpoint: string, intervalMs: number, consecutiveFailures: number): void {
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
  trackLoadingExperience(component: string, loadingDuration: number, hadError: boolean): void {
    trackMetric("user.experience.loading", loadingDuration, {
      component,
      hadError: hadError.toString(),
      experience: loadingDuration < 1000 ? "excellent" : loadingDuration < 3000 ? "good" : "poor"
    });
  }
};
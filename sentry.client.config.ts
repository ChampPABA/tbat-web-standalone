import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Adjust sample rates for production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Replay configuration for session recording
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filtering
  ignoreErrors: [
    // Browser-specific errors
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    
    // Network errors
    "NetworkError",
    "Network request failed",
    
    // Common third-party errors
    "top.GLOBALS",
    "Script error.",
    "TypeError: Failed to fetch",
  ],
  
  beforeSend(event, hint) {
    // Filter out sensitive data from errors
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    if (event.extra) {
      const sensitiveKeys = ["password", "token", "secret", "api_key"];
      sensitiveKeys.forEach((key) => {
        if (event.extra && event.extra[key]) {
          event.extra[key] = "[REDACTED]";
        }
      });
    }
    
    // Don't send events in development unless explicitly enabled
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "true"
    ) {
      return null;
    }
    
    return event;
  },
});
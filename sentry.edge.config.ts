import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Adjust sample rates for production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Filtering
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
  
  beforeSend(event) {
    // Filter sensitive data in edge runtime
    if (event.request?.headers) {
      const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
      sensitiveHeaders.forEach((header) => {
        if (event.request?.headers?.[header]) {
          event.request.headers[header] = "[REDACTED]";
        }
      });
    }
    
    // Don't send events in development unless explicitly enabled
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SENTRY_ENABLED !== "true"
    ) {
      return null;
    }
    
    return event;
  },
});
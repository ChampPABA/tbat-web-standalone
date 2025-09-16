import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Adjust sample rates for production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Enable profiling
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  integrations: [
    // Prisma integration for database query tracking
    Sentry.prismaIntegration(),
  ],
  
  // Filtering
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
  
  beforeSend(event, hint) {
    // Filter out sensitive server data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "cookie",
          "x-api-key",
          "x-auth-token",
        ];
        sensitiveHeaders.forEach((header) => {
          if (event.request?.headers && event.request.headers[header]) {
            event.request.headers[header] = "[REDACTED]";
          }
        });
      }
      
      // Remove sensitive body data
      if (event.request.data) {
        const sensitiveFields = [
          "password",
          "passwordHash",
          "creditCard",
          "cvv",
          "stripeToken",
        ];
        const data = event.request.data as Record<string, any>;
        sensitiveFields.forEach((field) => {
          if (data[field]) {
            data[field] = "[REDACTED]";
          }
        });
      }
    }
    
    // Remove sensitive user data
    if (event.user) {
      if (event.user.email) {
        // Partially mask email
        const [name, domain] = event.user.email.split("@");
        event.user.email = `${name.substring(0, 2)}***@${domain}`;
      }
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
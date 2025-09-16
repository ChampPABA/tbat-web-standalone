/**
 * Centralized error handling utilities for consistent error management
 * Addresses QA recommendation for robust error handling patterns
 */

import { logSecurityEvent, SecurityEventType } from "./monitoring";

export type ErrorContext = {
  operation: string;
  component: string;
  userId?: string;
  metadata?: Record<string, any>;
};

export type ErrorResult = {
  success: false;
  error: string;
  code?: string;
  details?: any;
};

export type SuccessResult<T = any> = {
  success: true;
  data: T;
};

export type Result<T = any> = SuccessResult<T> | ErrorResult;

/**
 * Standard error handler for async operations
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return await handleError(error, context);
  }
}

/**
 * Standard error handler for sync operations
 */
export function handleSyncOperation<T>(
  operation: () => T,
  context: ErrorContext
): Result<T> {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    return handleErrorSync(error, context);
  }
}

/**
 * Handle errors with consistent logging and security monitoring
 */
export async function handleError(
  error: unknown,
  context: ErrorContext
): Promise<ErrorResult> {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log error with context
  console.error(`Error in ${context.component}:${context.operation}:`, {
    message: errorMessage,
    stack: errorStack,
    context,
  });

  // Log security event for suspicious errors
  if (shouldLogSecurityEvent(error, context)) {
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      context.userId,
      {
        event: `ERROR_${context.component.toUpperCase()}_${context.operation.toUpperCase()}`,
        error: errorMessage,
        ...context.metadata,
      }
    );
  }

  return {
    success: false,
    error: getUserFriendlyMessage(error, context),
    code: getErrorCode(error),
    details: process.env.NODE_ENV === "development" ? { message: errorMessage, stack: errorStack } : undefined,
  };
}

/**
 * Sync version of error handler
 */
export function handleErrorSync(
  error: unknown,
  context: ErrorContext
): ErrorResult {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log error with context
  console.error(`Error in ${context.component}:${context.operation}:`, {
    message: errorMessage,
    stack: errorStack,
    context,
  });

  return {
    success: false,
    error: getUserFriendlyMessage(error, context),
    code: getErrorCode(error),
    details: process.env.NODE_ENV === "development" ? { message: errorMessage, stack: errorStack } : undefined,
  };
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<Result<T>> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      if (attempt === maxRetries) {
        return await handleError(error, {
          ...context,
          metadata: { ...context.metadata, attempts: attempt },
        });
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

      console.warn(`${context.component}:${context.operation} attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  return await handleError(new Error("Max retries exceeded"), context);
}

/**
 * Determine if error should trigger a security event
 */
function shouldLogSecurityEvent(error: unknown, context: ErrorContext): boolean {
  if (!(error instanceof Error)) return false;

  const securityKeywords = [
    'unauthorized',
    'forbidden',
    'permission',
    'authentication',
    'token',
    'session',
    'injection',
    'malicious',
  ];

  const errorMessage = error.message.toLowerCase();
  return securityKeywords.some(keyword => errorMessage.includes(keyword));
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error: unknown, context: ErrorContext): string {
  if (!(error instanceof Error)) return "An unexpected error occurred";

  // Map technical errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    'capacity': 'Unable to check availability at this time',
    'exam-code': 'Unable to generate exam code',
    'database': 'Service temporarily unavailable',
    'email': 'Unable to send email notification',
    'payment': 'Payment processing failed',
    'auth': 'Authentication failed',
  };

  const componentMapping = errorMappings[context.component];
  if (componentMapping) return componentMapping;

  // Check for specific error patterns
  if (error.message.includes('network') || error.message.includes('connection')) {
    return 'Network connection error. Please try again.';
  }

  if (error.message.includes('timeout')) {
    return 'Request timeout. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get standardized error code
 */
function getErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'UNKNOWN_ERROR';

  // Map common errors to codes
  if (error.message.includes('not found')) return 'NOT_FOUND';
  if (error.message.includes('unauthorized')) return 'UNAUTHORIZED';
  if (error.message.includes('forbidden')) return 'FORBIDDEN';
  if (error.message.includes('validation')) return 'VALIDATION_ERROR';
  if (error.message.includes('timeout')) return 'TIMEOUT';
  if (error.message.includes('network')) return 'NETWORK_ERROR';

  return 'INTERNAL_ERROR';
}

/**
 * Validate required parameters and throw descriptive error if missing
 */
export function validateRequired(
  params: Record<string, any>,
  requiredFields: string[],
  context: ErrorContext
): void {
  const missing = requiredFields.filter(field =>
    params[field] === undefined || params[field] === null || params[field] === ''
  );

  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(
  jsonString: string,
  context: ErrorContext
): Result<T> {
  return handleSyncOperation(
    () => JSON.parse(jsonString) as T,
    { ...context, operation: 'json-parse' }
  );
}

/**
 * Safe database operation wrapper
 */
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<Result<T>> {
  return await withRetry(
    operation,
    { ...context, component: 'database' },
    { maxRetries: 2, baseDelayMs: 500 }
  );
}
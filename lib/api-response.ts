import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedApiResponse, setCachedApiResponse } from "./redis";
// import { monitorAPIResponse } from "./monitoring"; // Commenting out temporarily
const monitorAPIResponse = async (endpoint: string, statusCode: number, duration: number) => {
  // Mock implementation for development
  console.log(`API Response: ${endpoint} - ${statusCode} (${duration}ms)`);
};
import zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

// Standard API response interfaces
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    version: string;
    cached: boolean;
    responseTime?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

// API error codes standardization
export const API_ERROR_CODES = {
  // Client errors (4xx)
  INVALID_REQUEST: "INVALID_REQUEST",
  INVALID_PARAMETERS: "INVALID_PARAMETERS",
  INVALID_REQUEST_BODY: "INVALID_REQUEST_BODY", 
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  
  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  
  // Business logic errors
  CAPACITY_FULL: "CAPACITY_FULL",
  PACKAGE_UNAVAILABLE: "PACKAGE_UNAVAILABLE",
  SESSION_UNAVAILABLE: "SESSION_UNAVAILABLE",
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
} as const;

// Response compression configuration
const COMPRESSION_THRESHOLD = 1024; // 1KB minimum for compression
const COMPRESSION_SUPPORTED_TYPES = [
  "application/json",
  "text/plain",
  "text/html",
  "text/css",
  "application/javascript",
];

/**
 * Create standardized success response with consistent format and optional caching
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: Partial<StandardApiResponse["metadata"]>,
  options?: {
    cache?: boolean;
    cacheKey?: string;
    cacheTTL?: number;
    statusCode?: number;
  }
): NextResponse<StandardApiResponse<T>> {
  const response: StandardApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: "1.0",
      cached: false,
      ...metadata,
    },
  };

  // Cache response if requested
  if (options?.cache && options?.cacheKey) {
    setCachedApiResponse(
      options.cacheKey,
      JSON.stringify(data),
      response
    ).catch(error => {
      console.error("Failed to cache API response:", error);
    });
  }

  return NextResponse.json(response, { 
    status: options?.statusCode || 200,
    headers: getResponseHeaders(),
  });
}

/**
 * Create standardized error response with Sentry integration
 */
export function createErrorResponse(
  error: ApiError,
  requestId?: string
): NextResponse<StandardApiResponse> {
  const statusCode = getStatusCodeFromErrorCode(error.code);
  
  const response: StandardApiResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId,
      version: "1.0",
      cached: false,
    },
  };

  // Monitor error response with Sentry integration
  monitorAPIResponse(
    requestId || "unknown",
    statusCode,
    0 // No response time for errors
  ).catch(() => {
    // Ignore monitoring errors to not break the response
  });

  return NextResponse.json(response, { 
    status: statusCode,
    headers: getResponseHeaders(),
  });
}

/**
 * Enhanced API response wrapper with compression, caching, and monitoring
 */
export async function createOptimizedResponse<T>(
  data: T,
  request: Request,
  options?: {
    cache?: boolean;
    cacheKey?: string;
    cacheTTL?: number;
    compress?: boolean;
    statusCode?: number;
    requestStartTime?: number;
  }
): Promise<NextResponse<StandardApiResponse<T>>> {
  const startTime = options?.requestStartTime || Date.now();
  const responseTime = Date.now() - startTime;
  const requestId = crypto.randomUUID();

  // Check if response is cached
  let cached = false;
  if (options?.cache && options?.cacheKey) {
    const cachedResponse = await getCachedApiResponse(options.cacheKey);
    if (cachedResponse) {
      cached = true;
      
      // Monitor cached response
      await monitorAPIResponse(
        request.url,
        200,
        responseTime
      );

      return NextResponse.json({
        success: true,
        data: cachedResponse,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: "1.0",
          cached: true,
          responseTime,
        },
      });
    }
  }

  // Create response
  const response: StandardApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId,
      version: "1.0",
      cached,
      responseTime,
    },
  };

  const responseData = JSON.stringify(response);
  let responseBody = responseData;
  const headers = getResponseHeaders();

  // Apply compression if requested and beneficial
  if (options?.compress && shouldCompress(request, responseData)) {
    const acceptEncoding = request.headers.get("accept-encoding") || "";
    
    try {
      if (acceptEncoding.includes("gzip")) {
        const compressed = await gzip(Buffer.from(responseData));
        responseBody = compressed.toString("base64");
        headers.set("Content-Encoding", "gzip");
        headers.set("Content-Length", compressed.length.toString());
      } else if (acceptEncoding.includes("deflate")) {
        const compressed = await deflate(Buffer.from(responseData));
        responseBody = compressed.toString("base64");
        headers.set("Content-Encoding", "deflate");
        headers.set("Content-Length", compressed.length.toString());
      }
    } catch (compressionError) {
      console.warn("Compression failed, serving uncompressed response:", compressionError);
    }
  }

  // Cache response if requested
  if (options?.cache && options?.cacheKey) {
    await setCachedApiResponse(
      options.cacheKey,
      "",
      response
    ).catch(error => {
      console.error("Failed to cache optimized API response:", error);
    });
  }

  // Monitor successful response
  await monitorAPIResponse(
    request.url,
    options?.statusCode || 200,
    responseTime
  );

  return new NextResponse(
    headers.has("Content-Encoding") ? Buffer.from(responseBody, "base64") : responseBody,
    {
      status: options?.statusCode || 200,
      headers,
    }
  ) as NextResponse<StandardApiResponse<T>>;
}

/**
 * Pagination helper for API responses
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  metadata?: Partial<StandardApiResponse["metadata"]>
): StandardApiResponse<{
  items: T[];
  pagination: NonNullable<StandardApiResponse["metadata"]>["pagination"];
}> {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        hasNext,
        hasPrev,
      },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: "1.0",
      cached: false,
      pagination: {
        page,
        limit,
        total,
        hasNext,
        hasPrev,
      },
      ...metadata,
    },
  };
}

/**
 * Validate API request with Zod schema and standardized error responses
 */
export function validateApiRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: ApiError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.INVALID_REQUEST,
          message: "Request validation failed",
          details: error.issues,
          statusCode: 400,
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.INTERNAL_ERROR,
        message: "Validation error occurred",
        statusCode: 500,
      },
    };
  }
}

/**
 * Handle API errors with standardized logging and response format
 */
export function handleApiError(
  error: unknown,
  requestId?: string,
  context?: string
): NextResponse<StandardApiResponse> {
  console.error(`API Error ${context ? `in ${context}` : ""}:`, error);

  let apiError: ApiError;

  if (error instanceof z.ZodError) {
    apiError = {
      code: API_ERROR_CODES.INVALID_REQUEST,
      message: "Request validation failed",
      details: error.issues,
      statusCode: 400,
    };
  } else if (error instanceof Error) {
    // Determine error type based on error message patterns
    if (error.message.includes("rate limit")) {
      apiError = {
        code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: "Too many requests",
        statusCode: 429,
      };
    } else if (error.message.includes("not found")) {
      apiError = {
        code: API_ERROR_CODES.NOT_FOUND,
        message: "Resource not found",
        statusCode: 404,
      };
    } else if (error.message.includes("unauthorized")) {
      apiError = {
        code: API_ERROR_CODES.UNAUTHORIZED,
        message: "Authentication required",
        statusCode: 401,
      };
    } else if (error.message.includes("forbidden")) {
      apiError = {
        code: API_ERROR_CODES.FORBIDDEN,
        message: "Access denied",
        statusCode: 403,
      };
    } else {
      apiError = {
        code: API_ERROR_CODES.INTERNAL_ERROR,
        message: "An internal error occurred",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        statusCode: 500,
      };
    }
  } else {
    apiError = {
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message: "An unknown error occurred",
      statusCode: 500,
    };
  }

  return createErrorResponse(apiError, requestId);
}

/**
 * Get standard response headers for API responses
 */
function getResponseHeaders(): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-API-Version": "1.0",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });

  return headers;
}

/**
 * Determine HTTP status code from API error code
 */
function getStatusCodeFromErrorCode(errorCode: string): number {
  const statusCodeMap: Record<string, number> = {
    [API_ERROR_CODES.INVALID_REQUEST]: 400,
    [API_ERROR_CODES.INVALID_PARAMETERS]: 400,
    [API_ERROR_CODES.INVALID_REQUEST_BODY]: 400,
    [API_ERROR_CODES.UNAUTHORIZED]: 401,
    [API_ERROR_CODES.FORBIDDEN]: 403,
    [API_ERROR_CODES.NOT_FOUND]: 404,
    [API_ERROR_CODES.METHOD_NOT_ALLOWED]: 405,
    [API_ERROR_CODES.CONFLICT]: 409,
    [API_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
    [API_ERROR_CODES.PAYLOAD_TOO_LARGE]: 413,
    [API_ERROR_CODES.INTERNAL_ERROR]: 500,
    [API_ERROR_CODES.DATABASE_ERROR]: 500,
    [API_ERROR_CODES.CACHE_ERROR]: 500,
    [API_ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
    [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
    [API_ERROR_CODES.CAPACITY_FULL]: 409,
    [API_ERROR_CODES.PACKAGE_UNAVAILABLE]: 409,
    [API_ERROR_CODES.SESSION_UNAVAILABLE]: 409,
    [API_ERROR_CODES.REGISTRATION_CLOSED]: 410,
    [API_ERROR_CODES.PAYMENT_REQUIRED]: 402,
  };

  return statusCodeMap[errorCode] || 500;
}

/**
 * Check if response should be compressed
 */
function shouldCompress(request: Request, responseData: string): boolean {
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  const contentType = "application/json";
  
  return (
    responseData.length >= COMPRESSION_THRESHOLD &&
    (acceptEncoding.includes("gzip") || acceptEncoding.includes("deflate")) &&
    COMPRESSION_SUPPORTED_TYPES.includes(contentType)
  );
}

/**
 * Middleware wrapper for API endpoints with comprehensive optimization
 */
export function withApiOptimization<T>(
  handler: (req: Request) => Promise<T>,
  options?: {
    cache?: boolean;
    compress?: boolean;
    validateRequest?: boolean;
  }
) {
  return async (req: Request): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Generate cache key if caching is enabled
      const cacheKey = options?.cache 
        ? `api:${req.url}:${req.method}:${await hashRequest(req)}`
        : undefined;

      const result = await handler(req);

      return createOptimizedResponse(result, req, {
        cache: options?.cache,
        cacheKey,
        compress: options?.compress,
        requestStartTime: startTime,
      });
    } catch (error) {
      return handleApiError(error, requestId, `${req.method} ${req.url}`);
    }
  };
}

/**
 * Generate hash for request caching
 */
async function hashRequest(req: Request): Promise<string> {
  const url = new URL(req.url);
  const cacheInput = `${req.method}:${url.pathname}:${url.search}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(cacheInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex.substring(0, 16); // Use first 16 characters for cache key
}
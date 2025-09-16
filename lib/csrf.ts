import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF token in cookies
 */
export async function setCSRFToken(response: NextResponse): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
    path: "/",
  });
  
  // Also add token to response headers for client to read
  response.headers.set("X-CSRF-Token", token);
  
  return token;
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_TOKEN_NAME);
  return token?.value || null;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF validation for GET and HEAD requests
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // Check token in headers
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken && headerToken === cookieToken) {
    return true;
  }
  
  // Check token in body for forms
  try {
    const body = await request.clone().json();
    if (body.csrfToken && body.csrfToken === cookieToken) {
      return true;
    }
  } catch {
    // Body is not JSON, skip body check
  }
  
  return false;
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF for safe methods
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return handler(request);
  }
  
  const isValid = await validateCSRFToken(request);
  
  if (!isValid) {
    return NextResponse.json(
      {
        error: "CSRF token validation failed",
        message: "Invalid or missing CSRF token",
      },
      { status: 403 }
    );
  }
  
  return handler(request);
}

/**
 * Hook to get CSRF token for forms
 */
export function useCSRFToken(): { token: string | null; header: string } {
  return {
    token: null, // Will be set client-side
    header: CSRF_HEADER_NAME,
  };
}

/**
 * Add CSRF token to fetch options
 */
export function addCSRFToken(options: RequestInit = {}): RequestInit {
  const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  
  if (!token) {
    console.warn("CSRF token not found in meta tags");
    return options;
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      [CSRF_HEADER_NAME]: token,
    },
  };
}
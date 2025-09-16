/**
 * API Response Type Definitions for TBAT Mock Exam Platform
 * Aligned with backend API implementations from Story 1.4
 */

// Package API Types (/api/packages)
export interface Package {
  type: "FREE" | "ADVANCED";
  price: number; // 0 for Free, 69000 satang for Advanced
  features: string[];
  is_active: boolean;
  max_users_per_session?: number;
  name: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  buttonText: string;
  buttonStyle: "outline" | "solid";
  footerNote?: string;
  availability: {
    status: "available" | "limited" | "full";
    statusText: string;
    maxCapacity?: number;
    currentCount?: number;
  };
  features_detailed: PackageFeature[];
  limitations?: string[];
}

// Capacity API Types (/api/capacity)
export interface CapacityData {
  session_time: "MORNING" | "AFTERNOON";
  current_count: number;
  max_capacity: number; // 300 exam participants per session
  availability_status: "AVAILABLE" | "NEARLY_FULL" | "FULL" | "ADVANCED_ONLY";
  thai_message: string; // Localized capacity messaging
}

// Sessions API Types (/api/sessions)
export interface SessionInfo {
  sessionTime: "MORNING" | "AFTERNOON";
  timeSlot: "09:00-12:00" | "13:00-16:00";
  registrationCount: number;
  availabilityStatus: string;
  thaiTimeFormat: string; // Thai timezone (UTC+7)
}

// Data Fetching Hook Return Types
export interface UsePackagesHook {
  data: Package[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseCapacityHook {
  data: CapacityData[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseSessionsHook {
  data: SessionInfo[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Error Response Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

// Common API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ApiError;
  meta?: {
    timestamp: string;
    cached?: boolean;
  };
}


export interface PackageFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

// Retry mechanism configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
}

// Hook configuration options
export interface DataFetchingOptions {
  enabled?: boolean;
  refetchInterval?: number; // milliseconds
  retry?: RetryConfig;
  onError?: (error: Error) => void;
  onSuccess?: (data: unknown) => void;
}
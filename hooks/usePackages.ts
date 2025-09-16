'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UsePackagesHook, Package, DataFetchingOptions, RetryConfig, PackageFeature } from '@/types/api';
import { mockPackages, PackageType } from '@/lib/mock-data';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Custom hook for fetching package data with loading states and error handling
 * Currently uses mock data, prepared for API integration in Story 1.5
 */

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds  
  backoffFactor: 2
};

const DEFAULT_OPTIONS: Required<DataFetchingOptions> = {
  enabled: true,
  refetchInterval: 0, // No auto-refetch for packages by default
  retry: DEFAULT_RETRY_CONFIG,
  onError: () => {},
  onSuccess: () => {}
};

/**
 * Transform mock data to API-compatible format
 */
const transformMockToApi = (mockPkg: PackageType): Package => {
  return {
    type: mockPkg.type,
    name: mockPkg.name,
    price: mockPkg.price,
    features: mockPkg.features.map(f => f.text),
    is_active: mockPkg.availability.status !== 'full',
    max_users_per_session: mockPkg.availability.maxCapacity,
    description: mockPkg.description,
    badge: mockPkg.badge,
    badgeColor: mockPkg.badgeColor,
    features_detailed: mockPkg.features,
    limitations: mockPkg.limitations,
    availability: mockPkg.availability,
    buttonText: mockPkg.buttonText,
    buttonStyle: mockPkg.buttonStyle,
    footerNote: mockPkg.footerNote
  };
};

/**
 * Fallback: Simulate API call with mock data (used when live API fails)
 */
const fetchPackagesFromMock = async (): Promise<Package[]> => {
  // Simulate network delay (100-300ms)
  const delay = Math.random() * 200 + 100;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return mockPackages.map(transformMockToApi);
};

/**
 * Fetch packages from live API endpoint
 */
const fetchPackagesFromAPI = async (): Promise<Package[]> => {
  const response = await fetch('/api/packages?includeAvailability=true');
  
  if (!response.ok) {
    throw new Error(`API เกิดข้อผิดพลาด: ${response.status} - กรุณาลองใหม่อีกครั้ง`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลแพ็กเกจ');
  }
  
  // Transform API response to match expected Package interface
  return result.data.packages.map((apiPkg: any): Package => ({
    type: apiPkg.type,
    price: apiPkg.price,
    features: apiPkg.features,
    is_active: apiPkg.isActive,
    max_users_per_session: apiPkg.availability?.sessionCapacity?.morning?.maxCapacity || apiPkg.availability?.sessionCapacity?.afternoon?.maxCapacity,
    name: apiPkg.type === 'FREE' ? 'Free Package' : 'Advanced Package',
    description: apiPkg.description,
    badge: apiPkg.type === 'ADVANCED' ? 'แนะนำ' : undefined,
    badgeColor: apiPkg.type === 'ADVANCED' ? 'yellow' : undefined,
    buttonText: apiPkg.availability?.available ? 'เลือกแพ็กเกจ' : 'เต็มแล้ว',
    buttonStyle: apiPkg.type === 'ADVANCED' ? 'solid' : 'outline',
    footerNote: apiPkg.type === 'FREE' ? 'จำกัด 1 วิชา' : 'ครบทุกวิชา + เฉลย PDF',
    availability: {
      status: apiPkg.availability?.available ? 'available' : 'full',
      statusText: apiPkg.availability?.message || 'ยังมีที่นั่งว่าง',
      maxCapacity: apiPkg.availability?.sessionCapacity?.morning?.maxCapacity,
      currentCount: apiPkg.availability?.sessionCapacity?.morning?.totalCount
    },
    features_detailed: apiPkg.features.map((feature: string) => ({
      text: feature,
      included: true,
      highlight: false
    })),
    limitations: apiPkg.type === 'FREE' ? ['จำกัด 1 วิชา', 'ไม่มีเฉลย PDF'] : undefined
  }));
};

/**
 * Exponential backoff retry mechanism
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }
      
      // Calculate exponential backoff delay
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

export function usePackages(options: Partial<DataFetchingOptions> = {}): UsePackagesHook {
  // Memoize config to prevent object recreation on every render
  const config = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options
  }), [options.enabled, options.refetchInterval, options.retry, options.onError, options.onSuccess]);
  
  const { isOnline, getOfflineMessage } = useOnlineStatus();
  
  const [data, setData] = useState<Package[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a ref to prevent multiple fetches
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    if (!config.enabled || hasFetched.current) return;
    hasFetched.current = true;
    
    setLoading(true);
    setError(null);
    
    try {
      const packages = await executeWithRetry(fetchPackagesFromAPI, config.retry);
      setData(packages);
      config.onSuccess(packages);
    } catch (err) {
      console.warn('API failed, attempting fallback to mock data:', err);
      
      try {
        // Fallback to mock data with a warning
        const mockPackages = await fetchPackagesFromMock();
        setData(mockPackages);
        
        // Create a warning error to indicate we're using fallback data
        const offlineMessage = getOfflineMessage();
        const warningError = new Error(
          offlineMessage || 'กำลังใช้ข้อมูลสำรอง - การเชื่อมต่อ API มีปัญหา'
        );
        setError(warningError);
        config.onError(warningError);
      } catch (fallbackErr) {
        // Both API and fallback failed
        const errorObj = err instanceof Error ? err : new Error('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        setError(errorObj);
        config.onError(errorObj);
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies - stable callback

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (config.enabled && !hasFetched.current) {
      fetchData();
    }
  }, []); // Empty dependencies - run once on mount

  // Auto-refetch interval
  useEffect(() => {
    if (config.refetchInterval > 0 && config.enabled) {
      const interval = setInterval(() => {
        hasFetched.current = false; // Reset for interval fetch
        fetchData();
      }, config.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [config.refetchInterval, config.enabled]); // Depend on stable config values only

  return {
    data,
    loading,
    error,
    refetch
  };
}
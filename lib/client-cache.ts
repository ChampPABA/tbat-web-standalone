/**
 * Client-side caching strategy for improved performance
 * Reduces API calls and improves user experience
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum cache size
}

class ClientCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances with different TTLs for different types of data
export const packageCache = new ClientCache({ 
  ttl: 10 * 60 * 1000, // 10 minutes (packages don't change often)
  maxSize: 50 
});

export const capacityCache = new ClientCache({ 
  ttl: 30 * 1000, // 30 seconds (capacity changes frequently)
  maxSize: 20 
});

export const sessionCache = new ClientCache({ 
  ttl: 5 * 60 * 1000, // 5 minutes (session info is relatively stable)
  maxSize: 20 
});

// Cache keys
export const cacheKeys = {
  packages: (params?: string) => `packages${params ? `_${params}` : ''}`,
  capacity: (date?: string) => `capacity${date ? `_${date}` : ''}`,
  sessions: (date?: string) => `sessions${date ? `_${date}` : ''}`
};

// Cached fetch wrapper
export async function cachedFetch<T>(
  url: string, 
  cache: ClientCache, 
  cacheKey: string,
  fallbackData?: T
): Promise<{ data: T; fromCache: boolean }> {
  // Try cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  try {
    // Fetch from API
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'API Error');
    }

    // Cache the result
    cache.set(cacheKey, result.data, undefined);
    
    return { data: result.data, fromCache: false };
  } catch (error) {
    // If we have fallback data, use it
    if (fallbackData) {
      return { data: fallbackData, fromCache: false };
    }
    throw error;
  }
}

// Cleanup caches periodically
if (typeof window !== 'undefined') {
  // Clean up every 5 minutes
  setInterval(() => {
    packageCache.cleanup();
    capacityCache.cleanup();
    sessionCache.cleanup();
  }, 5 * 60 * 1000);
}
// import { get } from "@vercel/edge-config"; // Commenting out for development
// Mock get function for development
const get = async (key: string): Promise<any> => null;
import { redis, cacheKeys, cacheTTL } from "./redis";
import { logSecurityEvent, SecurityEventType } from "./monitoring";

// Edge Config cache keys
export const edgeConfigKeys = {
  packages: "packages",
  sessionTemplates: "session_templates",
  capacityConfig: "capacity_config",
  rateConfigs: "rate_configs",
} as const;

// Cache namespaces for different data types
export const cacheNamespaces = {
  packages: "edge:packages",
  sessions: "edge:sessions",
  capacity: "edge:capacity",
  config: "edge:config",
} as const;

/**
 * Enhanced Redis cache key generator with Edge Config namespace support
 */
export function generateCacheKey(namespace: string, identifier: string): string {
  return `${namespace}:${identifier}`;
}

/**
 * Fallback chain: Edge Config → Redis → Database
 * Implements the hybrid caching strategy with proper error handling
 */
export async function getCachedData<T>(
  edgeConfigKey: string,
  redisKey: string,
  fallbackFn: () => Promise<T>,
  ttl: number = 300 // 5 minutes default TTL
): Promise<T> {
  try {
    // Step 1: Try Edge Config (fastest, global edge distribution)
    if (process.env.EDGE_CONFIG) {
      try {
        const edgeData = await get(edgeConfigKey) as T;
        if (edgeData !== null && edgeData !== undefined) {
          // Cache hit from Edge Config - also warm Redis for next fallback
          warmRedisCache(redisKey, edgeData, ttl);
          return edgeData;
        }
      } catch (error) {
        console.warn(`Edge Config miss for key: ${edgeConfigKey}`, error);
        // Continue to Redis fallback
      }
    }

    // Step 2: Try Redis (medium speed, regional)
    try {
      const redisData = await redis.get(redisKey);
      if (redisData) {
        const parsed = JSON.parse(redisData as string) as T;
        return parsed;
      }
    } catch (error) {
      console.warn(`Redis cache miss for key: ${redisKey}`, error);
      // Continue to database fallback
    }

    // Step 3: Database fallback (slowest, most reliable)
    const freshData = await fallbackFn();
    
    // Warm both caches asynchronously for future requests
    warmRedisCache(redisKey, freshData, ttl);
    
    return freshData;
  } catch (error) {
    console.error("Cache fallback chain failed:", error);
    
    // Log security event for cache failures (potential infrastructure issues)
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      undefined,
      {
        event: "CACHE_FALLBACK_FAILURE",
        edgeConfigKey,
        redisKey,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    );
    
    throw error;
  }
}

/**
 * Warm Redis cache asynchronously without blocking the response
 */
async function warmRedisCache<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to warm Redis cache for key: ${key}`, error);
  }
}

/**
 * Invalidate cache at all levels with proper error handling
 * Used when data changes and caches need to be refreshed
 */
export async function invalidateHybridCache(
  edgeConfigKey: string, 
  redisKeys: string[]
): Promise<boolean> {
  let success = true;
  const errors: string[] = [];

  // Note: Edge Config cannot be invalidated programmatically
  // It's updated through Vercel dashboard or API, typically for static data
  console.log(`Edge Config key ${edgeConfigKey} requires manual refresh via Vercel dashboard`);

  // Invalidate Redis caches
  for (const redisKey of redisKeys) {
    try {
      await redis.del(redisKey);
    } catch (error) {
      success = false;
      errors.push(`Redis key ${redisKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Failed to invalidate Redis cache for key: ${redisKey}`, error);
    }
  }

  if (!success) {
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      undefined,
      {
        event: "CACHE_INVALIDATION_FAILURE",
        edgeConfigKey,
        redisKeys,
        errors,
      }
    );
  }

  return success;
}

/**
 * Package data caching with Edge Config primary and Redis fallback
 */
export async function getCachedPackages() {
  return getCachedData(
    edgeConfigKeys.packages,
    generateCacheKey(cacheNamespaces.packages, "all"),
    async () => {
      // This would normally fetch from database
      // Placeholder for database integration
      throw new Error("Database fallback not implemented for packages");
    },
    cacheTTL.sessionCapacity * 5 // 5 minutes for package data
  );
}

/**
 * Session template caching (static data perfect for Edge Config)
 */
export async function getCachedSessionTemplates() {
  return getCachedData(
    edgeConfigKeys.sessionTemplates,
    generateCacheKey(cacheNamespaces.sessions, "templates"),
    async () => {
      // Return default session templates as fallback
      return {
        morning: {
          sessionTime: "MORNING",
          displayTime: "09:00-12:00",
          maxCapacity: 300,
          description: "ช่วงเช้า - สอบเวลา 09:00 ถึง 12:00 น.",
        },
        afternoon: {
          sessionTime: "AFTERNOON",
          displayTime: "13:00-16:00", 
          maxCapacity: 300,
          description: "ช่วงบ่าย - สอบเวลา 13:00 ถึง 16:00 น.",
        },
      };
    },
    3600 // 1 hour TTL for session templates
  );
}

/**
 * Capacity configuration caching (business rules for capacity limits)
 */
export async function getCachedCapacityConfig() {
  return getCachedData(
    edgeConfigKeys.capacityConfig,
    generateCacheKey(cacheNamespaces.capacity, "config"),
    async () => {
      // Default capacity configuration as fallback
      return {
        maxParticipantsPerSession: 300,
        freePackageLimit: 150,
        concurrentUsers: 20,
        capacityWarningThreshold: 0.8, // 80% full warning
        capacityFullThreshold: 0.95, // 95% considered full
        hideExactFreeCount: true,
        thaiFullMessage: "เต็มแล้ว",
        thaiAvailableMessage: "ยังมีที่นั่งว่าง",
      };
    },
    1800 // 30 minutes TTL for capacity config
  );
}

/**
 * Enhanced session capacity caching with hybrid fallback
 * This function handles real-time capacity data that changes frequently
 */
export async function getCachedSessionCapacity(
  sessionTime: string, 
  date: string,
  fallbackFn: () => Promise<any>
) {
  const redisKey = cacheKeys.sessionCapacity(sessionTime, date);
  
  return getCachedData(
    `capacity_${sessionTime}_${date}`, // Edge Config key for capacity snapshots
    redisKey,
    fallbackFn,
    cacheTTL.sessionCapacity // 1 minute TTL for real-time capacity
  );
}

/**
 * Cache warming for critical data during low-traffic periods
 * This helps ensure cache hits during high-traffic registration periods
 */
export async function warmCriticalCaches(): Promise<boolean> {
  try {
    console.log("🔥 Starting critical cache warming...");

    // Warm package cache
    await getCachedPackages().catch(() => {
      console.warn("Failed to warm package cache");
    });

    // Warm session templates
    await getCachedSessionTemplates().catch(() => {
      console.warn("Failed to warm session templates");
    });

    // Warm capacity config
    await getCachedCapacityConfig().catch(() => {
      console.warn("Failed to warm capacity config");
    });

    console.log("✅ Critical cache warming completed");
    return true;
  } catch (error) {
    console.error("❌ Critical cache warming failed:", error);
    return false;
  }
}

/**
 * Health check for hybrid caching system
 * Verifies both Edge Config and Redis connectivity
 */
export async function checkCacheHealth(): Promise<{
  edgeConfig: boolean;
  redis: boolean;
  overall: boolean;
}> {
  const health = {
    edgeConfig: false,
    redis: false,
    overall: false,
  };

  // Test Edge Config connectivity
  try {
    if (process.env.EDGE_CONFIG) {
      await get("health_check");
      health.edgeConfig = true;
    } else {
      health.edgeConfig = true; // No Edge Config configured is acceptable
    }
  } catch (error) {
    console.error("Edge Config health check failed:", error);
  }

  // Test Redis connectivity
  try {
    const testKey = "health_check_" + Date.now();
    await redis.setex(testKey, 10, "test");
    await redis.get(testKey);
    await redis.del(testKey);
    health.redis = true;
  } catch (error) {
    console.error("Redis health check failed:", error);
  }

  health.overall = health.edgeConfig && health.redis;

  return health;
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
  redisConnected: boolean;
  edgeConfigEnabled: boolean;
  cacheKeys: string[];
}> {
  const stats = {
    redisConnected: false,
    edgeConfigEnabled: Boolean(process.env.EDGE_CONFIG),
    cacheKeys: [] as string[],
  };

  try {
    // Test Redis connection
    await redis.ping();
    stats.redisConnected = true;

    // Get cache key samples (limit to prevent memory issues)
    if ('keys' in redis) {
      const keys = await (redis as any).keys("edge:*");
      stats.cacheKeys = keys.slice(0, 10); // First 10 keys as sample
    }
  } catch (error) {
    console.error("Cache stats collection failed:", error);
  }

  return stats;
}
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

// Local Redis for development
const localRedis = new Redis({
  host: "localhost",
  port: 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Upstash Redis for production
const upstashRedis = process.env.UPSTASH_REDIS_REST_URL
  ? new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Use Upstash in production, local Redis in development
export const redis = upstashRedis || localRedis;

// Cache keys with hybrid caching namespace support
export const cacheKeys = {
  sessionCapacity: (sessionTime: string, date: string) => `session:capacity:${sessionTime}:${date}`,
  examResult: (userId: string, examId: string) => `result:${userId}:${examId}`,
  analytics: (userId: string) => `analytics:${userId}`,
  userSession: (sessionToken: string) => `session:${sessionToken}`,
  examCode: (code: string) => `exam:code:${code}`,
  pdfDownload: (token: string) => `pdf:download:${token}`,
  // New hybrid cache keys
  packages: "hybrid:packages:all",
  packageAvailability: (packageType: string) => `hybrid:packages:availability:${packageType}`,
  sessionStatus: (sessionTime: string, date: string) => `hybrid:sessions:${sessionTime}:${date}`,
  capacityRealtime: (sessionTime: string, date: string) => `hybrid:capacity:realtime:${sessionTime}:${date}`,
  apiResponseCache: (endpoint: string, params: string) => `api:cache:${endpoint}:${params}`,
};

// Cache TTL (in seconds) with hybrid caching TTL strategy
export const cacheTTL = {
  sessionCapacity: 60, // 1 minute for real-time capacity
  examResult: 3600, // 1 hour
  analytics: 1800, // 30 minutes
  userSession: 604800, // 7 days
  examCode: 86400, // 1 day
  pdfDownload: 86400, // 1 day
  // Hybrid caching TTLs
  packages: 300, // 5 minutes for package data (relatively static)
  packageAvailability: 60, // 1 minute for package availability (dynamic)
  sessionStatus: 30, // 30 seconds for session status (very dynamic)
  capacityRealtime: 60, // 1 minute for real-time capacity
  apiResponseCache: 300, // 5 minutes for API response caching
};

// Session capacity management
export async function getSessionCapacity(sessionTime: string, date: string) {
  const key = cacheKeys.sessionCapacity(sessionTime, date);

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting session capacity from cache:", error);
    return null;
  }
}

export async function setSessionCapacity(sessionTime: string, date: string, capacity: any) {
  const key = cacheKeys.sessionCapacity(sessionTime, date);

  try {
    await redis.setex(key, cacheTTL.sessionCapacity, JSON.stringify(capacity));
    return true;
  } catch (error) {
    console.error("Error setting session capacity in cache:", error);
    return false;
  }
}

// Exam result caching
export async function getCachedExamResult(userId: string, examId: string) {
  const key = cacheKeys.examResult(userId, examId);

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting exam result from cache:", error);
    return null;
  }
}

export async function cacheExamResult(userId: string, examId: string, result: any) {
  const key = cacheKeys.examResult(userId, examId);

  try {
    await redis.setex(key, cacheTTL.examResult, JSON.stringify(result));
    return true;
  } catch (error) {
    console.error("Error caching exam result:", error);
    return false;
  }
}

// Analytics caching
export async function getCachedAnalytics(userId: string) {
  const key = cacheKeys.analytics(userId);

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting analytics from cache:", error);
    return null;
  }
}

export async function cacheAnalytics(userId: string, analytics: any) {
  const key = cacheKeys.analytics(userId);

  try {
    await redis.setex(key, cacheTTL.analytics, JSON.stringify(analytics));
    return true;
  } catch (error) {
    console.error("Error caching analytics:", error);
    return false;
  }
}

// Invalidate cache
export async function invalidateCache(pattern: string) {
  try {
    if (localRedis) {
      const keys = await localRedis.keys(pattern);
      if (keys.length > 0) {
        await localRedis.del(...keys);
      }
    } else if (upstashRedis) {
      // Upstash doesn't support pattern-based deletion
      // Need to handle this differently in production
      console.warn("Pattern-based cache invalidation not supported in Upstash");
    }
    return true;
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return false;
  }
}

// Enhanced package caching for hybrid system
export async function getCachedPackageData() {
  const key = cacheKeys.packages;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting package data from cache:", error);
    return null;
  }
}

export async function setCachedPackageData(data: any) {
  const key = cacheKeys.packages;
  
  try {
    await redis.setex(key, cacheTTL.packages, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error setting package data in cache:", error);
    return false;
  }
}

// Package availability caching (for dynamic availability counts)
export async function getCachedPackageAvailability(packageType: string) {
  const key = cacheKeys.packageAvailability(packageType);
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting package availability from cache:", error);
    return null;
  }
}

export async function setCachedPackageAvailability(packageType: string, availability: any) {
  const key = cacheKeys.packageAvailability(packageType);
  
  try {
    await redis.setex(key, cacheTTL.packageAvailability, JSON.stringify(availability));
    return true;
  } catch (error) {
    console.error("Error setting package availability in cache:", error);
    return false;
  }
}

// Real-time capacity caching with shorter TTL
export async function getCachedRealtimeCapacity(sessionTime: string, date: string) {
  const key = cacheKeys.capacityRealtime(sessionTime, date);
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting realtime capacity from cache:", error);
    return null;
  }
}

export async function setCachedRealtimeCapacity(sessionTime: string, date: string, capacity: any) {
  const key = cacheKeys.capacityRealtime(sessionTime, date);
  
  try {
    await redis.setex(key, cacheTTL.capacityRealtime, JSON.stringify(capacity));
    return true;
  } catch (error) {
    console.error("Error setting realtime capacity in cache:", error);
    return false;
  }
}

// API response caching for better performance
export async function getCachedApiResponse(endpoint: string, params: string = "") {
  const key = cacheKeys.apiResponseCache(endpoint, params);
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error("Error getting API response from cache:", error);
    return null;
  }
}

export async function setCachedApiResponse(endpoint: string, params: string = "", response: any) {
  const key = cacheKeys.apiResponseCache(endpoint, params);
  
  try {
    await redis.setex(key, cacheTTL.apiResponseCache, JSON.stringify(response));
    return true;
  } catch (error) {
    console.error("Error setting API response in cache:", error);
    return false;
  }
}

// Cache invalidation with pattern support for hybrid system
export async function invalidateHybridCache(pattern: string) {
  try {
    if (localRedis) {
      const keys = await localRedis.keys(pattern);
      if (keys.length > 0) {
        await localRedis.del(...keys);
        console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } else if (upstashRedis) {
      // Upstash doesn't support pattern-based deletion
      // For production, we'll need to track keys and delete individually
      console.warn("Pattern-based cache invalidation not supported in Upstash");
      console.warn(`Manual invalidation required for pattern: ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error("Error invalidating hybrid cache:", error);
    return false;
  }
}

// Batch cache operations for efficiency
export async function batchSetCache(cacheItems: Array<{ key: string; value: any; ttl: number }>) {
  try {
    const pipeline = localRedis ? localRedis.pipeline() : null;
    
    if (pipeline) {
      // Use pipeline for local Redis for better performance
      for (const item of cacheItems) {
        pipeline.setex(item.key, item.ttl, JSON.stringify(item.value));
      }
      await pipeline.exec();
    } else {
      // For Upstash, execute sequentially
      for (const item of cacheItems) {
        await redis.setex(item.key, item.ttl, JSON.stringify(item.value));
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in batch cache set:", error);
    return false;
  }
}

// Enhanced cache monitoring with Sentry integration
export async function getCacheMetrics() {
  try {
    const metrics = {
      connected: false,
      keyCount: 0,
      memoryUsage: 0,
      hitRate: 0,
      errors: [] as string[],
    };

    if (localRedis) {
      const info = await localRedis.info("memory");
      const keyspace = await localRedis.info("keyspace");
      
      metrics.connected = true;
      metrics.memoryUsage = parseFloat(info.match(/used_memory:(\d+)/)?.[1] || "0");
      
      // Parse keyspace info for key count
      const dbMatch = keyspace.match(/db0:keys=(\d+)/);
      metrics.keyCount = parseInt(dbMatch?.[1] || "0");
    } else if (upstashRedis) {
      await upstashRedis.ping();
      metrics.connected = true;
      // Upstash doesn't provide detailed metrics via INFO command
    }

    return metrics;
  } catch (error) {
    console.error("Cache metrics collection failed:", error);
    return {
      connected: false,
      keyCount: 0,
      memoryUsage: 0,
      hitRate: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// Health check
export async function checkRedisConnection() {
  try {
    if (localRedis) {
      const pong = await localRedis.ping();
      return pong === "PONG";
    } else if (upstashRedis) {
      await upstashRedis.ping();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Redis connection check failed:", error);
    return false;
  }
}

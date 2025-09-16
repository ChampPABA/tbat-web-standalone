/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { 
  getCachedData, 
  invalidateHybridCache, 
  warmCriticalCaches, 
  checkCacheHealth,
  getCacheStats 
} from "../../lib/edge-config";
import { 
  getCachedPackageData,
  setCachedPackageData,
  getCachedRealtimeCapacity,
  setCachedRealtimeCapacity,
  checkRedisConnection 
} from "../../lib/redis";

// Mock Edge Config
jest.mock("@vercel/edge-config", () => ({
  get: jest.fn(),
}));

// Mock Redis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(() => Promise.resolve("PONG" as string)),
    info: jest.fn(),
  }));
});

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(() => Promise.resolve("PONG" as string)),
  })),
}));

describe("Hybrid Caching Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment for Edge Config
    process.env.EDGE_CONFIG = "test-edge-config-url";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.EDGE_CONFIG;
  });

  describe("Cache Fallback Chain", () => {
    it("should try Edge Config first, then Redis, then fallback function", async () => {
      const { get } = require("@vercel/edge-config");
      
      // Edge Config returns data
      (get as jest.MockedFunction<any>).mockResolvedValue({
        packages: ["package1", "package2"]
      });

      const fallbackFn = jest.fn((): Promise<{ fallback: boolean }> => Promise.resolve({ fallback: true }));
      
      const result = await getCachedData(
        "packages",
        "redis:packages",
        fallbackFn,
        300
      );

      expect(get).toHaveBeenCalledWith("packages");
      expect(fallbackFn).not.toHaveBeenCalled();
      expect(result).toEqual({ packages: ["package1", "package2"] });
    });

    it("should fall back to Redis when Edge Config fails", async () => {
      const { get } = require("@vercel/edge-config");
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Edge Config fails
      (get as jest.MockedFunction<any>).mockRejectedValue(new Error("Edge Config error"));
      
      // Redis returns data
      (mockRedisInstance.get as jest.MockedFunction<any>).mockResolvedValue(
        JSON.stringify({ cached: "redis-data" })
      );

      const fallbackFn = jest.fn((): Promise<{ fallback: boolean }> => Promise.resolve({ fallback: true }));
      
      const result = await getCachedData(
        "packages",
        "redis:packages",
        fallbackFn,
        300
      );

      expect(result).toEqual({ cached: "redis-data" });
      expect(fallbackFn).not.toHaveBeenCalled();
    });

    it("should use fallback function when both Edge Config and Redis fail", async () => {
      const { get } = require("@vercel/edge-config");
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Edge Config fails
      (get as jest.MockedFunction<any>).mockRejectedValue(new Error("Edge Config error"));
      
      // Redis fails
      (mockRedisInstance.get as jest.MockedFunction<any>).mockRejectedValue(new Error("Redis error"));

      const fallbackFn = jest.fn((): Promise<{ fallback: string }> => Promise.resolve({ fallback: "database-data" }));
      
      const result = await getCachedData(
        "packages",
        "redis:packages",
        fallbackFn,
        300
      );

      expect(result).toEqual({ fallback: "database-data" });
      expect(fallbackFn).toHaveBeenCalled();
    });
  });

  describe("Cache Warming", () => {
    it("should warm critical caches successfully", async () => {
      const { get } = require("@vercel/edge-config");
      
      // Mock successful cache warming
      (get as jest.MockedFunction<any>)
        .mockResolvedValueOnce({ packages: [] }) // packages
        .mockResolvedValueOnce({ sessions: [] }) // sessions
        .mockResolvedValueOnce({ capacity: {} }); // capacity config

      const result = await warmCriticalCaches();
      
      expect(result).toBe(true);
      expect(get).toHaveBeenCalledTimes(3);
    });

    it("should handle cache warming failures gracefully", async () => {
      const { get } = require("@vercel/edge-config");
      
      // Mock cache warming failure
      (get as jest.MockedFunction<any>).mockRejectedValue(new Error("Cache warming failed"));

      const result = await warmCriticalCaches();
      
      expect(result).toBe(false);
    });
  });

  describe("Redis Integration", () => {
    it("should cache and retrieve package data", async () => {
      const testPackageData = [
        { id: "1", type: "FREE", price: 0 },
        { id: "2", type: "ADVANCED", price: 69000 }
      ];

      // Test setting cache
      const setResult = await setCachedPackageData(testPackageData);
      expect(setResult).toBe(true);

      // Test getting from cache (would normally return the data)
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      (mockRedisInstance.get as jest.MockedFunction<any>).mockResolvedValue(
        JSON.stringify(testPackageData)
      );

      const cachedData = await getCachedPackageData();
      expect(cachedData).toEqual(testPackageData);
    });

    it("should handle Redis connection errors", async () => {
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock Redis error
      (mockRedisInstance.get as jest.MockedFunction<any>).mockRejectedValue(
        new Error("Redis connection failed")
      );

      const result = await getCachedPackageData();
      expect(result).toBeNull();
    });

    it("should cache and retrieve realtime capacity data", async () => {
      const testCapacityData = {
        sessionTime: "MORNING",
        totalCount: 50,
        freeCount: 30,
        advancedCount: 20,
        maxCapacity: 300,
        availabilityStatus: "AVAILABLE",
      };

      const setResult = await setCachedRealtimeCapacity(
        "MORNING",
        "2025-09-27",
        testCapacityData
      );
      expect(setResult).toBe(true);

      // Mock Redis returning cached data
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      (mockRedisInstance.get as jest.MockedFunction<any>).mockResolvedValue(
        JSON.stringify(testCapacityData)
      );

      const cachedData = await getCachedRealtimeCapacity("MORNING", "2025-09-27");
      expect(cachedData).toEqual(testCapacityData);
    });
  });

  describe("Cache Health Monitoring", () => {
    it("should check cache health successfully", async () => {
      const { get } = require("@vercel/edge-config");
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock successful health checks
      (get as jest.MockedFunction<any>).mockResolvedValue(null); // Edge Config working
      (mockRedisInstance.ping as jest.MockedFunction<any>).mockResolvedValue("PONG");

      const health = await checkCacheHealth();
      
      expect(health.edgeConfig).toBe(true);
      expect(health.redis).toBe(true);
      expect(health.overall).toBe(true);
    });

    it("should detect Redis connection issues", async () => {
      const { get } = require("@vercel/edge-config");
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock Redis failure
      (get as jest.MockedFunction<any>).mockResolvedValue(null);
      (mockRedisInstance.ping as jest.MockedFunction<any>).mockRejectedValue(
        new Error("Redis connection failed")
      );

      const health = await checkCacheHealth();
      
      expect(health.edgeConfig).toBe(true);
      expect(health.redis).toBe(false);
      expect(health.overall).toBe(false);
    });

    it("should detect Edge Config issues", async () => {
      const { get } = require("@vercel/edge-config");
      
      // Mock Edge Config failure
      (get as jest.MockedFunction<any>).mockRejectedValue(new Error("Edge Config error"));

      const health = await checkCacheHealth();
      
      expect(health.edgeConfig).toBe(false);
      expect(health.overall).toBe(false);
    });
  });

  describe("Cache Statistics", () => {
    it("should collect cache statistics", async () => {
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock Redis stats
      (mockRedisInstance.ping as jest.MockedFunction<any>).mockResolvedValue("PONG");
      (mockRedisInstance.keys as jest.MockedFunction<any>).mockResolvedValue([
        "edge:packages:all",
        "edge:capacity:morning",
        "edge:capacity:afternoon",
      ]);

      const stats = await getCacheStats();
      
      expect(stats.redisConnected).toBe(true);
      expect(stats.edgeConfigEnabled).toBe(true);
      expect(stats.cacheKeys).toEqual(
        expect.arrayContaining([
          "edge:packages:all",
          "edge:capacity:morning",
          "edge:capacity:afternoon",
        ])
      );
    });

    it("should handle statistics collection errors", async () => {
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock Redis failure
      (mockRedisInstance.ping as jest.MockedFunction<any>).mockRejectedValue(
        new Error("Connection failed")
      );

      const stats = await getCacheStats();
      
      expect(stats.redisConnected).toBe(false);
      expect(stats.cacheKeys).toEqual([]);
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate hybrid cache with pattern", async () => {
      const result = await invalidateHybridCache(
        "packages", 
        ["redis:packages:*", "redis:availability:*"]
      );
      
      // Should succeed (mocked behavior)
      expect(result).toBe(true);
    });

    it("should handle cache invalidation errors", async () => {
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock Redis error during invalidation
      (mockRedisInstance.del as jest.MockedFunction<any>).mockRejectedValue(
        new Error("Delete failed")
      );

      const result = await invalidateHybridCache(
        "packages",
        ["redis:packages:error"]
      );
      
      expect(result).toBe(false);
    });
  });

  describe("Performance Testing", () => {
    it("should handle high concurrency cache access", async () => {
      const { get } = require("@vercel/edge-config");
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Mock fast Edge Config responses
      (get as jest.MockedFunction<any>).mockImplementation(() => 
        Promise.resolve({ fastData: true })
      );

      // Simulate 20 concurrent requests (as per requirements)
      const concurrentRequests = Array.from({ length: 20 }, () =>
        getCachedData(
          "packages",
          "redis:packages",
          () => Promise.resolve({ slow: true }),
          300
        )
      );

      const results = await Promise.all(concurrentRequests);
      
      // All should return Edge Config data (fastest tier)
      results.forEach(result => {
        expect(result).toEqual({ fastData: true });
      });

      // Edge Config should be called 20 times (one per request)
      expect(get).toHaveBeenCalledTimes(20);
    });

    it("should maintain performance under cache misses", async () => {
      const { get } = require("@vercel/edge-config");
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Edge Config misses
      (get as jest.MockedFunction<any>).mockResolvedValue(null);
      
      // Redis misses
      (mockRedisInstance.get as jest.MockedFunction<any>).mockResolvedValue(null);

      const fallbackFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({ database: true }), 50); // 50ms simulated DB query
        })
      );

      const startTime = Date.now();
      
      // Test 5 concurrent requests hitting database
      const concurrentRequests = Array.from({ length: 5 }, () =>
        getCachedData("packages", "redis:packages", fallbackFn as () => Promise<unknown>, 300)
      );

      const results = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;
      
      // Should complete within reasonable time (under 200ms as per requirements)
      expect(totalTime).toBeLessThan(200);
      
      // All should return database data
      results.forEach(result => {
        expect(result).toEqual({ database: true });
      });
    });
  });

  describe("TTL and Expiration", () => {
    it("should respect different TTL values for different data types", async () => {
      const Redis = require("ioredis");
      const mockRedisInstance = new Redis();
      
      // Test package data caching (5 minutes TTL)
      await setCachedPackageData({ test: "packages" });
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "hybrid:packages:all",
        300, // 5 minutes in seconds
        expect.any(String)
      );

      // Test capacity data caching (1 minute TTL)
      await setCachedRealtimeCapacity("MORNING", "2025-09-27", { test: "capacity" });
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        expect.stringContaining("hybrid:capacity:realtime:MORNING:2025-09-27"),
        60, // 1 minute in seconds
        expect.any(String)
      );
    });
  });
});
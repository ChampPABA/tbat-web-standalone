/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { 
  simulateConcurrentLoad,
  monitorRateLimitPatterns,
  loadTestRateLimit 
} from "../../lib/rate-limit";
import { NextRequest } from "next/server";

// Mock dependencies for load testing
jest.mock("@/lib/monitoring", () => ({
  monitorRateLimit: jest.fn(),
  logSecurityEvent: jest.fn(),
  monitorAPIResponse: jest.fn(),
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  },
}));

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    ping: jest.fn().mockResolvedValue("PONG" as never),
  })),
}));

describe("Load Testing Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Concurrent User Simulation", () => {
    it("should handle 20 concurrent users as per architecture requirements", async () => {
      const result = await simulateConcurrentLoad(
        "/api/capacity",
        20, // 20 concurrent users
        10  // 10 requests per user
      );

      expect(result.totalRequests).toBe(200); // 20 users × 10 requests
      expect(result.successfulRequests).toBeGreaterThan(0);
      expect(result.averageResponseTime).toBeLessThan(200); // < 200ms requirement
      expect(result.rateLimitedRequests).toBeGreaterThanOrEqual(0);
      
      // Calculate success rate
      const successRate = result.successfulRequests / result.totalRequests;
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
    });

    it("should maintain performance under maximum load", async () => {
      const result = await simulateConcurrentLoad(
        "/api/packages",
        20, // Maximum concurrent users
        30  // Higher request load per user
      );

      expect(result.totalRequests).toBe(600); // 20 users × 30 requests
      expect(result.averageResponseTime).toBeLessThan(300); // Acceptable under high load
      
      // Should handle high load gracefully
      const errorRate = result.rateLimitedRequests / result.totalRequests;
      expect(errorRate).toBeLessThan(0.3); // Less than 30% error rate under high load
    });

    it("should test session capacity endpoint under load", async () => {
      const result = await simulateConcurrentLoad(
        "/api/sessions",
        20,
        15 // Moderate load for session queries
      );

      expect(result.totalRequests).toBe(300); // 20 users × 15 requests
      expect(result.averageResponseTime).toBeLessThan(250); // Session queries should be fast
      
      // Session queries should have high success rate due to caching
      const successRate = result.successfulRequests / result.totalRequests;
      expect(successRate).toBeGreaterThan(0.85);
    });
  });

  describe("Rate Limiting Under Load", () => {
    it("should apply appropriate rate limits for capacity endpoint", async () => {
      const request = new NextRequest("http://localhost:3000/api/capacity");
      
      // Test multiple rapid requests (simulating high traffic)
      const rapidRequests = Array.from({ length: 10 }, async () => {
        return loadTestRateLimit(request);
      });

      const results = await Promise.all(rapidRequests);
      
      // Should handle all requests within rate limit (1200 requests/minute for load testing)
      results.forEach(result => {
        expect(result).toBeNull(); // No rate limiting should occur
      });
    });

    it("should detect and handle rate limit abuse during registration periods", async () => {
      // Mock high-frequency requests from same client
      const mockRequests = Array.from({ length: 100 }, () => 
        new NextRequest("http://localhost:3000/api/capacity", {
          headers: {
            "x-forwarded-for": "192.168.1.100", // Same IP
            "user-agent": "test-bot/1.0"
          }
        })
      );

      let rateLimitedCount = 0;

      for (const request of mockRequests) {
        const result = await loadTestRateLimit(request);
        if (result && result.status === 429) {
          rateLimitedCount++;
        }
      }

      // Should rate limit excessive requests
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe("Performance Monitoring", () => {
    it("should monitor rate limit patterns during load testing", async () => {
      const patterns = await monitorRateLimitPatterns();
      
      expect(patterns).toHaveProperty("totalRequests");
      expect(patterns).toHaveProperty("blockedRequests");
      expect(patterns).toHaveProperty("topBlockedIPs");
      expect(patterns).toHaveProperty("suspiciousPatterns");
      
      // Should be arrays/numbers
      expect(typeof patterns.totalRequests).toBe("number");
      expect(typeof patterns.blockedRequests).toBe("number");
      expect(Array.isArray(patterns.topBlockedIPs)).toBe(true);
      expect(Array.isArray(patterns.suspiciousPatterns)).toBe(true);
    });

    it("should identify suspicious traffic patterns", async () => {
      // Simulate monitoring data with suspicious patterns
      const patterns = await monitorRateLimitPatterns();
      
      // Check structure of suspicious patterns
      if (patterns.suspiciousPatterns.length > 0) {
        patterns.suspiciousPatterns.forEach(pattern => {
          expect(pattern).toHaveProperty("pattern");
          expect(pattern).toHaveProperty("severity");
          expect(["LOW", "MEDIUM", "HIGH"]).toContain(pattern.severity);
        });
      }
    });
  });

  describe("API Endpoint Load Testing", () => {
    it("should simulate real-world registration traffic", async () => {
      // Simulate registration period traffic pattern
      const endpoints = ["/api/packages", "/api/capacity", "/api/sessions"];
      
      const results = await Promise.all(
        endpoints.map(endpoint => 
          simulateConcurrentLoad(endpoint, 15, 8) // 15 users, 8 requests each
        )
      );

      results.forEach((result, index) => {
        expect(result.totalRequests).toBe(120); // 15 × 8
        expect(result.averageResponseTime).toBeLessThan(200);
        
        // Different endpoints may have different success rates
        const successRate = result.successfulRequests / result.totalRequests;
        expect(successRate).toBeGreaterThan(0.7);
        
        console.log(`Endpoint ${endpoints[index]}: ${result.successfulRequests}/${result.totalRequests} successful (${Math.round(successRate * 100)}%)`);
      });
    });

    it("should handle burst traffic scenarios", async () => {
      // Simulate sudden traffic burst (like during registration opening)
      const burstResult = await simulateConcurrentLoad(
        "/api/capacity",
        30, // Higher than normal concurrent users
        5   // Quick burst of requests
      );

      expect(burstResult.totalRequests).toBe(150); // 30 × 5
      
      // Should handle burst gracefully, even if some requests are rate limited
      const successRate = burstResult.successfulRequests / burstResult.totalRequests;
      expect(successRate).toBeGreaterThan(0.5); // At least 50% success during burst
      
      // Average response time may be higher during burst but should still be reasonable
      expect(burstResult.averageResponseTime).toBeLessThan(500);
    });
  });

  describe("Cache Performance Under Load", () => {
    it("should maintain cache hit rates during high traffic", async () => {
      // Simulate repeated requests that should benefit from caching
      const result = await simulateConcurrentLoad(
        "/api/packages", // Packages are heavily cached
        20,
        10
      );

      expect(result.averageResponseTime).toBeLessThan(100); // Should be very fast due to caching
      
      const successRate = result.successfulRequests / result.totalRequests;
      expect(successRate).toBeGreaterThan(0.9); // High success rate due to caching
    });

    it("should test cache warming effectiveness", async () => {
      // Simulate cache warming followed by high traffic
      const beforeWarmingResult = await simulateConcurrentLoad(
        "/api/sessions",
        10,
        5
      );

      // After cache warming, subsequent requests should be faster
      const afterWarmingResult = await simulateConcurrentLoad(
        "/api/sessions",
        10,
        5
      );

      // Response times should be similar or better after warming
      expect(afterWarmingResult.averageResponseTime).toBeLessThanOrEqual(
        beforeWarmingResult.averageResponseTime * 1.1 // Within 10% tolerance
      );
    });
  });

  describe("Edge Case Load Testing", () => {
    it("should handle edge case: all users hitting same session", async () => {
      // Simulate all users checking the same session capacity
      const result = await simulateConcurrentLoad(
        "/api/capacity?sessionTime=MORNING&examDate=2025-09-27",
        20,
        10
      );

      expect(result.totalRequests).toBe(200);
      
      // Should handle concentrated load on same resource
      const successRate = result.successfulRequests / result.totalRequests;
      expect(successRate).toBeGreaterThan(0.8);
    });

    it("should handle edge case: rapid capacity checks during registration", async () => {
      // Simulate rapid capacity checks as users attempt to register
      const result = await simulateConcurrentLoad(
        "/api/capacity",
        25, // Slightly above normal capacity
        20  // Many requests per user
      );

      expect(result.totalRequests).toBe(500); // 25 × 20
      
      // High volume should trigger some rate limiting
      expect(result.rateLimitedRequests).toBeGreaterThan(0);
      
      // But system should remain stable
      const systemStabilityRate = result.successfulRequests / result.totalRequests;
      expect(systemStabilityRate).toBeGreaterThan(0.6); // At least 60% success under extreme load
    });
  });

  describe("Load Testing Metrics", () => {
    it("should collect comprehensive load testing metrics", async () => {
      const result = await simulateConcurrentLoad(
        "/api/packages",
        20,
        10
      );

      // Verify all metrics are present and reasonable
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.successfulRequests).toBeGreaterThanOrEqual(0);
      expect(result.rateLimitedRequests).toBeGreaterThanOrEqual(0);
      expect(result.averageResponseTime).toBeGreaterThan(0);
      
      // Total should equal successful + rate limited
      expect(result.totalRequests).toBe(
        result.successfulRequests + result.rateLimitedRequests
      );
    });

    it("should validate response time requirements", async () => {
      const endpointTests = [
        { endpoint: "/api/packages", maxTime: 150 },
        { endpoint: "/api/capacity", maxTime: 200 },
        { endpoint: "/api/sessions", maxTime: 180 },
      ];

      for (const test of endpointTests) {
        const result = await simulateConcurrentLoad(test.endpoint, 10, 5);
        
        expect(result.averageResponseTime).toBeLessThan(test.maxTime);
        console.log(
          `${test.endpoint}: ${result.averageResponseTime}ms (limit: ${test.maxTime}ms)`
        );
      }
    });
  });
});
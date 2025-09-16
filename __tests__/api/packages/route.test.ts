/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/packages/route";
import { PrismaClient } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => Promise.resolve(null)), // No rate limit by default
  rateLimitConfigs: {
    api: {
      windowMs: 60000,
      max: 100,
      message: "Too many requests",
      byUser: true,
      byIP: true,
    },
  },
}));

jest.mock("@/lib/redis", () => ({
  getCachedPackageData: jest.fn(() => Promise.resolve(null)),
  setCachedPackageData: jest.fn(() => Promise.resolve(true)),
  getCachedPackageAvailability: jest.fn(() => Promise.resolve(null)),
  setCachedPackageAvailability: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("@/lib/capacity", () => ({
  calculateSessionCapacity: jest.fn(() => Promise.resolve({
    sessionTime: "MORNING",
    examDate: new Date("2025-09-27"),
    totalCount: 5,
    freeCount: 3,
    advancedCount: 2,
    maxCapacity: 300,
    freeLimit: 150,
    availabilityStatus: "AVAILABLE",
    message: "ยังมีที่นั่งว่าง",
    messageEn: "Seats available",
    hideExactCount: false,
    percentageFull: 0.02,
  })),
}));

jest.mock("@/lib/edge-config", () => ({
  getCachedData: jest.fn(() => Promise.resolve(null)),
  getCachedPackages: jest.fn(() => Promise.resolve(null)),
}));

// Mock Prisma
const mockPrisma = {
  package: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Replace the actual Prisma import with mock
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe("GET /api/packages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock data
    (mockPrisma.package.findMany as jest.MockedFunction<any>).mockResolvedValue([
      {
        id: "pkg-1",
        type: "FREE",
        price: 0,
        currency: "thb",
        features: [
          "เข้าสอบได้ 1 วิชา",
          "ดูผลคะแนนเบื้องต้น",
          "เปรียบเทียบคะแนนเฉลี่ย",
          "ข้อมูลสถิติพื้นฐาน"
        ],
        description: "แพ็กเกจฟรี - เข้าสอบ 1 วิชา พร้อมผลคะแนนเบื้องต้น",
        isActive: true,
      },
      {
        id: "pkg-2",
        type: "ADVANCED",
        price: 69000,
        currency: "thb",
        features: [
          "เข้าสอบได้ครบ 3 วิชา (ชีววิทยา เคมี ฟิสิกส์)",
          "วิเคราะห์ผลคะแนนละเอียด",
          "เปรียบเทียบคะแนนแต่ละวิชา",
          "กราฟแสดงจุดแข็ง-จุดอ่อน",
          "ดาวน์โหลดเฉลย PDF",
          "คำแนะนำการปรับปรุง",
          "สถิติเปรียบเทียบเชิงลึก"
        ],
        description: "แพ็กเกจพรีเมียม - เข้าสอบครบ 3 วิชา พร้อมวิเคราะห์ผลละเอียดและเฉลย PDF",
        isActive: true,
      },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return packages successfully", async () => {
    const request = new NextRequest("http://localhost:3000/api/packages");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.packages).toHaveLength(2);
    expect(data.data.packages[0].type).toBe("FREE");
    expect(data.data.packages[1].type).toBe("ADVANCED");
    expect(data.data.metadata).toEqual(
      expect.objectContaining({
        totalPackages: 2,
        activePackages: 2,
        examDate: "2025-09-27",
        cacheHit: false,
      })
    );
  });

  it("should return packages without availability when includeAvailability=false", async () => {
    const request = new NextRequest("http://localhost:3000/api/packages?includeAvailability=false");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.packages[0].availability).toBeUndefined();
    expect(data.data.metadata.examDate).toBeUndefined();
  });

  it("should handle specific session time filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/packages?sessionTime=MORNING");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.packages[0].availability?.sessionCapacity).toHaveProperty("morning");
    expect(data.data.packages[0].availability?.sessionCapacity).not.toHaveProperty("afternoon");
  });

  it("should handle invalid sessionTime parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/packages?sessionTime=INVALID");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_PARAMETERS");
  });

  it("should handle database errors gracefully", async () => {
    (mockPrisma.package.findMany as jest.MockedFunction<any>).mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest("http://localhost:3000/api/packages");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });

  it("should respect rate limiting", async () => {
    const { rateLimit } = require("@/lib/rate-limit");
    (rateLimit as jest.MockedFunction<any>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 })
    );

    const request = new NextRequest("http://localhost:3000/api/packages");
    
    const response = await GET(request);

    expect(response.status).toBe(429);
  });

  it("should handle cache hit scenario", async () => {
    const { getCachedPackageData } = require("@/lib/redis");
    (getCachedPackageData as jest.MockedFunction<any>).mockResolvedValue([
      {
        id: "pkg-1",
        type: "FREE",
        price: 0,
        currency: "thb",
        features: ["cached feature"],
        description: "cached package",
        isActive: true,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/packages");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.metadata.cacheHit).toBe(true);
    expect(data.data.packages[0].features).toEqual(["cached feature"]);
  });

  it("should handle custom exam date", async () => {
    const customDate = "2025-10-15";
    const request = new NextRequest(`http://localhost:3000/api/packages?examDate=${customDate}`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.metadata.examDate).toBe(customDate);
  });

  it("should include correct Thai pricing information", async () => {
    const request = new NextRequest("http://localhost:3000/api/packages");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const freePackage = data.data.packages.find((pkg: any) => pkg.type === "FREE");
    const advancedPackage = data.data.packages.find((pkg: any) => pkg.type === "ADVANCED");

    expect(freePackage.price).toBe(0);
    expect(freePackage.currency).toBe("thb");
    expect(advancedPackage.price).toBe(69000); // 690 THB in satangs
    expect(advancedPackage.currency).toBe("thb");
  });

  it("should handle package availability calculation errors", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockRejectedValue(
      new Error("Capacity calculation failed")
    );

    const request = new NextRequest("http://localhost:3000/api/packages");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should still return packages but with default availability
    expect(data.data.packages[0].availability?.available).toBe(true);
    expect(data.data.packages[0].availability?.message).toBe("ยังมีที่นั่งว่าง");
  });
});
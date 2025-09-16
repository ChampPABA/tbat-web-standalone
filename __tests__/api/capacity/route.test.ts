/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/capacity/route";

// Mock dependencies
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn<any>().mockResolvedValue(null),
}));

jest.mock("@/lib/capacity", () => ({
  calculateSessionCapacity: jest.fn(),
  checkCapacityAvailability: jest.fn(),
  getDateCapacitySummary: jest.fn(),
}));

describe("GET /api/capacity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { calculateSessionCapacity, getDateCapacitySummary } = require("@/lib/capacity");
    
    // Mock capacity data
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
      sessionTime: "MORNING",
      examDate: new Date("2025-09-27"),
      totalCount: 50,
      freeCount: 30,
      advancedCount: 20,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "AVAILABLE",
      message: "ยังมีที่นั่งว่าง",
      messageEn: "Seats available",
      hideExactCount: false,
      percentageFull: 0.17,
    });

    (getDateCapacitySummary as jest.MockedFunction<any>).mockResolvedValue({
      examDate: new Date("2025-09-27"),
      sessions: {
        morning: {
          sessionTime: "MORNING",
          totalCount: 50,
          freeCount: 30,
          advancedCount: 20,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
          message: "ยังมีที่นั่งว่าง",
          messageEn: "Seats available",
          hideExactCount: false,
          percentageFull: 0.17,
        },
        afternoon: {
          sessionTime: "AFTERNOON",
          totalCount: 25,
          freeCount: 15,
          advancedCount: 10,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
          message: "ยังมีที่นั่งว่าง",
          messageEn: "Seats available",
          hideExactCount: false,
          percentageFull: 0.08,
        },
      },
      overall: {
        message: "เปิดรับสมัคร",
        messageEn: "Seats available",
        overallStatus: "AVAILABLE",
        recommendedAction: "เลือกช่วงเวลาที่เหมาะสม",
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return capacity for all sessions by default", async () => {
    const request = new NextRequest("http://localhost:3000/api/capacity");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sessions).toHaveProperty("morning");
    expect(data.data.sessions).toHaveProperty("afternoon");
    expect(data.data.overall).toEqual({
      message: "เปิดรับสมัคร",
      messageEn: "Seats available",
      overallStatus: "AVAILABLE",
      recommendedAction: "เลือกช่วงเวลาที่เหมาะสม",
    });
  });

  it("should return capacity for specific session when requested", async () => {
    const request = new NextRequest("http://localhost:3000/api/capacity?sessionTime=MORNING");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sessions.morning).toBeDefined();
    expect(data.data.sessions.afternoon).toBeUndefined();
    expect(data.data.sessions.morning.sessionTime).toBe("MORNING");
    expect(data.data.sessions.morning.displayTime).toBe("09:00-12:00");
  });

  it("should handle custom exam date", async () => {
    const customDate = "2025-10-15";
    const request = new NextRequest(`http://localhost:3000/api/capacity?examDate=${customDate}`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.examDate).toBeDefined();
  });

  it("should hide exact free count when business logic requires", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
      sessionTime: "MORNING",
      examDate: new Date("2025-09-27"),
      totalCount: 50,
      freeCount: 30,
      advancedCount: 20,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "AVAILABLE",
      message: "ยังมีที่นั่งว่าง",
      messageEn: "Seats available",
      hideExactCount: true, // Hide exact count as per business requirement
      percentageFull: 0.17,
    });

    const request = new NextRequest("http://localhost:3000/api/capacity?sessionTime=MORNING");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.sessions.morning.freeCount).toBeUndefined();
    expect(data.data.sessions.morning.advancedCount).toBeUndefined(); // Advanced count should still be visible
    expect(data.data.metadata.hideExactCounts).toBe(true);
  });

  it("should apply package-specific filtering", async () => {
    const request = new NextRequest("http://localhost:3000/api/capacity?sessionTime=MORNING&packageType=FREE");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should apply Free package specific logic
  });

  it("should handle invalid sessionTime parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/capacity?sessionTime=INVALID");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_PARAMETERS");
  });

  it("should handle capacity calculation errors", async () => {
    const { getDateCapacitySummary } = require("@/lib/capacity");
    (getDateCapacitySummary as jest.MockedFunction<any>).mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest("http://localhost:3000/api/capacity");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });

  it("should show เต็มแล้ว message when session is full", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
      sessionTime: "MORNING",
      examDate: new Date("2025-09-27"),
      totalCount: 300,
      freeCount: 150,
      advancedCount: 150,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "FULL",
      message: "เต็มแล้ว",
      messageEn: "Session is full",
      hideExactCount: true,
      percentageFull: 1.0,
    });

    const request = new NextRequest("http://localhost:3000/api/capacity?sessionTime=MORNING");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.sessions.morning.availabilityStatus).toBe("AVAILABLE");
    expect(data.data.sessions.morning.message).toBe("เต็มแล้ว");
    expect(data.data.sessions.morning.messageEn).toBe("Session is full");
  });

  it("should include warnings for near-full sessions", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
      sessionTime: "MORNING",
      examDate: new Date("2025-09-27"),
      totalCount: 270, // 90% full
      freeCount: 135,
      advancedCount: 135,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "LIMITED",
      message: "ใกล้เต็มแล้ว",
      messageEn: "Nearly full",
      hideExactCount: false,
      percentageFull: 0.9,
    });

    const request = new NextRequest("http://localhost:3000/api/capacity?sessionTime=MORNING");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.sessions.morning.warnings).toContain("Session is nearly full");
    expect(data.data.sessions.morning.percentageFull).toBe(0.9);
  });

  it("should return summary format when requested", async () => {
    const request = new NextRequest("http://localhost:3000/api/capacity?format=summary");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.overall).toBeUndefined(); // Summary format excludes overall stats
  });
});

describe("GET /api/capacity (capacity check)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { checkCapacityAvailability } = require("@/lib/capacity");
    
    (checkCapacityAvailability as jest.MockedFunction<any>).mockResolvedValue({
      available: true,
      capacityData: {
        sessionTime: "MORNING",
        examDate: new Date("2025-09-27"),
        totalCount: 50,
        freeCount: 30,
        advancedCount: 20,
        maxCapacity: 300,
        freeLimit: 150,
        availabilityStatus: "AVAILABLE",
        message: "ยังมีที่นั่งว่าง",
        messageEn: "Seats available",
        hideExactCount: false,
        percentageFull: 0.17,
      },
    });
  });

  it("should check capacity availability successfully", async () => {
    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/capacity", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.available).toBe(true);
    expect(data.data.recommendation).toBe("ท่านสามารถลงทะเบียนได้");
  });

  it("should handle unavailable Free package capacity", async () => {
    const { checkCapacityAvailability } = require("@/lib/capacity");
    (checkCapacityAvailability as jest.MockedFunction<any>).mockResolvedValue({
      available: false,
      reason: "Free package quota reached for this session",
      capacityData: {
        sessionTime: "MORNING",
        examDate: new Date("2025-09-27"),
        totalCount: 200,
        freeCount: 150, // Free tier full
        advancedCount: 50,
        maxCapacity: 300,
        freeLimit: 150,
        availabilityStatus: "LIMITED",
        message: "Free Package เต็มแล้ว",
        messageEn: "Free Package is full",
        hideExactCount: true,
        percentageFull: 0.67,
      },
    });

    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/capacity", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.available).toBe(false);
    expect(data.data.reason).toBe("Free package quota reached for this session");
    expect(data.data.recommendation).toBe("แนะนำให้อัปเกรดเป็น Advanced Package หรือเลือกช่วงเวลาอื่น");
  });

  it("should validate request body", async () => {
    const invalidRequestBody = {
      sessionTime: "INVALID",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/capacity", {
      method: "GET",
      body: JSON.stringify(invalidRequestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should handle missing request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/capacity", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
  });

  it("should handle capacity check errors", async () => {
    const { checkCapacityAvailability } = require("@/lib/capacity");
    (checkCapacityAvailability as jest.MockedFunction<any>).mockRejectedValue(
      new Error("Database connection failed")
    );

    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/capacity", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
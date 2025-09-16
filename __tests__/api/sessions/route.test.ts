/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET, POST } from "../../../app/api/sessions/route";

// Mock dependencies
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => Promise.resolve(null)),
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

jest.mock("@/lib/capacity", () => ({
  calculateSessionCapacity: jest.fn(),
  getDateCapacitySummary: jest.fn(),
}));

jest.mock("@/lib/edge-config", () => ({
  getCachedSessionTemplates: jest.fn(),
}));

describe("GET /api/sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { getDateCapacitySummary, getCachedSessionTemplates } = require("@/lib/capacity");
    const { getCachedSessionTemplates: getTemplates } = require("@/lib/edge-config");
    
    // Mock session templates
    (getTemplates as jest.MockedFunction<any>).mockResolvedValue({
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
    });

    // Mock capacity summary
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
      totalCapacity: 600,
      totalOccupied: 75,
      overallAvailability: "AVAILABLE",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return all sessions with capacity information", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sessions).toHaveLength(2);
    
    const morningSession = data.data.sessions.find((s: any) => s.sessionTime === "MORNING");
    expect(morningSession).toEqual(
      expect.objectContaining({
        sessionTime: "MORNING",
        displayTime: "09:00-12:00",
        displayTimeThai: "เช้า 09:00-12:00 น.",
        duration: 180,
        description: "ช่วงเช้า - สอบเวลา 09:00 ถึง 12:00 น.",
        descriptionEn: "Morning Session - Exam from 09:00 to 12:00",
        capacity: expect.objectContaining({
          current: 50,
          maximum: 300,
          available: 250,
          percentageFull: 0.17,
          status: "AVAILABLE",
        }),
      })
    );
  });

  it("should return sessions without capacity when includeCapacity=false", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions?includeCapacity=false");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sessions[0].capacity).toBeUndefined();
  });

  it("should include conflict detection when requested", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions?includeConflicts=true");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Conflicts should be undefined for TBAT exam (no conflicts expected)
    expect(data.data.sessions[0].conflicts).toBeUndefined();
  });

  it("should handle custom exam date", async () => {
    const customDate = "2025-10-15";
    const request = new NextRequest(`http://localhost:3000/api/sessions?examDate=${customDate}`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.examDate).toBe(customDate);
    expect(data.data.examDateThai).toContain("2568"); // Buddhist year
  });

  it("should format Thai timezone correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions?examDate=2025-09-27");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const morningSession = data.data.sessions.find((s: any) => s.sessionTime === "MORNING");
    expect(morningSession.startTime).toContain("09:00:00");
    expect(morningSession.endTime).toContain("12:00:00");
  });

  it("should include summary statistics", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.summary).toEqual({
      totalSessions: 2,
      totalCapacity: 600,
      totalOccupied: 75,
      overallAvailability: "AVAILABLE",
    });
  });

  it("should hide exact free count when business logic requires", async () => {
    const { getDateCapacitySummary } = require("@/lib/capacity");
    (getDateCapacitySummary as jest.MockedFunction<any>).mockResolvedValue({
      examDate: new Date("2025-09-27"),
      sessions: {
        morning: {
          sessionTime: "MORNING",
          totalCount: 150,
          freeCount: 100,
          advancedCount: 50,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "LIMITED",
          message: "ที่นั่งเหลือน้อย",
          messageEn: "Limited seats remaining",
          hideExactCount: true, // Hide exact count
          percentageFull: 0.5,
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
      totalCapacity: 600,
      totalOccupied: 175,
      overallAvailability: "AVAILABLE",
    });

    const request = new NextRequest("http://localhost:3000/api/sessions");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const morningSession = data.data.sessions.find((s: any) => s.sessionTime === "MORNING");
    const afternoonSession = data.data.sessions.find((s: any) => s.sessionTime === "AFTERNOON");
    
    expect(morningSession.capacity.registrationCounts.free).toBeUndefined();
    expect(afternoonSession.capacity.registrationCounts.free).toBe(15); // Should be visible
  });

  it("should handle invalid parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions?timezone=INVALID");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_PARAMETERS");
  });

  it("should handle capacity calculation errors gracefully", async () => {
    const { getDateCapacitySummary } = require("@/lib/capacity");
    (getDateCapacitySummary as jest.MockedFunction<any>).mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest("http://localhost:3000/api/sessions");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });

  it("should handle caching correctly", async () => {
    const { getCachedSessionTemplates } = require("@/lib/edge-config");
    (getCachedSessionTemplates as jest.MockedFunction<any>).mockResolvedValue({
      morning: { cached: true },
      afternoon: { cached: true },
    });

    const request = new NextRequest("http://localhost:3000/api/sessions");
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.metadata.cacheHit).toBe(true);
  });
});

describe("POST /api/sessions (session validation)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
      hideExactCount: false,
      percentageFull: 0.17,
    });
  });

  it("should validate session selection successfully", async () => {
    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.valid).toBe(true);
    expect(data.data.message).toBe("เซสชันนี้ใช้งานได้");
    expect(data.data.sessionInfo).toEqual(
      expect.objectContaining({
        sessionTime: "MORNING",
        displayTime: "09:00-12:00",
        displayTimeThai: "เช้า 09:00-12:00 น.",
      })
    );
  });

  it("should detect Free package unavailability", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
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
    });

    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.valid).toBe(false);
    expect(data.data.message).toBe("Free Package เต็มแล้วสำหรับเซสชันนี้");
    expect(data.data.recommendations).toContain("พิจารณาอัปเกรดเป็น Advanced Package");
  });

  it("should detect session full condition", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
      sessionTime: "MORNING",
      examDate: new Date("2025-09-27"),
      totalCount: 300, // Session full
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

    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "ADVANCED",
    };
    
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.valid).toBe(false);
    expect(data.data.message).toBe("เซสชันนี้เต็มแล้ว");
    expect(data.data.recommendations).toContain("เลือกช่วงเวลาอื่น (เช้า/บ่าย)");
  });

  it("should validate request body", async () => {
    const invalidRequestBody = {
      sessionTime: "INVALID",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify(invalidRequestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should handle capacity calculation errors", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockRejectedValue(
      new Error("Database connection failed")
    );

    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });

  it("should provide recommendations for Advanced package when appropriate", async () => {
    const { calculateSessionCapacity } = require("@/lib/capacity");
    (calculateSessionCapacity as jest.MockedFunction<any>).mockResolvedValue({
      sessionTime: "MORNING",
      examDate: new Date("2025-09-27"),
      totalCount: 200,
      freeCount: 150, // Free tier full but Advanced available
      advancedCount: 50,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "LIMITED",
      message: "Free Package เต็มแล้ว",
      messageEn: "Free Package is full",
      hideExactCount: true,
      percentageFull: 0.67,
    });

    const requestBody = {
      sessionTime: "MORNING",
      examDate: "2025-09-27",
      packageType: "FREE",
    };
    
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.valid).toBe(false);
    expect(data.data.recommendations).toEqual([
      "พิจารณาอัปเกรดเป็น Advanced Package",
      "เลือกช่วงเวลาอื่น (เช้า/บ่าย)",
    ]);
  });
});
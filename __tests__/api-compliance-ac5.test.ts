/**
 * API Compliance Test for Story 3.1 AC5 - "No Exact Numbers" Rule
 * Validates that all capacity-related APIs comply with UI requirements
 */

import { NextRequest } from "next/server";
import { GET as capacityGET } from "../app/api/capacity/route";
import { GET as capacityStatusGET } from "../app/api/capacity/status/route";
import { GET as sessionsGET } from "../app/api/sessions/route";

// Mock the dependencies
jest.mock("../lib/mock-data", () => ({
  mockSessionCapacity: [
    {
      session_time: "09:00-12:00",
      max_capacity: 150,
      current_count: 75,
    },
    {
      session_time: "13:00-16:00",
      max_capacity: 150,
      current_count: 50,
    },
  ],
  getAvailabilityStatus: jest.fn(),
}));

jest.mock("../lib/capacity-management", () => ({
  getCapacityStatusForUI: jest.fn().mockResolvedValue({
    session_time: "MORNING",
    exam_date: "2025-09-27",
    availability_status: "AVAILABLE",
    message: "ยังมีที่นั่งว่าง",
    message_en: "Seats available",
    can_register_free: true,
    can_register_advanced: true,
    show_disabled_state: false,
  }),
  getDateCapacitySummary: jest.fn().mockResolvedValue({
    sessions: {
      morning: {
        availability_status: "AVAILABLE",
        message: "ยังมีที่นั่งว่าง",
        message_en: "Seats available",
        can_register_free: true,
        can_register_advanced: true,
        show_disabled_state: false,
      },
      afternoon: {
        availability_status: "LIMITED",
        message: "เหลือที่นั่งจำนวนจำกัด",
        message_en: "Limited seats remaining",
        can_register_free: true,
        can_register_advanced: true,
        show_disabled_state: false,
      },
    },
    overall_availability: "AVAILABLE",
  }),
}));

jest.mock("../lib/rate-limit", () => ({
  rateLimit: jest.fn().mockResolvedValue(null),
  rateLimitConfigs: {
    api: {},
  },
}));

describe("API Compliance - Story 3.1 AC5: No Exact Numbers Rule", () => {
  const forbiddenProperties = [
    "totalCount",
    "currentCount",
    "maxCapacity",
    "freeCount",
    "advancedCount",
    "freeLimit",
    "totalCapacity",
    "totalOccupied",
    "occupancyRate",
    "current_count",
    "max_capacity",
    "current_free_count",
    "current_advanced_count",
    "total_capacity",
    "free_capacity",
    "advanced_capacity",
  ];

  function validateNoExactNumbers(obj: any, path = ""): string[] {
    const violations: string[] = [];

    if (typeof obj !== "object" || obj === null) {
      return violations;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if this property violates AC5
      if (forbiddenProperties.includes(key)) {
        violations.push(`VIOLATION: ${currentPath} exposes exact numbers (value: ${value})`);
      }

      // Recursively check nested objects and arrays
      if (typeof value === "object" && value !== null) {
        violations.push(...validateNoExactNumbers(value, currentPath));
      }
    }

    return violations;
  }

  describe("/api/capacity", () => {
    it("should not expose exact capacity numbers", async () => {
      const request = new NextRequest("http://localhost:3000/api/capacity");
      const response = await capacityGET(request);
      const data = await response.json();

      const violations = validateNoExactNumbers(data);

      if (violations.length > 0) {
        console.error("AC5 Violations found:", violations);
      }

      expect(violations).toHaveLength(0);
      expect(data.data?.metadata?.hideExactCounts).toBe(true);
    });

    it("should not expose exact numbers in detailed format", async () => {
      const request = new NextRequest("http://localhost:3000/api/capacity?format=detailed");
      const response = await capacityGET(request);
      const data = await response.json();

      const violations = validateNoExactNumbers(data);

      expect(violations).toHaveLength(0);
      expect(data.data?.overall?.totalCapacity).toBeUndefined();
      expect(data.data?.overall?.totalOccupied).toBeUndefined();
      expect(data.data?.overall?.occupancyRate).toBeUndefined();
    });
  });

  describe("/api/capacity/status", () => {
    it("should comply with AC5 no-numbers rule", async () => {
      const request = new NextRequest("http://localhost:3000/api/capacity/status?sessionTime=MORNING&examDate=2025-09-27");
      const response = await capacityStatusGET(request);
      const data = await response.json();

      const violations = validateNoExactNumbers(data);
      expect(violations).toHaveLength(0);

      // Should have availability info without exact numbers
      expect(data.data).toHaveProperty("availability_status");
      expect(data.data).toHaveProperty("message");
      expect(data.data).toHaveProperty("can_register_free");
      expect(data.data).toHaveProperty("can_register_advanced");
    });
  });

  describe("/api/sessions", () => {
    it("should comply with AC5 no-numbers rule", async () => {
      const request = new NextRequest("http://localhost:3000/api/sessions?examDate=2025-09-27");
      const response = await sessionsGET(request);
      const data = await response.json();

      const violations = validateNoExactNumbers(data);
      expect(violations).toHaveLength(0);

      // Should have sessions with availability info
      expect(data.data?.sessions).toBeInstanceOf(Array);
      data.data?.sessions.forEach((session: any) => {
        expect(session.availability).toHaveProperty("status");
        expect(session.availability).toHaveProperty("message");
        expect(session.availability).toHaveProperty("canRegisterFree");
        expect(session.availability).toHaveProperty("canRegisterAdvanced");
      });
    });
  });

  describe("Allowed Properties", () => {
    it("should allow status and messaging properties", async () => {
      const allowedProperties = [
        "availabilityStatus",
        "availability_status",
        "message",
        "messageEn",
        "message_en",
        "canRegisterFree",
        "canRegisterAdvanced",
        "can_register_free",
        "can_register_advanced",
        "showDisabledState",
        "show_disabled_state",
        "availabilityLevel",
        "overallStatus",
        "displayTime",
        "sessionTime",
        "session_time",
      ];

      // These properties should be allowed and not trigger violations
      const testObject = {
        availabilityStatus: "AVAILABLE",
        message: "ยังมีที่นั่งว่าง",
        messageEn: "Seats available",
        canRegisterFree: true,
        canRegisterAdvanced: true,
        showDisabledState: false,
        availabilityLevel: "MODERATE",
      };

      const violations = validateNoExactNumbers(testObject);
      expect(violations).toHaveLength(0);
    });
  });
});
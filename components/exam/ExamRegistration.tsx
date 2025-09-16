"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SessionAvailabilityDisplay } from "@/components/ui/CapacityStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// Types based on Story 3.1 updated API responses
interface SessionData {
  sessionTime: "MORNING" | "AFTERNOON";
  displayTime: string;
  displayTimeThai: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
  descriptionEn: string;
  availability: {
    status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
    message: string;
    messageEn: string;
    canRegisterFree: boolean;
    canRegisterAdvanced: boolean;
    showDisabledState: boolean;
  };
}

interface ExamRegistrationData {
  examDate: string;
  examDateThai: string;
  sessions: SessionData[];
  overallAvailability: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
}

export interface ExamRegistrationProps {
  examDate: string;
  onRegistrationComplete?: (registrationData: {
    sessionTime: "MORNING" | "AFTERNOON";
    packageType: "FREE" | "ADVANCED";
    examCode?: string;
  }) => void;
}

/**
 * ExamRegistration Component - Story 3.1 AC1, AC4 Compliant
 * Implements capacity management with UI compliance (no exact numbers)
 * Integrates with updated exam code generation (4-character format)
 */
export function ExamRegistration({ examDate, onRegistrationComplete }: ExamRegistrationProps) {
  const [sessionData, setSessionData] = useState<ExamRegistrationData | null>(null);
  const [selectedSession, setSelectedSession] = useState<"MORNING" | "AFTERNOON" | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<"FREE" | "ADVANCED" | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions?examDate=${examDate}`);
      const result = await response.json();

      if (result.success) {
        setSessionData(result.data);
      } else {
        setError("ไม่สามารถโหลดข้อมูลเซสชันได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("Error fetching session data:", err);
    } finally {
      setLoading(false);
    }
  }, [examDate]);

  // Fetch session availability data using Story 3.1 compliant API
  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Handle session selection
  const handleSessionSelect = (sessionTime: "MORNING" | "AFTERNOON") => {
    setSelectedSession(sessionTime);
    setSelectedPackage(null); // Reset package selection when session changes
  };

  // Handle package selection with capacity validation
  const handlePackageSelect = async (packageType: "FREE" | "ADVANCED") => {
    if (!selectedSession || !sessionData) return;

    const session = sessionData.sessions.find(s => s.sessionTime === selectedSession);
    if (!session) return;

    // Check if package can register for this session (Story 3.1 AC2)
    const canRegister = packageType === "FREE"
      ? session.availability.canRegisterFree
      : session.availability.canRegisterAdvanced;

    if (!canRegister) {
      setError(
        packageType === "FREE"
          ? "Free Package เต็มแล้วสำหรับเซสชันนี้ กรุณาเลือก Advanced Package หรือเซสชันอื่น"
          : "เซสชันนี้เต็มแล้ว กรุณาเลือกเซสชันอื่น"
      );
      return;
    }

    setSelectedPackage(packageType);
    setError(null);
  };

  // Handle exam registration with capacity validation
  const handleRegister = async () => {
    if (!selectedSession || !selectedPackage || !sessionData) return;

    setRegistering(true);
    setError(null);

    try {
      // First, validate capacity is still available
      const capacityResponse = await fetch(
        `/api/capacity/check?sessionTime=${selectedSession}&examDate=${examDate}&packageType=${selectedPackage}`
      );

      const capacityResult = await capacityResponse.json();

      if (!capacityResult.success || !capacityResult.data.allowed) {
        setError(capacityResult.data.reason || "ไม่สามารถสมัครได้ในขณะนี้");
        return;
      }

      // Generate exam code using updated 4-character format (Story 3.1 AC4)
      const registrationResponse = await fetch("/api/exam/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionTime: selectedSession,
          examDate,
          packageType: selectedPackage,
        }),
      });

      const registrationResult = await registrationResponse.json();

      if (registrationResult.success) {
        // Registration successful
        onRegistrationComplete?.({
          sessionTime: selectedSession,
          packageType: selectedPackage,
          examCode: registrationResult.data.examCode,
        });
      } else {
        setError(registrationResult.error?.message || "เกิดข้อผิดพลาดในการสมัครสอบ");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("Registration error:", err);
    } finally {
      setRegistering(false);
    }
  };

  // Get selected session data
  const selectedSessionData = selectedSession
    ? sessionData?.sessions.find(s => s.sessionTime === selectedSession)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">กำลังโหลดข้อมูลเซสชัน...</span>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">ไม่สามารถโหลดข้อมูลเซสชันได้</p>
        <Button onClick={fetchSessionData} className="mt-4">
          ลองอีกครั้ง
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Date Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            การสมัครสอบ TBAT Mock Exam
          </CardTitle>
          <div className="text-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {sessionData.examDateThai}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. เลือกช่วงเวลาสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {sessionData.sessions.map((session) => (
              <SessionAvailabilityDisplay
                key={session.sessionTime}
                sessionTime={session.sessionTime}
                displayTime={session.displayTime}
                displayTimeThai={session.displayTimeThai}
                availability={session.availability}
                onSessionSelect={handleSessionSelect}
                isSelected={selectedSession === session.sessionTime}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Package Selection */}
      {selectedSession && selectedSessionData && (
        <Card>
          <CardHeader>
            <CardTitle>2. เลือกประเภทแพ็กเกจ</CardTitle>
            <p className="text-sm text-gray-600">
              เซสชันที่เลือก: {selectedSessionData.displayTimeThai}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Free Package */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPackage === "FREE"
                    ? "ring-2 ring-blue-500 border-blue-300"
                    : selectedSessionData.availability.canRegisterFree
                    ? "hover:border-blue-300"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => selectedSessionData.availability.canRegisterFree && handlePackageSelect("FREE")}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-blue-600">Free Package</h3>
                  <Badge variant="outline">ฟรี</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  <li>• สอบ 1 วิชา (เลือกได้)</li>
                  <li>• ผลคะแนนพื้นฐาน</li>
                  <li>• เข้าถึงผลสอบ 6 เดือน</li>
                </ul>
                <div className="text-xs text-gray-500">
                  {selectedSessionData.availability.canRegisterFree
                    ? "สามารถสมัครได้"
                    : "เต็มแล้วสำหรับเซสชันนี้"
                  }
                </div>
              </div>

              {/* Advanced Package */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPackage === "ADVANCED"
                    ? "ring-2 ring-purple-500 border-purple-300"
                    : selectedSessionData.availability.canRegisterAdvanced
                    ? "hover:border-purple-300"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => selectedSessionData.availability.canRegisterAdvanced && handlePackageSelect("ADVANCED")}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-purple-600">Advanced Package</h3>
                  <Badge variant="outline">฿690</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  <li>• สอบครบทั้ง 3 วิชา</li>
                  <li>• วิเคราะห์ผลแบบละเอียด</li>
                  <li>• เปรียบเทียบผลคะแนน</li>
                  <li>• ดาวน์โหลดเฉลย PDF</li>
                </ul>
                <div className="text-xs text-gray-500">
                  {selectedSessionData.availability.canRegisterAdvanced
                    ? "สามารถสมัครได้"
                    : "เซสชันเต็มแล้ว"
                  }
                </div>
              </div>
            </div>

            {/* Package selection guidance */}
            {!selectedSessionData.availability.canRegisterFree && selectedSessionData.availability.canRegisterAdvanced && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Free Package เต็มแล้วสำหรับเซสชันนี้ แนะนำให้อัปเกรดเป็น Advanced Package หรือเลือกเซสชันอื่น
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Registration Button */}
      {selectedSession && selectedPackage && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button
                onClick={handleRegister}
                disabled={registering}
                size="lg"
                className="px-8"
              >
                {registering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {registering ? "กำลังดำเนินการ..." : "ยืนยันการสมัครสอบ"}
              </Button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              เซสชัน: {selectedSessionData?.displayTimeThai} |
              แพ็กเกจ: {selectedPackage === "FREE" ? "Free Package" : "Advanced Package"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
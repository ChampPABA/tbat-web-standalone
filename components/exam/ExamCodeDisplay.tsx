"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyIcon as Copy, CheckIcon as Check, QrCodeIcon as QrCode } from "@/components/icons/dynamic-icons";
import QRCodeLib from "qrcode";

export interface ExamCodeDisplayProps {
  examCode: string;
  packageType: "FREE" | "ADVANCED";
  subject?: "BIOLOGY" | "CHEMISTRY" | "PHYSICS";
  sessionTime: "MORNING" | "AFTERNOON";
  examDate: string;
  generatedAt: string;
  isUsed?: boolean;
  className?: string;
}

/**
 * ExamCodeDisplay Component - Story 3.1 AC4 Compliant
 * Displays exam codes in the new 4-character format:
 * - FREE-XXXX-SUBJECT (e.g., FREE-A1B2-BIOLOGY)
 * - ADV-XXXX (e.g., ADV-C3D4)
 */
export function ExamCodeDisplay({
  examCode,
  packageType,
  subject,
  sessionTime,
  examDate,
  generatedAt,
  isUsed = false,
  className,
}: ExamCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Copy exam code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy exam code:", err);
    }
  };

  // Generate QR code
  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        examCode,
        packageType,
        subject,
        sessionTime,
        examDate,
        generatedAt,
      });

      const dataUrl = await QRCodeLib.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    }
  };

  // Parse exam code components (Story 3.1 format validation)
  const parseExamCode = (code: string) => {
    if (code.startsWith("FREE-")) {
      const parts = code.split("-");
      if (parts.length === 3) {
        return {
          prefix: "FREE",
          randomPart: parts[1], // 4-character random part
          subject: parts[2],
        };
      }
    } else if (code.startsWith("ADV-")) {
      const parts = code.split("-");
      if (parts.length === 2) {
        return {
          prefix: "ADV",
          randomPart: parts[1], // 4-character random part
          subject: undefined,
        };
      }
    }
    return null;
  };

  const codeComponents = parseExamCode(examCode);

  // Format display date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    };
    return date.toLocaleDateString("th-TH", options);
  };

  // Get session display text
  const getSessionDisplay = (session: "MORNING" | "AFTERNOON") => {
    return session === "MORNING" ? "เช้า 09:00-12:00 น." : "บ่าย 13:00-16:00 น.";
  };

  // Get subject display text
  const getSubjectDisplay = (subj: string) => {
    const subjects: Record<string, string> = {
      BIOLOGY: "ชีววิทยา",
      CHEMISTRY: "เคมี",
      PHYSICS: "ฟิสิกส์",
    };
    return subjects[subj] || subj;
  };

  return (
    <div className={className}>
      <Card className={`${isUsed ? "opacity-75" : ""} transition-all`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            รหัสสอบ TBAT Mock Exam
          </CardTitle>
          {isUsed && (
            <Badge variant="secondary" className="mx-auto">
              ใช้แล้ว
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Code Display */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                <div className="font-mono text-3xl font-bold text-gray-900 tracking-wider">
                  {examCode}
                </div>
                {codeComponents && (
                  <div className="flex justify-center items-center gap-2 mt-2 text-sm text-gray-600">
                    <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                      {codeComponents.prefix}
                    </span>
                    <span className="bg-green-100 px-2 py-1 rounded text-green-800 font-mono">
                      {codeComponents.randomPart}
                    </span>
                    {codeComponents.subject && (
                      <span className="bg-purple-100 px-2 py-1 rounded text-purple-800">
                        {codeComponents.subject}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Copy Button */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกรหัส"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateQRCode}
                  className="flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </Button>
              </div>
            </div>
          </div>

          {/* Exam Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">ประเภทแพ็กเกจ</label>
                <div className="mt-1">
                  <Badge variant={packageType === "FREE" ? "default" : "secondary"} className="text-sm">
                    {packageType === "FREE" ? "Free Package" : "Advanced Package"}
                  </Badge>
                </div>
              </div>

              {subject && (
                <div>
                  <label className="text-sm font-medium text-gray-500">วิชาที่สอบ</label>
                  <div className="mt-1 font-medium">
                    {getSubjectDisplay(subject)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">วันที่สอบ</label>
                <div className="mt-1 font-medium">
                  {formatDate(examDate)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">เวลาสอบ</label>
                <div className="mt-1 font-medium">
                  {getSessionDisplay(sessionTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Code Format Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">รูปแบบรหัสสอบใหม่</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Free Package: <code className="bg-blue-100 px-1 rounded">FREE-XXXX-วิชา</code> (4 ตัวอักษร)</p>
              <p>• Advanced Package: <code className="bg-blue-100 px-1 rounded">ADV-XXXX</code> (4 ตัวอักษร)</p>
              <p className="text-xs">XXXX = ตัวอักษรภาษาอังกฤษตัวพิมพ์ใหญ่และตัวเลข 4 หลัก</p>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">วิธีใช้รหัสสอบ</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>1. กรอกรหัสสอบนี้ในหน้าเข้าสอบ</p>
              <p>2. ตรวจสอบเวลาสอบให้ถูกต้อง</p>
              <p>3. เก็บรหัสนี้ไว้จนกว่าจะสอบเสร็จ</p>
              {packageType === "ADVANCED" && (
                <p>4. ใช้รหัสเดียวกันสำหรับทุกวิชา</p>
              )}
            </div>
          </div>

          {/* Generation Timestamp */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            สร้างเมื่อ: {new Date(generatedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQR && qrDataUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="font-semibold mb-4">QR Code รหัสสอบ</h3>
              <Image src={qrDataUrl} alt="QR Code" className="mx-auto mb-4" width={200} height={200} />
              <p className="text-sm text-gray-600 mb-4">
                สแกนเพื่อดูข้อมูลรหัสสอบ
              </p>
              <Button onClick={() => setShowQR(false)} size="sm">
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
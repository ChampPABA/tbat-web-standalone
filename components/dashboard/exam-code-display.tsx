"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Hash } from 'lucide-react';

interface ExamCode {
  code: string;
  packageType: "FREE" | "ADVANCED";
  subject: "BIOLOGY" | "CHEMISTRY" | "PHYSICS" | null;
  sessionTime: "09:00-12:00" | "13:00-16:00";
  createdAt: Date;
  usedAt: Date | null;
}

interface ExamCodeDisplayProps {
  examCode: ExamCode;
}

export default function ExamCodeDisplay({ examCode }: ExamCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getSubjectLabel = (subject: "BIOLOGY" | "CHEMISTRY" | "PHYSICS" | null) => {
    if (!subject) return "ทุกวิชา";

    const subjectMap = {
      BIOLOGY: "ชีววิทยา",
      CHEMISTRY: "เคมี",
      PHYSICS: "ฟิสิกส์"
    };
    return subjectMap[subject];
  };

  const getSessionTimeLabel = (sessionTime: "09:00-12:00" | "13:00-16:00") => {
    return sessionTime === "09:00-12:00" ? "เช้า 09:00-12:00" : "บ่าย 13:00-16:00";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          รหัสสอบของคุณ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-tbat-primary mb-2">
              {examCode.code}
            </div>
            <div className="flex justify-center gap-2 mb-3">
              <Badge variant="outline">
                {getSubjectLabel(examCode.subject)}
              </Badge>
              <Badge variant="outline">
                {getSessionTimeLabel(examCode.sessionTime)}
              </Badge>
            </div>
            <Button
              onClick={handleCopy}
              className="bg-tbat-primary hover:bg-tbat-secondary"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  คัดลอกรหัสสอบ
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>⚠️ กรุณาเก็บรหัสสอบนี้ไว้ให้ดี คุณจะต้องใช้รหัสนี้ในการเข้าสอบ</p>
        </div>
      </CardContent>
    </Card>
  );
}
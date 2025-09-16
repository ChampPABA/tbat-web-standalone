"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface ExamCode {
  sessionTime: "09:00-12:00" | "13:00-16:00";
}

interface ExamInfoPanelProps {
  examCode: ExamCode;
}

export default function ExamInfoPanel({ examCode }: ExamInfoPanelProps) {
  const getSessionTimeLabel = (sessionTime: "09:00-12:00" | "13:00-16:00") => {
    return sessionTime === "09:00-12:00" ? "เช้า 09:00-12:00" : "บ่าย 13:00-16:00";
  };

  const examDate = "27 กันยายน 2568";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          ข้อมูลการสอบ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-tbat-primary/5 border border-tbat-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-tbat-primary" />
              <span className="text-sm font-medium text-gray-700">วันที่สอบ</span>
            </div>
            <Badge variant="secondary" className="bg-tbat-primary/10 text-tbat-primary border-tbat-primary/30">
              {examDate}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-tbat-secondary/5 border border-tbat-secondary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-tbat-secondary" />
              <span className="text-sm font-medium text-gray-700">เวลาสอบ</span>
            </div>
            <Badge variant="secondary" className="bg-tbat-secondary/10 text-tbat-secondary border-tbat-secondary/30">
              {getSessionTimeLabel(examCode.sessionTime)}
            </Badge>
          </div>

          <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">สถานที่สอบ</span>
            </div>
            <div className="text-sm text-gray-800">
              <p className="font-medium">สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่</p>
              <p className="text-gray-600 text-xs mt-1">ห้องทองกวาว 1 และห้องทองกวาว 2</p>
              <a
                href="https://maps.app.goo.gl/6crQRkv2eZzPwoXP8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-tbat-primary text-xs hover:underline mt-1"
              >
                ดูแผนที่ Google Maps
              </a>
            </div>
          </div>
        </div>

        <div className="bg-tbat-primary/5 border border-tbat-primary/20 rounded-lg p-3">
          <p className="text-sm text-tbat-primary">
            💡 <strong>หมายเหตุ:</strong> กรุณามาถึงก่อนเวลาสอบ 45 นาที
            เพื่อเช็คอิน รับเอกสาร และเตรียมตัว
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import React from 'react';

interface User {
  thaiName: string;
  nationalId: string;
  phone: string;
  school: string;
  packageType: "FREE" | "ADVANCED";
}

interface ExamCode {
  code: string;
  subject: "BIOLOGY" | "CHEMISTRY" | "PHYSICS" | null;
  sessionTime: "09:00-12:00" | "13:00-16:00";
}

interface PrintRegistrationProps {
  user: User;
  examCode: ExamCode;
}

export default function PrintRegistration({ user, examCode }: PrintRegistrationProps) {
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

  const getPackageLabel = (packageType: "FREE" | "ADVANCED") => {
    return packageType === "FREE" ? "Free" : "Advanced";
  };

  return (
    <div className="print-content bg-white p-4 max-w-none mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-tbat-primary pb-3">
        <h1 className="text-2xl font-bold text-tbat-primary mb-1">TBAT Mock Exam</h1>
        <h2 className="text-lg text-gray-700">ใบสรุปการลงทะเบียนสอบ</h2>
        <p className="text-xs text-gray-600 mt-1">
          พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
        </p>
      </div>

      {/* รหัสสอบ - เด่นที่สุด */}
      <div className="border-2 border-tbat-primary bg-tbat-primary/5 p-4 rounded-lg mb-6 text-center">
        <h3 className="text-base font-bold text-tbat-primary mb-2">รหัสสอบ</h3>
        <div className="text-3xl font-mono font-bold text-tbat-primary mb-2 tracking-wider">
          {examCode.code}
        </div>
        <p className="text-xs text-gray-600">⚠️ กรุณานำรหัสนี้มาในวันสอบ</p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* ข้อมูลผู้สอบ */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className="text-base font-bold text-tbat-primary mb-3 border-b border-gray-200 pb-1">
            ข้อมูลผู้สอบ
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">ชื่อ-นามสกุล:</span>
              <span className="text-right">{user.thaiName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">เลขประจำตัวประชาชน:</span>
              <span className="font-mono text-right">{user.nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">โทรศัพท์:</span>
              <span className="text-right">{user.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">โรงเรียน:</span>
              <span className="text-right">{user.school}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">แพ็กเกจ:</span>
              <span className="font-bold text-tbat-primary text-right">{getPackageLabel(user.packageType)}</span>
            </div>
          </div>
        </div>

        {/* ข้อมูลการสอบ */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className="text-base font-bold text-tbat-primary mb-3 border-b border-gray-200 pb-1">
            ข้อมูลการสอบ
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">วันสอบ:</span>
              <span className="text-right">27 กันยายน 2568</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">เวลาสอบ:</span>
              <span className="text-right">{getSessionTimeLabel(examCode.sessionTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">วิชา:</span>
              <span className="text-right">{getSubjectLabel(examCode.subject)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* สถานที่สอบ */}
      <div className="border border-gray-300 p-4 rounded-lg mb-6">
        <h3 className="text-base font-bold text-tbat-primary mb-3 border-b border-gray-200 pb-1">
          สถานที่สอบ
        </h3>
        <div className="space-y-1 text-sm">
          <p className="font-medium">สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่</p>
          <p className="text-gray-700">ห้องทองกวาว 1 และห้องทองกวาว 2</p>
          <p className="text-xs text-gray-600">Google Maps: https://maps.app.goo.gl/6crQRkv2eZzPwoXP8</p>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              💡 <strong>หมายเหตุ:</strong> กรุณามาถึงก่อนเวลาสอบ 45 นาที เพื่อเช็คอิน รับเอกสาร และเตรียมตัว
            </p>
          </div>
        </div>
      </div>

      {/* สิ่งที่ต้องนำมา */}
      <div className="border border-gray-300 p-4 rounded-lg mb-4">
        <h3 className="text-base font-bold text-tbat-primary mb-3 border-b border-gray-200 pb-1">
          สิ่งที่ต้องนำมา
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ul className="space-y-1 text-gray-700">
            <li>• บัตรประจำตัวประชาชน</li>
            <li>• ดินสอ 2B และยางลบ</li>
          </ul>
          <ul className="space-y-1 text-gray-700">
            <li>• เครื่องคิดเลข (สำคัญ)</li>
            <li>• น้ำดื่ม</li>
          </ul>
        </div>
        <p className="text-xs text-red-600 mt-2">⚠️ ห้ามใช้มือถือในห้องสอบ</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3">
        <p>หากมีข้อสงสัย กรุณาติดต่อ: info@tbat-mock.com | TBAT Mock Exam Platform - Chiang Mai</p>
      </div>
    </div>
  );
}
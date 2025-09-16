"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
// Inline SVG icon to reduce bundle size
const CheckCircleIcon = () => (
  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";

const Image = dynamic(() => import("next/image"), {
  loading: () => <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-lg" />
});

interface RegistrationData {
  examCode: string;
  userEmail: string;
  packageType: string;
  sessionTime: string;
}

function EmailConfirmationContent() {
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');
  const isMockMode = searchParams.get('mock') === 'true';
  const examCodeParam = searchParams.get('exam_code');

  useEffect(() => {
    // Use exam code from URL parameter if available
    const examCode = examCodeParam || (isMockMode ? 'ADV-MOCK-TEST' : 'ADV-X9K2');

    setRegistrationData({
      examCode: examCode,
      userEmail: isMockMode ? 'mock@example.com' : 'user@example.com',
      packageType: 'ADVANCED',
      sessionTime: isMockMode ? 'ช่วงเช้า 09:00-12:00' : '09:00-12:00'
    });
    setLoading(false);
  }, [sessionId, isMockMode, examCodeParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center font-prompt">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">กำลังเตรียมข้อมูล</h1>
          <p className="text-gray-600">กรุณารอสักครู่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white font-prompt">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-tbat-bg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-tbat-primary to-tbat-secondary rounded-lg flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="text-xl font-semibold text-tbat-primary">Mock TBAT</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Icon */}
          <div className="text-center py-8 sm:py-12 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
              <CheckCircleIcon />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {registrationData?.packageType === 'ADVANCED' ? 'ชำระเงินสำเร็จ!' : 'ลงทะเบียนสำเร็จ!'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {registrationData?.packageType === 'ADVANCED'
                ? 'ขอบคุณที่เลือกใช้บริการ TBAT Mock Exam Advanced Package - รหัสสอบของคุณคือ'
                : 'รหัสสอบของคุณคือ'
              }
            </p>

            {/* Exam Code Display */}
            {registrationData && (
              <div className="text-2xl sm:text-3xl font-mono font-bold text-tbat-primary mb-6 animate-pulse">
                {registrationData.examCode}
              </div>
            )}

            {/* Payment Summary for Advanced Package */}
            {registrationData?.packageType === 'ADVANCED' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-4 text-center">สรุปการชำระเงิน</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">แพ็กเกจ:</span>
                    <span className="font-semibold">Advanced Package</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">จำนวนเงิน:</span>
                    <span className="font-semibold text-tbat-primary">฿690</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">สถานะ:</span>
                    <span className="font-semibold text-green-600">ชำระเงินสำเร็จ ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วิชาที่สอบได้:</span>
                    <span className="font-semibold">ทั้ง 3 วิชา (Biology, Chemistry, Physics)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">เวลาสอบ:</span>
                    <span className="font-semibold">{registrationData.sessionTime}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray-600 mb-4 px-4">
              เราได้ส่งรหัสสอบและรายละเอียดไปยังอีเมลของคุณ<br />
              กรุณาเก็บรหัสนี้ไว้สำหรับเข้าสอบในวันที่ 27 กันยายน 2568
            </p>


            {/* LINE Official Account - Same as FREE package */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">📢 ขั้นตอนสำคัญ!</h3>
                <p className="text-sm text-gray-700 mb-4">
                  <strong>บังคับ Add Line Official Account</strong><br/>
                  เพื่อรับข่าวสารและการแจ้งเตือนที่รวดเร็ว
                </p>
                <div className="flex justify-center mb-4">
                  <div className="w-48 h-48 border-2 border-gray-200 rounded-lg shadow-sm bg-white flex items-center justify-center">
                    <Image
                      src="/line_QR.jpg"
                      alt="Line QR Code สำหรับ @mockexam.official"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Scan QR Code
                </p>
              </div>
            </div>

            {/* Action Buttons - Same as FREE package */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/" className="px-6 py-3 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-all text-center">
                กลับหน้าแรก
              </Link>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                พิมพ์บัตรสอบ
              </Button>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center text-xs sm:text-sm text-gray-600">
          <p>
            หากมีปัญหาในการลงทะเบียน ติดต่อ Line: @aimmed.official | โทร: 099-378-8111
          </p>
        </div>
      </main>
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center font-prompt">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">กำลังโหลด...</h1>
          <p className="text-gray-600">กรุณารอสักครู่...</p>
        </div>
      </div>
    }>
      <EmailConfirmationContent />
    </Suspense>
  );
}
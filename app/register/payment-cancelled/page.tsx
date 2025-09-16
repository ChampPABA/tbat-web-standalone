"use client";

import { Button } from "@/components/ui/button";
// Inline SVG icons to reduce bundle size
const ArrowLeftIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const CreditCardIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const HelpCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center font-prompt">
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            การชำระเงินถูกยกเลิก
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            คุณได้ยกเลิกการชำระเงินสำหรับแพ็กเกจขั้นสูง ข้อมูลการสมัครของคุณยังไม่ได้รับการบันทึก
          </p>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">💡 ต้องการความช่วยเหลือ?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• ตรวจสอบข้อมูลบัตรเครดิต/เดบิต</li>
              <li>• ใช้บัตรที่รองรับการชำระเงินออนไลน์</li>
              <li>• ตรวจสอบยอดเงินในบัตร</li>
              <li>• ลองใช้วิธีการชำระเงินอื่น</li>
            </ul>
          </div>

          {/* Common Payment Issues */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">🔧 ปัญหาที่พบบ่อย</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <strong>บัตรถูกปฏิเสธ:</strong>
                <span className="ml-2">ติดต่อธนาคารเพื่อยืนยันการทำธุรกรรมออนไลน์</span>
              </div>
              <div>
                <strong>ข้อมูลไม่ถูกต้อง:</strong>
                <span className="ml-2">ตรวจสอบชื่อ, หมายเลขบัตร, วันหมดอายุ และ CVV</span>
              </div>
              <div>
                <strong>เครือข่ายไม่เสถียร:</strong>
                <span className="ml-2">ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button asChild className="flex-1">
              <Link href="/register">
                <CreditCardIcon />
                ลองชำระเงินอีกครั้ง
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                <ArrowLeftIcon />
                กลับหน้าหลัก
              </Link>
            </Button>
          </div>

          {/* Support Information */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-center gap-2 text-tbat-primary mb-2">
              <HelpCircleIcon />
              <span className="font-semibold">ต้องการความช่วยเหลือ?</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              ทีมสนับสนุนลูกค้าพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง
            </p>
            <div className="flex flex-col sm:flex-row gap-2 text-sm">
              <div className="flex-1">
                📧 support@tbat-exam.com
              </div>
              <div className="flex-1">
                📞 02-XXX-XXXX
              </div>
            </div>
          </div>

          {/* Note about data */}
          <p className="text-xs text-gray-500 mt-6">
            หมายเหตุ: ข้อมูลส่วนตัวที่คุณกรอกในแบบฟอร์มสมัครยังคงปลอดภัย
            และจะไม่ถูกบันทึกจนกว่าการชำระเงินจะสำเร็จ
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from 'next/link';
import SiteNavigation from '@/components/shared/site-navigation';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">ติดต่อเรา</h1>
            <p className="text-xl text-gray-600">สนามสอบ TBAT จำลองที่เชียงใหม่ จัดโดย ASPECT</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">📞</span>
                ช่องทางการติดต่อ
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Line Official</h3>
                    <p className="text-tbat-primary font-semibold">@aimmed.official</p>
                    <p className="text-sm text-gray-600">แชทได้ 24/7 ตอบเร็วที่สุด</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                  <span className="text-2xl">📞</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">โทรศัพท์</h3>
                    <p className="text-tbat-primary font-semibold">099-378-8111</p>
                    <p className="text-sm text-gray-600">เวลาทำการ 09:00-18:00 น.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">อีเมล</h3>
                    <p className="text-tbat-primary font-semibold">aspect.educationcenter@gmail.com</p>
                    <p className="text-sm text-gray-600">สำหรับข้อมูลทั่วไป</p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">ติดตามเราได้ที่</h3>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.facebook.com/share/1FLoMmDNM7/?mibextid=wwXIfr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.instagram.com/aimmed.official?igsh=MTZleno2bzByOWp4MA==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.tiktok.com/@aspectcareer?_t=ZS-8zYQMkfqA91&_r=1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                    aria-label="TikTok"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Exam Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">📋</span>
                ข้อมูลการสอบ
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-tbat-bg rounded-lg">
                  <h3 className="font-semibold text-tbat-primary mb-2">📅 วันที่สอบ</h3>
                  <p className="text-gray-800 font-semibold">วันเสาร์ที่ 27 กันยายน 2568</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">⏰ เวลาสอบ</h3>
                  <div className="space-y-1">
                    <p className="text-gray-800">รอบเช้า: 09:00-12:00 น.</p>
                    <p className="text-gray-800">รอบบ่าย: 13:00-16:00 น.</p>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">🎯 จำนวนผู้สอบ</h3>
                  <p className="text-gray-800">จำกัดรอบละไม่เกิน 300 ท่าน</p>
                  <p className="text-sm text-gray-600">(รวม 2 รอบ = 600 ท่าน)</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">💰 ราคา</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg text-gray-500 line-through">฿990</span>
                    <span className="text-2xl font-bold text-green-600">฿690</span>
                  </div>
                  <p className="text-sm text-gray-600">ประหยัด ฿300 (เฉพาะ 3 วันแรก)</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">🏢 จัดโดย</h3>
                <div className="text-center">
                  <div className="mb-1">
                    <p className="text-lg font-semibold text-tbat-primary">ASPECT Education Center</p>
                    <p className="text-gray-600">ผู้จัด Dentorium Camp และสนามสอบ Mock Exam</p>
                  </div>

                  {/* AimMed Logo */}
                  <div className="flex justify-center">
                    <img
                      src="https://img2.pic.in.th/pic/logo--PNG.md.png"
                      alt="AimMed"
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <p className="text-gray-500 mt-1">เชียงใหม่, ประเทศไทย</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-tbat-primary to-tbat-secondary rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">พร้อมสมัครแล้วหรือยัง?</h2>
              <p className="text-lg mb-6">สมัครตอนนี้เพื่อรับส่วนลดพิเศษ!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register"
                  className="px-8 py-3 bg-white text-tbat-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  สมัครเลย
                </Link>
                <Link 
                  href="/"
                  className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-tbat-primary transition-colors"
                >
                  ดูข้อมูลเพิ่มเติม
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

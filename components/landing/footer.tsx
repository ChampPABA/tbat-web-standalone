'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-tbat-accent mb-4">TBAT Mock Exam</h3>
            <p className="text-gray-400 mb-4">สนามสอบจำลอง TBAT ที่เชียงใหม่<br />จัดโดย ASPECT</p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/aimmed.official?igsh=MTZleno2bzByOWp4MA==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-tbat-accent transition-colors duration-200" 
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
                className="text-gray-400 hover:text-tbat-accent transition-colors duration-200" 
                aria-label="TikTok"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/share/1FLoMmDNM7/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-tbat-accent transition-colors duration-200" 
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">ข้อมูลการติดต่อ</h4>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center text-xs lg:text-sm">
                <span className="mr-2">📧</span>
                <span className="whitespace-nowrap">aspect.educationcenter@gmail.com</span>
              </div>
              <div className="flex items-center text-xs lg:text-sm">
                <span className="mr-2">📱</span>
                <span>Line: @aimmed.official</span>
              </div>
              <div className="flex items-center text-xs lg:text-sm">
                <span className="mr-2">📞</span>
                <span>โทร: 099-378-8111</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">ลิงก์สำคัญ</h4>
            <div className="space-y-2">
              <a href="#details" className="block text-gray-400 hover:text-tbat-accent transition-colors duration-200">รายละเอียดการสอบ</a>
              <a href="#pricing" className="block text-gray-400 hover:text-tbat-accent transition-colors duration-200">แพ็กเกจ</a>
              <a href="#faq" className="block text-gray-400 hover:text-tbat-accent transition-colors duration-200">คำถามที่พบบ่อย</a>
              <Link href="/contact" className="block text-gray-400 hover:text-tbat-accent transition-colors duration-200">ติดต่อเรา</Link>
              <a href="#" className="block text-gray-400 hover:text-tbat-accent transition-colors duration-200">นโยบายความเป็นส่วนตัว</a>
              <a href="#" className="block text-gray-400 hover:text-tbat-accent transition-colors duration-200">เงื่อนไขการใช้งาน</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">ข้อมูลสำคัญ</h4>
            <div className="space-y-2 text-gray-400">
              <p>🗓️ วันสอบ: วันเสาร์ที่ 27 กันยายน 2568</p>
              <p>⏰ เวลา: 09:00-12:00 / 13:00-16:00</p>
              <p>🎯 จำกัด: รอบละไม่เกิน 300 ท่าน</p>
              <p>💰 ราคา: จาก ฿990 เหลือ ฿690</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col items-center">
            {/* AimMed Logo */}
            <div className="flex justify-center mb-1">
              <img
                src="https://img2.pic.in.th/pic/logo--PNG.md.png"
                alt="AimMed"
                className="h-32 w-32 object-contain"
              />
            </div>
            <div className="text-center text-gray-400">
              <p>&copy; 2568 TBAT Mock Exam by ASPECT. All rights reserved.</p>
              <p className="mt-2">จัดโดย <span className="text-tbat-accent font-medium">ASPECT</span> - ผู้จัด Dentorium Camp และสนามสอบ Mock Exam</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
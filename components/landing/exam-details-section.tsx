'use client';

import React from 'react';

interface ExamSchedule {
  session: string;
  time: string;
  checkIn: string;
}

interface PrepItem {
  id: number;
  item: string;
}

interface ExamDetailsSectionProps {
  subjects?: string[];
  schedules?: ExamSchedule[];
  prepItems?: PrepItem[];
}

const defaultSubjects = [
  "ชีววิทยา (Biology)",
  "เคมี (Chemistry)", 
  "ฟิสิกส์ (Physics)"
];

const defaultSchedules: ExamSchedule[] = [
  {
    session: "รอบเช้า",
    time: "09:00 - 12:00 น.",
    checkIn: "(เช็คอิน 08:15)"
  },
  {
    session: "รอบบ่าย", 
    time: "13:00 - 16:00 น.",
    checkIn: "(เช็คอิน 12:15)"
  }
];

const defaultPrepItems: PrepItem[] = [
  { id: 1, item: "บัตรประชาชน หรือเอกสารที่ทางราชการออกให้และมีเลขประจำตัวประชาชน" },
  { id: 2, item: "ดินสอ 2B และยางลบ" },
  { id: 3, item: "เครื่องคิดเลข (สำคัญ)" },
  { id: 4, item: "น้ำดื่ม" }
];

const ExamDetailsSection: React.FC<ExamDetailsSectionProps> = ({
  subjects = defaultSubjects,
  schedules = defaultSchedules,
  prepItems = defaultPrepItems
}) => {
  return (
    <section className="bg-white py-12 md:py-16" id="details">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          รายละเอียดการสอบ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* วิชาที่สอบ */}
          <div className="text-center">
            <div className="w-20 h-20 bg-tbat-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white">📋</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">วิชาที่สอบ</h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              {subjects.map((subject, index) => (
                <li key={index}>{subject}</li>
              ))}
            </ul>
            <p className="text-xs text-orange-800 mt-2">Free: 1 วิชา | Advanced: 3 วิชา</p>
          </div>

          {/* เวลาสอบ */}
          <div className="text-center">
            <div className="w-20 h-20 bg-tbat-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white">⏱️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">เวลาสอบ</h3>
            <div className="text-gray-600 space-y-1 text-sm">
              {schedules.map((schedule, index) => (
                <p key={index}>
                  <strong>{schedule.session}</strong><br />
                  {schedule.time} {schedule.checkIn}
                </p>
              ))}
            </div>
            <p className="text-xs text-red-600 mt-2">รอบละไม่เกิน 300 ท่าน</p>
          </div>

          {/* สถานที่ */}
          <div className="text-center">
            <div className="w-20 h-20 bg-tbat-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white">📍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">สถานที่</h3>
            <div className="text-gray-600 text-sm">
              <p className="font-medium">สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่</p>
              <p className="text-xs mt-1">ห้องทองกวาว 1 และห้องทองกวาว 2</p>
              <a 
                href="https://maps.app.goo.gl/6crQRkv2eZzPwoXP8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-tbat-primary text-xs hover:underline mt-1"
              >
                ดูแผนที่ Google Maps
              </a>
              <div className="mt-2 space-y-1">
                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                  🚗 ที่จอดรถฟรีภายใน มช.
                </span>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                  🏭 ห้องปรับอากาศ สะดวกสบาย
                </span>
              </div>
              <p className="text-xs text-orange-800 mt-2 font-semibold">
                💡 แนะนำ: มาถึงก่อนเวลาสอบ 45 นาที<br />
                เพื่อเช็คอิน รับเอกสาร และเตรียมตัว
              </p>
            </div>
          </div>

          {/* สิ่งที่ต้องเตรียม */}
          <div className="text-center">
            <div className="w-20 h-20 bg-tbat-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">สิ่งที่ต้องเตรียม</h3>
            <ul className="text-gray-600 space-y-1 text-sm text-left">
              {prepItems.map((prep) => (
                <li key={prep.id}>• {prep.item}</li>
              ))}
            </ul>
            <p className="text-xs text-red-600 mt-2">⚠️ ห้ามใช้มือถือ</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamDetailsSection;
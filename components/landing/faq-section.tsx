'use client';

import React, { useState } from 'react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon: string;
}

const defaultFAQs: FAQItem[] = [
  {
    id: 1,
    question: "📍 จัดที่ไหน?",
    answer: "สำนักบริการวิชาการ ม.เชียงใหม่ ห้องทองกวาว 1 และ 2\nมีที่จอดรถฟรีภายใน มช.",
    icon: "📍"
  },
  {
    id: 2,
    question: "💰 ค่าใช้จ่ายเท่าไหร่?",
    answer: "Free Package: ฟรี (เลือกสอบ 1 วิชา)\nAdvanced Package: ฿690 (ครบ 3 วิชา + การวิเคราะห์แบบละเอียด + PDF เฉลย)",
    icon: "💰"
  },
  {
    id: 3,
    question: "📚 สอบกี่วิชา?",
    answer: "สอบทั้งหมด 3 วิชา ได้แก่ ชีววิทยา เคมี ฟิสิกส์\nFree Package: เลือกได้ 1 วิชา\nAdvanced Package: ครบทั้ง 3 วิชา",
    icon: "📚"
  },
  {
    id: 4,
    question: "🆓 Free Package มีกี่ที่?",
    answer: "จำกัดไม่เกิน 300 ที่ทั้งวัน (ไม่เกิน 150 ที่/รอบ)\nเมื่อเต็มจะเหลือเฉพาะ Advanced Package",
    icon: "🆓"
  },
  {
    id: 5,
    question: "📊 จะได้ผลสอบเมื่อไหร่?",
    answer: "ได้ผลสอบภายใน 48 ชั่วโมงหลังจากสอบเสร็จ Advanced Package จะได้การวิเคราะห์แบบละเอียดและ PDF เฉลยพร้อมกัน",
    icon: "📊"
  },
  {
    id: 6,
    question: "🏭 ห้องสอบรองรับได้กี่คน?",
    answer: "ห้องทองกวาว 1 และ 2 รองรับได้ไม่เกิน 300 คน/รอบ\nห้องปรับอากาศ สะดวกสบาย",
    icon: "🏭"
  },
  {
    id: 7,
    question: "👨‍⚕️ ทีมตรวจข้อสอบเป็นใคร?",
    answer: "นักเรียนแพทย์และอดีตนักเรียนโอลิมปิกวิชาการ\nที่มีประสบการณ์สอบ TBAT จริง ไม่ใช่ทีมออกข้อสอบ\nแต่เป็นผู้ตรวจสอบความถูกต้องและระดับความยาก",
    icon: "👨‍⚕️"
  },
  {
    id: 8,
    question: "🎨 Dentorium Camp คืออะไร?",
    answer: "ค่ายค้นหาตัวเองเพื่อให้นักเรียนได้ทดลองและค้นพบ\nว่าเหมาะกับการเรียนทันตแพทย์หรือไม่\nจัดโดย ASPECT ครั้งแรกเมื่อ ก.ค. 2568 ที่คณะทันตแพทยศาสตร์ ม.เชียงใหม่",
    icon: "🎨"
  }
];

const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleFAQ = (itemId: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-12 md:py-16 bg-gray-50" id="faq">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          คำถามที่พบบ่อย
        </h2>
        
        <div className="space-y-4">
          {defaultFAQs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg shadow-sm">
              <button 
                className="w-full text-left p-6 flex justify-between items-center"
                onClick={() => toggleFAQ(faq.id)}
              >
                <span className="font-semibold text-gray-800">{faq.question}</span>
                <span 
                  className={`text-2xl text-tbat-primary transition-transform duration-200 ${
                    openItems.has(faq.id) ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  {openItems.has(faq.id) ? '−' : '+'}
                </span>
              </button>
              {openItems.has(faq.id) && (
                <div className="px-6 pb-6">
                  {faq.answer.split('\n').map((line, index) => (
                    <p key={index} className="text-gray-600">
                      {line}
                      {index < faq.answer.split('\n').length - 1 && <br />}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
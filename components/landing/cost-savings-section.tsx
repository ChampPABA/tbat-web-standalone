'use client';

import React from 'react';

interface CostSavingsSectionProps {
  // Keep it simple, just like the original HTML
}

const CostSavingsSection: React.FC<CostSavingsSectionProps> = () => {
  return (
    <section className="pt-20 pb-12 md:pt-24 md:pb-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ประหยัดค่าใช้จ่าย 5,000+ บาท
          </h2>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              การเดินทางไปสอบ TBAT ที่กรุงเทพมหานครจะมีค่าใช้จ่ายสูงมาก เริ่มจากค่าเดินทาง (ไป-กลับ) ประมาณ 3,000 บาท 
              ค่าที่พักอย่างน้อย 2,500 บาท ค่าอาหารและเบ็ดเตล็ด 800 บาท รวมกับค่าเดินทางในกรุงเทพอีก 300 บาท
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              แต่เมื่อสอบที่เชียงใหม่ คุณจะประหยัดได้ทั้งหมดเหล่านี้ นอนที่บ้าน กินอาหารที่คุ้นเคย สอบในสภาพแวดล้อมที่สุขสบาย
              ไม่ต้องกังวลเรื่องการเดินทางหรือที่พักแปลกใหม่
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">💰 ประหยัดรวมมากกว่า 5,000+ บาท</h3>
              <p className="text-green-700">เงินที่ประหยัดได้นำไปลงทุนซื้อหรือปรับปรุงการเรียนแทน</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CostSavingsSection;
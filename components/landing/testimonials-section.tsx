'use client';

import React from 'react';

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
          เสียงตอบรับจากผู้เข้าร่วม
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          ผู้เข้าร่วม Dentorium Camp ครั้งแรกที่เชียงใหม่ เรียกร้องให้จัด Mock Exam ที่เชียงใหม่
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="testimonial-card bg-gray-50 rounded-2xl p-6 transition-all duration-300 ease-in-out hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-tbat-primary rounded-full flex items-center justify-center text-white font-bold">
                👨‍🎓
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800">ผู้เข้าร่วม #1</h4>
                <p className="text-sm text-gray-600">นักเรียนจากเชียงใหม่</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "หลังจากเข้า Dentorium Camp ที่เชียงใหม่ รู้สึกว่าถ้ามี Mock Exam ที่เชียงใหม่จะดีมาก ไม่ต้องเดินทางไกล"
            </p>
            <div className="flex mt-4">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
          
          <div className="testimonial-card bg-gray-50 rounded-2xl p-6 transition-all duration-300 ease-in-out hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-tbat-secondary rounded-full flex items-center justify-center text-white font-bold">
                👩‍🎓
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800">ผู้เข้าร่วม #2</h4>
                <p className="text-sm text-gray-600">นักเรียนจากเชียงใหม่</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "เคยเข้า Dentorium Camp ครั้งแรกมาแล้ว อยากให้จัด Mock Exam ที่เชียงใหม่บ้าง จะได้ไม่ต้องเดินทางไกลไปกรุงเทพฯ"
            </p>
            <div className="flex mt-4">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
          
          <div className="testimonial-card bg-gray-50 rounded-2xl p-6 transition-all duration-300 ease-in-out hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-tbat-accent rounded-full flex items-center justify-center text-white font-bold">
                👨‍🎓
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800">ผู้เข้าร่วม #3</h4>
                <p className="text-sm text-gray-600">นักเรียนจากเชียงใหม่</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "ขอบคุณที่จัด Mock Exam ให้ครับ หลังจากเข้า Dentorium Camp ที่เชียงใหม่แล้วรู้สึกว่าควรมีสนามทดสอบที่เชียงใหม่ด้วย"
            </p>
            <div className="flex mt-4">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const DentoriumSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 7;

  const dentoriumImages = [
    { src: '/assets/dentorium/1.JPG', alt: 'Dentorium Camp 1' },
    { src: '/assets/dentorium/2.JPG', alt: 'Dentorium Camp 2' },
    { src: '/assets/dentorium/3.JPG', alt: 'Dentorium Camp 3' },
    { src: '/assets/dentorium/4.JPG', alt: 'Dentorium Camp 4' },
    { src: '/assets/dentorium/5.JPG', alt: 'Dentorium Camp 5' },
    { src: '/assets/dentorium/6.JPG', alt: 'Dentorium Camp 6' },
    { src: '/assets/dentorium/7.JPG', alt: 'Dentorium Camp 7' }
  ];

  const moveCarousel = (direction: number) => {
    setCurrentSlide(prev => {
      let newSlide = prev + direction;
      if (newSlide >= totalSlides) newSlide = 0;
      if (newSlide < 0) newSlide = totalSlides - 1;
      return newSlide;
    });
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      moveCarousel(1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
          📚 จากความสำเร็จ Dentorium Camp 2568
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Description */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-tbat-primary mb-3">Dentorium Camp ครั้งแรก</h3>
              <p className="text-gray-700 mb-2">จัดเมื่อ กรกฎาคม 2568</p>
              <p className="text-gray-600 text-sm mb-3">ที่คณะทันตแพทยศาสตร์ ม.เชียงใหม่</p>
              <p className="text-gray-700 italic">"ค่ายค้นหาตัวเอง ช่วยให้นักเรียนค้นพบว่าเหมาะกับการเรียนทันตแพทย์"</p>
            </div>
            
            <div className="bg-gradient-to-br from-tbat-primary to-tbat-secondary text-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-3">ASPECT</h3>
              <p className="text-lg mb-2">ผู้จัด Dentorium Camp และ TBAT Mock Exam</p>
              <p className="text-tbat-light text-sm">"หลังจากจัด Dentorium Camp ครั้งแรกที่เชียงใหม่สำเร็จเป็นอย่างดี นักเรียนหลายคนขอให้จัด Mock TBAT ที่เชียงใหม่"</p>
            </div>
          </div>
          
          {/* Right: Gallery Carousel */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">📸 ภาพบรรยากาศ</h4>
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {dentoriumImages.map((image, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-[200px] md:h-[250px] object-cover"
                      width={400}
                      height={250}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.opacity = '0.3';
                        target.alt = 'Image not available';
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Carousel Controls */}
              <button 
                onClick={() => moveCarousel(-1)}
                aria-label="Previous slide"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-lg transition-all"
              >
                <svg className="w-4 h-4 text-tbat-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <button 
                onClick={() => moveCarousel(1)}
                aria-label="Next slide"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-lg transition-all"
              >
                <svg className="w-4 h-4 text-tbat-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              
              {/* Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {Array.from({ length: totalSlides }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentSlide ? 'bg-white/80' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exam Room Gallery */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
          🏫 ห้องสอบมาตรฐาน
        </h2>
        <p className="text-lg text-gray-600 text-center mb-8">
          สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่
        </p>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <Image
              src="/assets/room/1.png"
              alt="ห้องทองกวาว 1"
              className="w-full h-[250px] md:h-[300px] object-cover"
              width={400}
              height={300}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '0.3';
                target.alt = 'Room image not available';
              }}
            />
            <Image
              src="/assets/room/2.png"
              alt="ห้องทองกวาว 2"
              className="w-full h-[250px] md:h-[300px] object-cover"
              width={400}
              height={300}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '0.3';
                target.alt = 'Room image not available';
              }}
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">ห้องทองกวาว 1 & 2</h3>
            <p className="text-tbat-primary font-semibold mb-3">ห้องเชื่อมต่อกันเป็นห้องสอบขนาดใหญ่ รองรับได้ 300 ที่นั่ง</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-gray-700">ห้องปรับอากาศเย็นสบาย</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-gray-700">ระบบเสียงและแสงมาตรฐาน</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-gray-700">ที่จอดรถฟรีภายใน มช.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DentoriumSection;
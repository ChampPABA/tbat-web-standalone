"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useCapacity } from '@/hooks/useCapacity';

interface HeroSectionProps {
  onRegisterClick?: () => void;
  onViewPackagesClick?: () => void;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function HeroSection({ onRegisterClick, onViewPackagesClick }: HeroSectionProps) {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Memoize callbacks to prevent infinite re-renders
  const handleSuccess = useCallback(() => {
    setIsRefreshing(false);
    setLastUpdateTime(new Date());
  }, []);

  const handleError = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  // Re-enable capacity tracking for testing
  const { data: capacityData, loading: capacityLoading, error: capacityError, refetch } = useCapacity({
    onSuccess: handleSuccess,
    onError: handleError
  });
  

  // Track when capacity is updating (for smooth transitions)
  useEffect(() => {
    if (capacityLoading && capacityData) {
      setIsRefreshing(true);
    }
  }, [capacityLoading, capacityData]);

  // Countdown timer hook
  useEffect(() => {
    // Target date: 24 กันยายน 2568 (2025-09-24) 23:59:59
    const targetDate = new Date('2025-09-24T23:59:59').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const timeLeftMs = targetDate - now;

      if (timeLeftMs > 0) {
        const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update immediately and then every second
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRegisterClick = () => {
    if (onRegisterClick) {
      onRegisterClick();
    }
  };

  const handleViewPackagesClick = () => {
    if (onViewPackagesClick) {
      onViewPackagesClick();
    } else {
      // Scroll to pricing section
      const element = document.getElementById('pricing');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <section 
      className="bg-gradient-to-br from-tbat-bg to-white py-20" 
      aria-labelledby="hero-title"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          {/* Badge */}
          <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-fade-in-up">
            ศูนย์สอบ TBAT Mock Exam อันดับ 1 ของภาคเหนือ
          </span>

          {/* Main Title */}
          <h1 
            id="hero-title" 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 animate-fade-in font-prompt"
          >
            สนามสอบ TBAT จำลองที่เชียงใหม่
            <br />
            <span className="text-tbat-primary">สมัคร "สอบฟรี" ทุกคน</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-6 animate-fade-in-up font-prompt">
            <strong>Mock Exam จัดโดย ASPECT</strong> • <strong>TBAT จริงจัดโดยจุฬาลงกรณ์มหาวิทยาลัย</strong>
            <br />
            ใช้ยื่นเข้าคณะสายวิทยาศาสตร์สุขภาพ
          </p>

          {/* Event Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto mb-8 animate-scale-in hover:shadow-xl transition-shadow duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start">
                <span className="text-2xl mr-3" aria-hidden="true">🗓️</span>
                <div>
                  <h3 className="font-semibold text-gray-800 font-prompt">วัน-เวลา</h3>
                  <p className="text-gray-600 text-base font-prompt">วันเสาร์ที่ 27 กันยายน 2568</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-gray-600 text-base font-prompt">
                      รอบเช้า: 09:00 - 12:00 น. 
                      <span className="text-sm text-orange-600 block">(เช็คอิน 08:15)</span>
                    </p>
                    <p className="text-gray-600 text-base font-prompt">
                      รอบบ่าย: 13:00 - 16:00 น. 
                      <span className="text-sm text-orange-600 block">(เช็คอิน 12:15)</span>
                    </p>
                  </div>
                  <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded animate-pulse font-prompt">
                    (โปรดมาถึงก่อนเวลาสอบ 45 นาที)
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-3" aria-hidden="true">📍</span>
                <div>
                  <h3 className="font-semibold text-gray-800 font-prompt">สถานที่</h3>
                  <p className="text-gray-600 text-base font-prompt">สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่</p>
                  <p className="text-gray-500 text-sm font-prompt">ห้องทองกวาว 1 และห้องทองกวาว 2</p>
                  <a 
                    href="https://maps.app.goo.gl/6crQRkv2eZzPwoXP8" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-tbat-primary text-xs hover:underline font-prompt"
                  >
                    ดูแผนที่ Google Maps
                  </a>
                  <div className="mt-1">
                    <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded animate-pulse font-prompt">
                      • สมัครสอบฟรี จำกัด 300 ที่เท่านั้น
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-slide-in-right">
            <button 
              onClick={handleRegisterClick}
              data-testid="register-button"
              className="px-8 py-3 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-colors duration-200 font-semibold text-lg btn-hover-effect font-prompt"
            >
              สมัครฟรีเลย
            </button>
            <button 
              onClick={handleViewPackagesClick}
              className="px-8 py-3 border-2 border-tbat-primary text-tbat-primary rounded-lg hover:bg-tbat-primary hover:text-white transition-colors duration-200 font-semibold text-lg font-prompt"
            >
              ดูแพ็กเกจ
            </button>
          </div>

          {/* Countdown Timer */}
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto mb-6 animate-scale-in">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-prompt">⏰ เหลือเวลาสมัคร</h3>
              <p className="text-sm text-gray-600 mb-3 font-prompt">สมัครได้ถึงวันที่ 24 กันยายน 2568 เวลา 23:59 น.</p>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-tbat-primary text-white rounded-lg p-3">
                  <div className="text-xl font-bold font-prompt">{timeLeft.days}</div>
                  <div className="text-xs font-prompt">วัน</div>
                </div>
                <div className="bg-tbat-primary text-white rounded-lg p-3">
                  <div className="text-xl font-bold font-prompt">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-xs font-prompt">ชั่วโมง</div>
                </div>
                <div className="bg-tbat-primary text-white rounded-lg p-3">
                  <div className="text-xl font-bold font-prompt">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-xs font-prompt">นาที</div>
                </div>
                <div className="bg-tbat-primary text-white rounded-lg p-3">
                  <div className="text-xl font-bold font-prompt">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-xs font-prompt">วินาที</div>
                </div>
              </div>
            </div>
          </div>


          {/* Exam Date Clarification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto animate-fade-in-up">
            {/* Mock Exam */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <h4 className="font-bold text-green-800 mb-1 font-prompt">📝 TBAT Mock Exam</h4>
              <p className="text-green-700 text-base font-prompt">
                <strong>วันเสาร์ที่ 27 กันยายน 2568</strong>
              </p>
              <p className="text-green-600 text-xs font-prompt">สนามสอบจำลองที่เชียงใหม่</p>
            </div>
            
            {/* Real TBAT */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <h4 className="font-bold text-blue-800 mb-1 font-prompt">🏛️ TBAT จริง</h4>
              <p className="text-blue-700 text-base font-prompt">
                <strong>วันเสาร์ที่ 5 ตุลาคม 2568</strong>
              </p>
              <p className="text-blue-600 text-xs font-prompt">สอบที่กรุงเทพมหานครและจังหวัดอื่นๆ</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
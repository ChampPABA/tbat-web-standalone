'use client';

import React, { useState, useEffect } from 'react';

interface FinalCTASectionProps {
  onRegisterFreeClick?: () => void;
  onUpgradeClick?: () => void;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onRegisterFreeClick,
  onUpgradeClick
}) => {
  const [daysLeft, setDaysLeft] = useState<string>('--');

  useEffect(() => {
    // Set registration deadline to September 24, 2025 23:59
    const deadlineDate = new Date('2025-09-24T23:59:00');
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff > 0) {
      setDaysLeft(daysDiff.toString());
    } else {
      setDaysLeft('0');
    }

    // Update countdown every hour
    const interval = setInterval(() => {
      const currentTime = new Date();
      const currentTimeDiff = deadlineDate.getTime() - currentTime.getTime();
      const currentDaysDiff = Math.ceil(currentTimeDiff / (1000 * 3600 * 24));
      
      if (currentDaysDiff > 0) {
        setDaysLeft(currentDaysDiff.toString());
      } else {
        setDaysLeft('0');
      }
    }, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-r from-tbat-primary to-tbat-secondary">
      <div className="max-w-4xl mx-auto px-4 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          พร้อมทดสอบความสามารถของคุณแล้วหรือยัง?
        </h2>
        <p className="text-xl md:text-2xl mb-8 text-tbat-light">
          สมัครเลยวันนี้ ที่นั่งจำกัด
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button 
            onClick={onRegisterFreeClick}
            className="px-8 py-4 bg-white text-tbat-primary rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-200"
          >
            สมัครฟรี - Free Package
          </button>
          <button 
            onClick={onUpgradeClick}
            className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-tbat-primary transition-colors duration-200"
          >
            อัพเกรด - Advanced Package <span className="line-through">฿990</span> ฿690
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-tbat-light">
          <div className="flex items-center">
            <span className="text-2xl mr-2">⏰</span>
            <span>เหลือเวลาสมัคร: <span className="font-bold text-white">{daysLeft}</span> วัน</span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl mr-2">🪑</span>
            <span>จำกัด: <span className="font-bold text-white">รอบละไม่เกิน 300 ท่าน</span></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
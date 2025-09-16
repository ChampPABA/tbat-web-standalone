'use client';

import React from 'react';

interface Feature {
  id: number;
  icon: string;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

interface FeaturesSectionProps {
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    id: 1,
    icon: "🎯",
    title: "แบบสอบตรงมาตรฐาน TBAT",
    description: "ข้อสอบจัดทำโดยผู้เชี่ยวชาญ ตรงตามมาตรฐานการสอบจริง รูปแบบและระดับความยากเหมือนสอบจริง 100%",
    gradientFrom: "from-tbat-primary",
    gradientTo: "to-tbat-secondary"
  },
  {
    id: 2,
    icon: "📊",
    title: "ระบบวิเคราะห์ผลการสอบ",
    description: "ระบบวิเคราะห์ผลแสดงจุดแข็ง-อ่อน เปรียบเทียบกับสถิติ พร้อมคำแนะนำการปรับปรุงแบบละเอียด",
    gradientFrom: "from-tbat-primary",
    gradientTo: "to-tbat-secondary"
  },
  {
    id: 3,
    icon: "💰",
    title: "ประหยัดค่าใช้จ่าย",
    description: "ไม่ต้องเดินทางไปกรุงเทพ ประหยัดค่าใช้จ่ายมากกว่า 5,000+ บาท นอนที่บ้าน สบายใจ",
    gradientFrom: "from-green-500",
    gradientTo: "to-green-600"
  },
  {
    id: 4,
    icon: "⚡",
    title: "ผลสอบภายใน 48 ชั่วโมง",
    description: "รับผลสอบและการวิเคราะห์ภายใน 48 ชั่วโมงหลังสอบเสร็จ แจ้งผ่าน Email ให้คุณทราบ",
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-600"
  },
  {
    id: 5,
    icon: "📚",
    title: "PDF เฉลยคำอธิบาย",
    description: "ดาวน์โหลดเฉลยพร้อมคำอธิบายละเอียด (Advanced Package) เรียนรู้จากข้อผิดพลาดได้อย่างมีประสิทธิภาพ",
    gradientFrom: "from-purple-500",
    gradientTo: "to-purple-600"
  },
  {
    id: 6,
    icon: "🏆",
    title: "ประสบการณ์จริง",
    description: "สภาพแวดล้อมการสอบจำลองสถานการณ์จริง 100% ช่วยลดความเครียดในวันสอบจริง",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-500"
  }
];

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  features = defaultFeatures
}) => {
  return (
    <section className="bg-gray-50 py-12 md:py-16" id="features">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
          ทำไมต้องเลือกเรา?
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          สนามสอบจำลองที่ครบครันที่สุด พร้อมระบบวิเคราะห์ผลการสอบ
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-card bg-white p-6 rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} rounded-lg mb-4 flex items-center justify-center`}>
                <span className="text-2xl text-white">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
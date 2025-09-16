'use client';

import React from 'react';
import Image from 'next/image';

interface ValidatorProfile {
  id: number;
  name: string;
  university: string;
  program: string;
  imageUrl?: string;
  achievements: string[];
}

interface PartnerLogo {
  id: number;
  name: string;
  logoUrl: string;
}

interface ValidatorSectionProps {
  validators?: ValidatorProfile[];
  partnerLogos?: PartnerLogo[];
}

const defaultValidators: ValidatorProfile[] = [
  {
    id: 1,
    name: "โมโม่ อธิบดี การะเกด",
    university: "คณะแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่",
    program: "TCAS รอบ 1 Portfolio โครงการเรียนดีภาษาอังกฤษ",
    imageUrl: "/assets/validator1.jpg",
    achievements: [
      "ชนะเลิศ Thailand Junior Water Prize 2024 (Stockholm, Sweden)",
      "ตัวแทนประเทศไทย Asian Science Camp 2025",
      "เหรียญทอง YSC2024 และ YSC2025",
      "โอลิมปิกเคมี ค่าย 2 ศูนย์ มช.",
      "โอลิมปิกฟิสิกส์ ค่าย 1 ศูนย์ มช.",
      "รองชนะเลิศอันดับ 4 Chem Challenge #12 จุฬาฯ"
    ]
  },
  {
    id: 2,
    name: "กาณฑ์ เลาหพูนรังษี",
    university: "คณะแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่",
    program: "ติดศิริราช TCAS รอบ 1 โครงการเรียนดีโอลิมปิก",
    imageUrl: "/assets/validator2.jpg",
    achievements: [
      "เหรียญเงิน เคมีโอลิมปิกระดับชาติ ครั้งที่ 20",
      "ผู้แทนศูนย์ มช. TChO 19",
      "ค่ายสสวท. 1 วิชาเคมี",
      "ชนะเลิศ Chem Challenge #11 จุฬาฯ",
      "เหรียญทอง MU CHEM CONTEST",
      "Semi-Final SIMSAT #3 ศิริราช"
    ]
  },
  {
    id: 3,
    name: "ภูวเดช เขื่อนแก้ว",
    university: "คณะแพทยศาสตร์ศิริราชพยาบาล ปี 3",
    program: "มหาวิทยาลัยมหิดล",
    imageUrl: "/assets/validator3.jpg",
    achievements: [
      "เหรียญทองแดง ชีววิทยาโอลิมปิกระดับชาติ ครั้งที่ 19",
      "ผู้แทนศูนย์ สอวน. ชีววิทยา มช. 2564",
      "ค่ายสสวท. ชีววิทยา 2564",
      "เหรียญทอง ชีววิทยา งานสัปดาห์วิทย์ 2564-2565",
      "100 คะแนน A-level ชีววิทยา 2566"
    ]
  },
  {
    id: 4,
    name: "นายกฤติน อารีย์รบ",
    university: "คณะแพทยศาสตร์ สถาบันพระบรมราชชนก PIMD รุ่นที่ 28",
    program: "",
    imageUrl: "/assets/validator4.jpg",
    achievements: [
      "เกียรติคุณประกาศและเหรียญทองแดง TPhO ครั้งที่ 20 และ 21",
      "ผ่านการคัดเลือก IJSO รอบ 2",
      "สอนฟิสิกส์ A-Level ในโครงการติวเข้ม เติมความรู้ส่งเพื่อนเข้าสู่รั้วมหาลัย",
      "สอนเสริมเพื่อนสอบ สอวน. และ IJSO ให้รุ่นน้อง GMB"
    ]
  }
];

const defaultPartnerLogos: PartnerLogo[] = [
  { id: 1, name: "Partner 1", logoUrl: "/assets/Logo/1.jpg" },
  { id: 2, name: "Partner 2", logoUrl: "/assets/Logo/2.jpg" },
  { id: 3, name: "Partner 3", logoUrl: "/assets/Logo/3.jpg" },
  { id: 4, name: "Partner 4", logoUrl: "/assets/Logo/4.jpg" },
  { id: 5, name: "Partner 5", logoUrl: "/assets/Logo/5.png" }
];

const ValidatorSection: React.FC<ValidatorSectionProps> = ({
  validators = defaultValidators,
  partnerLogos = defaultPartnerLogos
}) => {
  return (
    <>
      {/* Validator Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-tbat-bg to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
            ผู้คัดเลือกและตรวจข้อสอบ
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            นักเรียนแพทย์และอดีตนักเรียนโอลิมปิกวิชาการ ที่มีประสบการณ์สอบ TBAT จริง
          </p>
          
          {/* Validator Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {validators.map((validator) => (
              <div
                key={validator.id}
                className="validator-card bg-white rounded-xl shadow-lg p-6 h-full transition-all duration-300 ease-in-out hover:transform hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="text-center mb-4">
                  {validator.imageUrl ? (
                    <Image
                      src={validator.imageUrl}
                      alt={validator.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover mb-3"
                      width={128}
                      height={128}
                      style={validator.id === 3 ? { objectPosition: '50% 30%' } : undefined}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {!validator.imageUrl && (
                    <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center mb-3">
                      <span className="text-4xl text-gray-400">👤</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-800">{validator.name}</h3>
                  <p className="text-sm text-tbat-primary font-semibold">{validator.university}</p>
                  {validator.program && (
                    <p className="text-xs text-gray-600">{validator.program}</p>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  <h4 className="font-semibold mb-2">ประวัติ/ผลงาน:</h4>
                  <ul className="space-y-1 text-xs">
                    {validator.achievements.map((achievement, index) => (
                      <li key={index}>• {achievement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility/Partners Section */}
      <section className="bg-gray-50 py-12 md:py-16 mt-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            การจัดสอบ TBAT Mock Exam ดำเนินการโดย ASPECT
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            ซึ่ง ASPECT ได้รับการสนับสนุนจากหน่วยงานพันธมิตร
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12 items-center justify-items-center">
            {partnerLogos.map((partner) => (
              <div
                key={partner.id}
                className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-24 w-full"
              >
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="max-h-16 max-w-full object-contain"
                  width={120}
                  height={64}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '0.3';
                    target.alt = 'Logo unavailable';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ValidatorSection;
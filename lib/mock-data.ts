// Mock data service for TBAT Mock Exam Platform
// This file contains mock data used during development phase

export interface PackageType {
  type: "FREE" | "ADVANCED";
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  badge?: string;
  badgeColor?: string;
  features: PackageFeature[];
  limitations?: string[];
  availability: {
    status: "available" | "limited" | "full";
    statusText: string;
    maxCapacity?: number;
    currentCount?: number;
  };
  buttonText: string;
  buttonStyle: "outline" | "solid";
  footerNote?: string;
}

export interface PackageFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface SessionCapacity {
  session_time: "09:00-12:00" | "13:00-16:00";
  current_count: number;
  max_capacity: number;
  availability: "available" | "limited" | "full";
}

export interface SubjectOption {
  id: string;
  name: string;
  shortName: string;
  enabled: boolean;
}

// Mock package data
export const mockPackages: PackageType[] = [
  {
    type: "FREE",
    name: "Free Package",
    price: 0,
    description: "ทดลองฟรี",
    badge: "เปิดรับสมัคร",
    badgeColor: "green",
    features: [
      { text: "เลือกสอบได้ 1 วิชา", included: true },
      { text: "ผลสอบพื้นฐาน", included: true },
      { text: "คะแนนรวมและเปรียบเทียบ", included: true },
      { text: "การวิเคราะห์แบบจำกัด", included: false },
      { text: "PDF เฉลยและคำอธิบาย", included: false },
      { text: "รายงานการวิเคราะห์ละเอียด", included: false },
      { text: "เอาข้อสอบกลับบ้านไม่ได้", included: false },
    ],
    availability: {
      status: "available",
      statusText: "เปิดรับสมัคร",
      maxCapacity: 300,
      currentCount: 147
    },
    buttonText: "เลือกแพ็กเกจฟรี",
    buttonStyle: "outline",
    footerNote: "เหมาะสำหรับผู้ที่ต้องการทดลองสอบเบื้องต้น",
    limitations: [
      "จำกัด 300 ที่ (ไม่เกิน 150 ที่/รอบ)",
      "⚠️ หมายเหตุ: เมื่อ Free Package เต็ม จะเปิดเฉพาะ Advanced Package เท่านั้น"
    ]
  },
  {
    type: "ADVANCED",
    name: "Advanced Package", 
    price: 690,
    originalPrice: 990,
    description: "สิทธิพิเศษ สมัคร 3 วันแรกเท่านั้น",
    badge: "แนะนำ",
    badgeColor: "yellow",
    features: [
      { text: "ครบทั้ง 3 วิชา (ชีวะ เคมี ฟิสิกส์)", included: true, highlight: true },
      { text: "รายงานการวิเคราะห์แบบละเอียด", included: true },
      { text: "ดาวน์โหลด PDF เฉลยและคำอธิบาย", included: true },
      { text: "เปรียบเทียบสถิติกับผู้สอบทั้งหมด", included: true },
      { text: "แนะนำจุดที่ต้องปรับปรุง", included: true },
      { text: "การวิเคราะห์ผลการสอบ", included: true },
      { text: "เอาข้อสอบกลับบ้านได้", included: true },
    ],
    availability: {
      status: "limited",
      statusText: "จำนวนจำกัด",
    },
    buttonText: "อัพเกรดเลย",
    buttonStyle: "solid",
    footerNote: "เหมาะสำหรับผู้ที่ต้องการเตรียมตัวอย่างจริงจัง"
  }
];

// Mock session capacity data (updated for registration enhancement)
export const mockSessionCapacity: SessionCapacity[] = [
  {
    session_time: "09:00-12:00",
    current_count: 77,
    max_capacity: 150,
    availability: "available"
  },
  {
    session_time: "13:00-16:00", 
    current_count: 76,
    max_capacity: 150,
    availability: "available"
  }
];

// Mock subject options for Free Package
export const mockSubjects: SubjectOption[] = [
  {
    id: "biology",
    name: "ชีววิทยา",
    shortName: "ชีวะ",
    enabled: true
  },
  {
    id: "chemistry", 
    name: "เคมี",
    shortName: "เคมี",
    enabled: true
  },
  {
    id: "physics",
    name: "ฟิสิกส์", 
    shortName: "ฟิสิกส์",
    enabled: true
  }
];

// Helper functions
export const getPackageByType = (type: "FREE" | "ADVANCED"): PackageType | undefined => {
  return mockPackages.find(pkg => pkg.type === type);
};

export const getTotalCapacity = (): { current: number; max: number; percentage: number } => {
  const total = mockSessionCapacity.reduce((acc, session) => ({
    current: acc.current + session.current_count,
    max: acc.max + session.max_capacity
  }), { current: 0, max: 0 });
  
  return {
    ...total,
    percentage: Math.round((total.current / total.max) * 100)
  };
};

export const getAvailabilityStatus = (currentCount: number, maxCapacity: number): SessionCapacity['availability'] => {
  const percentage = (currentCount / maxCapacity) * 100;
  if (percentage >= 95) return "full";
  if (percentage >= 80) return "limited";
  return "available";
};

// Registration form interfaces (enhanced for password and session selection)
export interface RegistrationData {
  packageType: "FREE" | "ADVANCED";
  selectedSubject?: string; // For FREE package only
  sessionTime: "09:00-12:00" | "13:00-16:00";
  personalInfo: {
    fullname: string;
    nickname?: string;
    email: string; // Used as username
    phone: string;
    lineid: string;
    school: string;
    grade: string;
    parentName?: string;
    parentPhone?: string;
    password: string;
    confirmPassword: string;
  };
  pdpaConsent: boolean;
}

export interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => void;
  packageSelection: PackageType;
  pdpaConsent: boolean;
}
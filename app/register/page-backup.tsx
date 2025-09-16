"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ArrowLeft, ArrowRight, Phone, Mail, User, School, GraduationCap, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Form data interface
interface FormData {
  personal: {
    fullname: string;
    nickname: string;
    email: string;
    phone: string;
    lineid: string;
    school: string;
    grade: string;
    parentName?: string;
    parentPhone?: string;
    password: string;
    confirmPassword: string;
  };
  subject: string;
  sessionTime: string;
  terms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    personal: {
      fullname: "",
      nickname: "",
      email: "",
      phone: "",
      lineid: "",
      school: "",
      grade: "",
      password: "",
      confirmPassword: ""
    },
    subject: "",
    sessionTime: "",
    terms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [finalCode, setFinalCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation functions
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/[- ]/g, "");
    const re = /^[0-9]{10}$/;
    return re.test(cleanPhone);
  };

  const validatePassword = (password: string) => {
    // 8+ characters, must contain letters and numbers
    const minLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return minLength && hasLetter && hasNumber;
  };

  // Update progress bar
  const updateProgressBar = (step: number) => {
    // This will be handled by CSS classes based on currentStep
  };

  // Step 1 validation and submission
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.personal.fullname.trim()) {
      newErrors.fullname = "กรุณากรอกชื่อ-นามสกุล";
    }
    if (!validateEmail(formData.personal.email)) {
      newErrors.email = "กรุณากรอกอีเมลที่ถูกต้อง";
    }
    if (!validatePhone(formData.personal.phone)) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก";
    }
    if (!formData.personal.lineid.trim()) {
      newErrors.lineid = "กรุณากรอก Line ID";
    }
    if (!formData.personal.school) {
      newErrors.school = "กรุณาเลือกโรงเรียน";
    }
    if (!formData.personal.grade) {
      newErrors.grade = "กรุณาเลือกระดับชั้น";
    }
    if (!formData.personal.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (!validatePassword(formData.personal.password)) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข";
    }
    if (!formData.personal.confirmPassword) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (formData.personal.password !== formData.personal.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 2 validation and submission
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.subject) {
      newErrors.subject = "กรุณาเลือกวิชาที่ต้องการสอบ";
    }
    if (!formData.sessionTime) {
      newErrors.sessionTime = "กรุณาเลือกเวลาสอบ";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Final submission
  const handleFinalSubmit = async () => {
    if (!formData.terms) {
      setErrors({ terms: "กรุณายอมรับข้อตกลงและเงื่อนไข" });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate exam code
    const subjectCodes = {
      biology: "BIO",
      chemistry: "CHE",
      physics: "PHY"
    };
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const examCode = `FREE-${randomCode}-${subjectCodes[formData.subject as keyof typeof subjectCodes]}`;
    
    setFinalCode(examCode);
    setCurrentStep(4);
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auto-format phone number
  const formatPhoneNumber = (value: string) => {
    let phone = value.replace(/[^\d]/g, "");
    if (phone.length >= 6) {
      phone = phone.slice(0, 3) + "-" + phone.slice(3, 6) + "-" + phone.slice(6, 10);
    } else if (phone.length >= 3) {
      phone = phone.slice(0, 3) + "-" + phone.slice(3);
    }
    return phone;
  };

  const handlePhoneChange = (field: 'phone' | 'parentPhone', value: string) => {
    const formatted = formatPhoneNumber(value);
    if (field === 'phone') {
      setFormData(prev => ({
        ...prev,
        personal: { ...prev.personal, phone: formatted }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        personal: { ...prev.personal, parentPhone: formatted }
      }));
    }
  };

  // Subject names mapping
  const subjectNames = {
    biology: "Biology (ชีววิทยา)",
    chemistry: "Chemistry (เคมี)",
    physics: "Physics (ฟิสิกส์)"
  };

  return (
    <div className="bg-gradient-to-br from-tbat-bg/20 to-white min-h-screen font-prompt">
      {/* Skip to content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only absolute top-0 left-0 bg-tbat-primary text-white p-2 z-50"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-tbat-bg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-tbat-primary to-tbat-secondary rounded-lg flex items-center justify-center text-white font-bold transform hover:scale-110 transition-transform">
                T
              </div>
              <span className="text-xl font-semibold text-tbat-primary">Mock TBAT</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-tbat-primary transition-colors relative group">
                หน้าแรก
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-tbat-primary group-hover:w-full transition-all"></span>
              </Link>
              <a href="#" className="text-gray-600 hover:text-tbat-primary transition-colors relative group">
                เกี่ยวกับ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-tbat-primary group-hover:w-full transition-all"></span>
              </a>
              <a href="#" className="text-gray-600 hover:text-tbat-primary transition-colors relative group">
                ติดต่อ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-tbat-primary group-hover:w-full transition-all"></span>
              </a>
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-center animate-fade-in">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transform transition-transform hover:scale-110 ${
                currentStep >= 1 ? 'bg-tbat-primary text-white' : 'bg-gray-300 text-gray-500'
              } ${currentStep === 1 ? 'scale-110' : ''}`}>
                <span>1</span>
              </div>
              <span className={`ml-3 text-sm font-medium hidden sm:block ${
                currentStep >= 1 ? 'text-tbat-primary' : 'text-gray-500'
              }`}>
                ข้อมูลส่วนตัว
              </span>
            </div>

            {/* Connector 1 */}
            <div className={`flex-1 h-1 mx-2 sm:mx-4 ${
              currentStep >= 2 ? 'bg-tbat-primary' : 'bg-gray-300'
            }`}>
            </div>

            {/* Step 2 */}
            <div className="flex items-center animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transform transition-transform ${
                currentStep >= 2 ? 'bg-tbat-primary text-white' : 'bg-gray-300 text-gray-500'
              } ${currentStep === 2 ? 'scale-110' : ''}`}>
                <span>2</span>
              </div>
              <span className={`ml-3 text-sm font-medium hidden sm:block ${
                currentStep >= 2 ? 'text-tbat-primary' : 'text-gray-500'
              }`}>
                เลือกวิชา
              </span>
            </div>

            {/* Connector 2 */}
            <div className={`flex-1 h-1 mx-2 sm:mx-4 ${
              currentStep >= 3 ? 'bg-tbat-primary' : 'bg-gray-300'
            }`}>
            </div>

            {/* Step 3 */}
            <div className="flex items-center animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transform transition-transform ${
                currentStep >= 3 ? 'bg-tbat-primary text-white' : 'bg-gray-300 text-gray-500'
              } ${currentStep === 3 ? 'scale-110' : ''}`}>
                <span>3</span>
              </div>
              <span className={`ml-3 text-sm font-medium hidden sm:block ${
                currentStep >= 3 ? 'text-tbat-primary' : 'text-gray-500'
              }`}>
                ยืนยันข้อมูล
              </span>
            </div>
          </div>

          {/* Mobile step labels */}
          <div className="flex justify-between mt-2 sm:hidden text-xs">
            <span className={currentStep >= 1 ? 'text-tbat-primary font-medium' : 'text-gray-500'}>
              ข้อมูลส่วนตัว
            </span>
            <span className={currentStep >= 2 ? 'text-tbat-primary font-medium' : 'text-gray-500'}>
              เลือกวิชา
            </span>
            <span className={currentStep >= 3 ? 'text-tbat-primary font-medium' : 'text-gray-500'}>
              ยืนยันข้อมูล
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 animate-slide-up">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              ลงทะเบียนสอบ Mock TBAT
            </h1>
          </div>

          {/* Error Message Container */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {Object.values(errors)[0]}
              </p>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="step">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-tbat-bg text-tbat-primary rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                ข้อมูลส่วนตัว
              </h2>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Personal Details Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-800 border-l-4 border-tbat-primary pl-3">
                    ข้อมูลตัวตน
                  </h3>
                  
                  {/* Name and Nickname */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-field">
                      <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="fullname"
                        value={formData.personal.fullname}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personal: { ...prev.personal, fullname: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${
                          errors.fullname ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="เช่น สมชาย ใจดี"
                      />
                      {errors.fullname && (
                        <span className="text-xs text-red-500 mt-1">{errors.fullname}</span>
                      )}
                    </div>
                    <div className="form-field">
                      <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อเล่น
                      </label>
                      <Input
                        id="nickname"
                        value={formData.personal.nickname}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personal: { ...prev.personal, nickname: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all"
                        placeholder="เช่น ชาย"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-800 border-l-4 border-tbat-primary pl-3">
                    ข้อมูลติดต่อ
                  </h3>
                  
                  {/* Email and Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-field">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        id="email"
                        value={formData.personal.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personal: { ...prev.personal, email: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="example@email.com"
                      />
                      {errors.email && (
                        <span className="text-xs text-red-500 mt-1">{errors.email}</span>
                      )}
                    </div>
                    <div className="form-field">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        id="phone"
                        value={formData.personal.phone}
                        onChange={(e) => handlePhoneChange('phone', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="08X-XXX-XXXX"
                        maxLength={12}
                      />
                      {errors.phone && (
                        <span className="text-xs text-red-500 mt-1">{errors.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Line ID */}
                  <div className="form-field">
                    <label htmlFor="lineid" className="block text-sm font-medium text-gray-700 mb-2">
                      Line ID <span className="text-red-500">*</span>
                      <span className="ml-1 text-xs text-gray-500">(สำหรับรับผลสอบและข่าวสารสำคัญ)</span>
                    </label>
                    <Input
                      id="lineid"
                      value={formData.personal.lineid}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, lineid: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${
                        errors.lineid ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="@lineID"
                    />
                    {errors.lineid && (
                      <span className="text-xs text-red-500 mt-1">{errors.lineid}</span>
                    )}
                  </div>

                  {/* Password Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Password */}
                    <div className="form-field">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่าน <span className="text-red-500">*</span>
                        <span className="ml-1 text-xs text-gray-500">(อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข)</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={formData.personal.password}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personal: { ...prev.personal, password: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="รหัสผ่าน"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-xs text-red-500 mt-1">{errors.password}</span>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-field">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          value={formData.personal.confirmPassword}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personal: { ...prev.personal, confirmPassword: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="ยืนยันรหัสผ่าน"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <span className="text-xs text-red-500 mt-1">{errors.confirmPassword}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education Information Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-800 border-l-4 border-tbat-primary pl-3">
                    ข้อมูลการศึกษา
                  </h3>
                  
                  {/* School */}
                  <div className="form-field">
                    <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                      โรงเรียน <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.personal.school} onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, school: value }
                    }))}>
                      <SelectTrigger className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-tbat-primary bg-white ${
                        errors.school ? 'border-red-500' : 'border-gray-300'
                      }`}>
                        <SelectValue placeholder="เลือกโรงเรียน" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="montfort">มงฟอร์ตวิทยาลัย</SelectItem>
                        <SelectItem value="yuparaj">ยุพราชวิทยาลัย</SelectItem>
                        <SelectItem value="dara">ดาราวิทยาลัย</SelectItem>
                        <SelectItem value="regina">เรยีนาเชลีวิทยาลัย</SelectItem>
                        <SelectItem value="prince">ปรินส์รอยแยลส์วิทยาลัย</SelectItem>
                        <SelectItem value="wachirawit">วชิรวิทย์</SelectItem>
                        <SelectItem value="nawaminda">นวมินทราชูทิศ</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.school && (
                      <span className="text-xs text-red-500 mt-1">{errors.school}</span>
                    )}
                  </div>

                  {/* Grade Selection */}
                  <div className="form-field">
                    <fieldset>
                      <legend className="block text-sm font-medium text-gray-700 mb-3">
                        ระดับชั้น <span className="text-red-500">*</span>
                      </legend>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['ม.4', 'ม.5', 'ม.6', 'อื่นๆ'].map((grade) => (
                          <label
                            key={grade}
                            className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer hover:bg-tbat-bg/20 transition-all group ${
                              formData.personal.grade === grade.toLowerCase().replace('ม.', 'm') || formData.personal.grade === 'other' && grade === 'อื่นๆ'
                                ? 'bg-tbat-primary text-white border-tbat-primary'
                                : 'border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="grade"
                              value={grade === 'อื่นๆ' ? 'other' : grade.toLowerCase().replace('ม.', 'm')}
                              checked={
                                formData.personal.grade === (grade === 'อื่นๆ' ? 'other' : grade.toLowerCase().replace('ม.', 'm'))
                              }
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                personal: { ...prev.personal, grade: e.target.value }
                              }))}
                              className="sr-only"
                            />
                            <span className="font-medium">{grade}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {errors.grade && (
                      <span className="text-xs text-red-500 mt-1">{errors.grade}</span>
                    )}
                  </div>
                </div>

                {/* Parent Information (Optional) */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    ข้อมูลผู้ปกครอง (ไม่บังคับ)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-field">
                      <label htmlFor="parent-name" className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อผู้ปกครอง
                      </label>
                      <Input
                        id="parent-name"
                        value={formData.personal.parentName || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personal: { ...prev.personal, parentName: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all"
                        placeholder="ชื่อ-นามสกุล"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="parent-phone" className="block text-sm font-medium text-gray-700 mb-2">
                        เบอร์ติดต่อผู้ปกครอง
                      </label>
                      <Input
                        type="tel"
                        id="parent-phone"
                        value={formData.personal.parentPhone || ''}
                        onChange={(e) => handlePhoneChange('parentPhone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all"
                        placeholder="08X-XXX-XXXX"
                        maxLength={12}
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                  <Link
                    href="/"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-center"
                  >
                    ย้อนกลับ
                  </Link>
                  <Button
                    type="submit"
                    className="px-8 py-3 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-all flex items-center justify-center group"
                  >
                    ถัดไป
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Subject Selection */}
          {currentStep === 2 && (
            <div className="step">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-tbat-bg text-tbat-primary rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                เลือกวิชาที่ต้องการทดลองสอบ
              </h2>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse-soft">
                <p className="text-sm text-blue-800">
                  <strong>สมาชิก FREE:</strong> สามารถเลือกทดลองสอบได้ 1 วิชา
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-4">
                <fieldset>
                  <legend className="sr-only">เลือกวิชาที่ต้องการสอบ</legend>

                  {/* Biology */}
                  <label className={`block p-4 sm:p-6 border-2 rounded-xl cursor-pointer hover:border-tbat-primary hover:shadow-lg transition-all group mb-4 ${
                    formData.subject === 'biology' ? 'border-tbat-primary bg-tbat-bg/10' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="subject"
                        value="biology"
                        checked={formData.subject === 'biology'}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-tbat-primary transition-colors">
                            Biology (ชีววิทยา)
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full self-start sm:self-auto">
                            60 นาที
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">
                          55 ข้อ | ครอบคลุม 6 หัวข้อหลัก ตามโครงสร้าง TBAT
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Biological diversity (2-4 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Cell theory (9-11 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Organ system (23-27 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Disease defense (4-6 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Plants (1-3 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Genetics evolution (9-11 ข้อ)</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Chemistry */}
                  <label className={`block p-4 sm:p-6 border-2 rounded-xl cursor-pointer hover:border-tbat-primary hover:shadow-lg transition-all group mb-4 ${
                    formData.subject === 'chemistry' ? 'border-tbat-primary bg-tbat-bg/10' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="subject"
                        value="chemistry"
                        checked={formData.subject === 'chemistry'}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-tbat-primary transition-colors">
                            Chemistry (เคมี)
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full self-start sm:self-auto">
                            60 นาที
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">
                          55 ข้อ | ครอบคลุม 14 หัวข้อหลัก ตามโครงสร้าง TBAT
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Laboratory safety (3-5 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Atomic structure (7-9 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Bonding (9-11 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Chemical formula (1-3 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Solutions (1-3 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Stoichiometry (2-4 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Gases (3-5 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Organic chemistry (3-5 ข้อ)</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Physics */}
                  <label className={`block p-4 sm:p-6 border-2 rounded-xl cursor-pointer hover:border-tbat-primary hover:shadow-lg transition-all group mb-4 ${
                    formData.subject === 'physics' ? 'border-tbat-primary bg-tbat-bg/10' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="subject"
                        value="physics"
                        checked={formData.subject === 'physics'}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-tbat-primary transition-colors">
                            Physics (ฟิสิกส์)
                          </h3>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full self-start sm:self-auto">
                            60 นาที
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">
                          30 ข้อ | ครอบคลุม 7 หัวข้อหลัก ตามโครงสร้าง TBAT
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Kinematics and forces (6-8 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Energy (3-4 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Vibrations and waves (5-6 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Electricity (4-5 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Magnetism (3-5 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Electromagnetic waves (1-2 ข้อ)</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Atomic structure (3-4 ข้อ)</span>
                        </div>
                      </div>
                    </div>
                  </label>
                </fieldset>

                {/* Session Time Selection */}
                <div className="mt-6 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">เลือกช่วงเวลาสอบ</h3>
                  <p className="text-sm text-gray-600 mb-4">วันที่ 27 กันยายน 2568 | เลือกช่วงเวลาที่สะดวก</p>
                  
                  <fieldset>
                    <legend className="sr-only">เลือกเวลาสอบ</legend>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Morning Session */}
                      <label className={`block p-4 border-2 rounded-xl cursor-pointer hover:border-tbat-primary hover:shadow-lg transition-all group ${
                        formData.sessionTime === '09:00-12:00' ? 'border-tbat-primary bg-tbat-bg/10' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="sessionTime"
                            value="09:00-12:00"
                            checked={formData.sessionTime === '09:00-12:00'}
                            onChange={(e) => setFormData(prev => ({ ...prev, sessionTime: e.target.value }))}
                            className="sr-only"
                          />
                          <div className="flex-1 text-center">
                            <h4 className="text-lg font-semibold text-gray-800 group-hover:text-tbat-primary transition-colors mb-1">
                              🌅 เช้า
                            </h4>
                            <div className="text-xl font-bold text-tbat-primary mb-2">09:00 - 12:00 น.</div>
                            <div className="text-sm text-gray-600">
                              <div>ที่ว่าง: <span className="font-medium text-green-600">77/150</span></div>
                              <div className="mt-1 text-xs">เหมาะสำหรับคนตื่นเช้า</div>
                            </div>
                          </div>
                        </div>
                      </label>

                      {/* Afternoon Session */}
                      <label className={`block p-4 border-2 rounded-xl cursor-pointer hover:border-tbat-primary hover:shadow-lg transition-all group ${
                        formData.sessionTime === '13:00-16:00' ? 'border-tbat-primary bg-tbat-bg/10' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="sessionTime"
                            value="13:00-16:00"
                            checked={formData.sessionTime === '13:00-16:00'}
                            onChange={(e) => setFormData(prev => ({ ...prev, sessionTime: e.target.value }))}
                            className="sr-only"
                          />
                          <div className="flex-1 text-center">
                            <h4 className="text-lg font-semibold text-gray-800 group-hover:text-tbat-primary transition-colors mb-1">
                              ☀️ บ่าย
                            </h4>
                            <div className="text-xl font-bold text-tbat-primary mb-2">13:00 - 16:00 น.</div>
                            <div className="text-sm text-gray-600">
                              <div>ที่ว่าง: <span className="font-medium text-green-600">76/150</span></div>
                              <div className="mt-1 text-xs">เหมาะสำหรับคนชอบสายๆ</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </fieldset>
                  
                  {errors.sessionTime && (
                    <div className="mt-3 text-sm text-red-600 flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      {errors.sessionTime}
                    </div>
                  )}
                </div>

                {/* Upgrade Option */}
                <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl transform hover:scale-105 transition-transform">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        อยากสอบทั้ง 3 วิชา?
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Advanced Package เพื่อสอบครบทุกวิชา พร้อมวิเคราะห์ผลละเอียด
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="text-lg text-gray-500 line-through">฿990</span>
                        <span className="text-xl font-bold text-green-600">฿690</span>
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">ประหยัด ฿300</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        alert('กำลังเปลี่ยนเส้นทางไปหน้าชำระเงิน Advanced Package');
                        // router.push('/payment?package=advanced');
                      }}
                      type="button"
                      className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap animate-pulse-soft">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">Advanced Package</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs line-through opacity-75">฿990</span>
                          <span className="font-bold">฿690</span>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-center"
                  >
                    ย้อนกลับ
                  </Button>
                  <Button
                    type="submit"
                    className="px-8 py-3 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-all flex items-center justify-center group"
                  >
                    ถัดไป
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="step">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-tbat-bg text-tbat-primary rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  3
                </span>
                ยืนยันข้อมูลการลงทะเบียน
              </h2>

              {/* Summary Card */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 animate-fade-in">
                <h3 className="font-semibold text-gray-800 mb-4">สรุปข้อมูลของคุณ</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">ชื่อ-นามสกุล:</span>
                    <span className="font-medium">{formData.personal.fullname}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">อีเมล:</span>
                    <span className="font-medium">{formData.personal.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">เบอร์โทร:</span>
                    <span className="font-medium">{formData.personal.phone}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Line ID:</span>
                    <span className="font-medium">{formData.personal.lineid}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">โรงเรียน:</span>
                    <span className="font-medium">{formData.personal.school}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">ระดับชั้น:</span>
                    <span className="font-medium">
                      {formData.personal.grade === 'other' ? 'อื่นๆ' : formData.personal.grade.toUpperCase().replace('M', 'ม.')}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">วิชาที่เลือก:</span>
                    <span className="font-medium text-tbat-primary">{subjectNames[formData.subject as keyof typeof subjectNames]}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">เวลาสอบ:</span>
                    <span className="font-medium text-tbat-primary">
                      {formData.sessionTime === '09:00-12:00' ? '🌅 เช้า 09:00 - 12:00 น.' : '☀️ บ่าย 13:00 - 16:00 น.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generated Code Preview */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
                <h3 className="font-semibold text-gray-800 mb-2 text-center">
                  รหัสสอบจะได้รับหลังยืนยันการลงทะเบียน
                </h3>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📧</div>
                  <p className="text-sm text-gray-600">
                    รหัสสอบจะถูกส่งไปยังอีเมลของคุณทันที
                  </p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-6">
                <label className="flex items-start cursor-pointer group">
                  <Checkbox
                    checked={formData.terms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms: checked as boolean }))}
                    className={`mt-1 mr-3 w-5 h-5 ${errors.terms ? 'border-red-500' : ''}`}
                  />
                  <span className="text-xs sm:text-sm text-gray-600">
                    ข้าพเจ้ายอมรับ
                    <button
                      type="button"
                      onClick={() => alert('ข้อตกลงและเงื่อนไข:\n1. การคุ้มครองข้อมูลส่วนบุคคล (PDPA)\n2. นโยบายไม่คืนเงินหลังชำระ\n3. ข้อมูลจะถูกเก็บไว้ 6 เดือน\n4. ผลสอบใช้เพื่อการศึกษาเท่านั้น')}
                      className="text-tbat-primary underline hover:text-tbat-secondary mx-1"
                    >
                      ข้อตกลงและเงื่อนไข
                    </button>
                    การใช้งาน
                  </span>
                </label>
                {errors.terms && (
                  <span className="text-xs text-red-500 mt-1 block ml-8">{errors.terms}</span>
                )}
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-center"
                >
                  ย้อนกลับ
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-tbat-primary to-tbat-secondary text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin mr-2"></div>
                      กำลังลงทะเบียน...
                    </>
                  ) : (
                    <>
                      <span>ยืนยันการลงทะเบียน</span>
                      <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success Message */}
          {currentStep === 4 && (
            <div className="text-center py-8 sm:py-12 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                ลงทะเบียนสำเร็จ!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                รหัสสอบของคุณคือ
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-tbat-primary mb-6 animate-pulse">
                {finalCode}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-8 px-4">
                เราได้ส่งรหัสสอบและรายละเอียดไปยังอีเมลของคุณ<br />
                กรุณาเก็บรหัสนี้ไว้สำหรับเข้าสอบในวันที่ 27 กันยายน 2568
              </p>
              
              {/* LINE Official Account */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">📢 ขั้นตอนสำคัญ!</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    <strong>บังคับ Add Line Official Account</strong><br/>
                    เพื่อรับข่าวสารและการแจ้งเตือนที่รวดเร็ว
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="w-48 h-48 border-2 border-gray-200 rounded-lg shadow-sm bg-white flex items-center justify-center">
                      <Image 
                        src="/line_QR.jpg" 
                        alt="Line QR Code สำหรับ @mockexam.official"
                        width={180}
                        height={180}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Scan QR Code
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button className="px-6 py-3 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-all">
                  ไปยัง Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  พิมพ์บัตรสอบ
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center text-xs sm:text-sm text-gray-600">
          <p>
            หากมีปัญหาในการลงทะเบียน ติดต่อ Line: @aimmed.official | โทร: 099-378-8111
          </p>
        </div>
      </main>
    </div>
  );
}
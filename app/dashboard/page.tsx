"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RegistrationInfo from '@/components/dashboard/registration-info';
import ExamCodeDisplay from '@/components/dashboard/exam-code-display';
import ExamInfoPanel from '@/components/dashboard/exam-info-panel';
import PrintRegistration from '@/components/dashboard/print-registration';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { profile, loading, error } = useUserProfile();

  // Show loading with navigation
  if (status === 'loading') {
    return (
      <DashboardLayout userName="ผู้ใช้">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-tbat-primary mx-auto mb-4" />
            <p className="text-gray-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Redirect to landing page if not authenticated
  if (status === 'unauthenticated') {
    redirect('/');
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userName={session?.user?.name || 'ผู้ใช้'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-tbat-primary mx-auto mb-4" />
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !profile?.success) {
    return (
      <DashboardLayout userName={session?.user?.name || 'ผู้ใช้'}>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600 mb-4">
              {error || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-tbat-primary hover:text-tbat-secondary font-medium"
            >
              โหลดใหม่
            </button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const { user } = profile;
  const latestExamCode = user.examCodes[0]; // Most recent exam code

  // No exam code state
  if (!latestExamCode) {
    return (
      <DashboardLayout userName={user.thaiName}>
        <Card className="border-yellow-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-700 mb-2">ไม่พบรหัสสอบ</h3>
            <p className="text-yellow-600 mb-4">
              คุณยังไม่มีรหัสสอบ กรุณาลงทะเบียนสอบก่อน
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={user.thaiName}>
      <div className="space-y-6">
        {/* Registration Information */}
        <RegistrationInfo user={user} />

        {/* Exam Code and Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExamCodeDisplay examCode={latestExamCode} />
          <ExamInfoPanel examCode={latestExamCode} />
        </div>

        {/* Hidden print-only content */}
        <div className="hidden">
          <PrintRegistration user={user} examCode={latestExamCode} />
        </div>
      </div>
    </DashboardLayout>
  );
}
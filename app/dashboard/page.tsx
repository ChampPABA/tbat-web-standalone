"use client";

import React, { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/useUserProfile';

// Lazy load heavy components
const DashboardLayout = React.lazy(() => import('@/components/dashboard/dashboard-layout'));
const RegistrationInfo = React.lazy(() => import('@/components/dashboard/registration-info'));
const ExamCodeDisplay = React.lazy(() => import('@/components/dashboard/exam-code-display'));
const ExamInfoPanel = React.lazy(() => import('@/components/dashboard/exam-info-panel'));
const PrintRegistration = React.lazy(() => import('@/components/dashboard/print-registration'));

// Inline icons to reduce icon bundle size
const LoaderIcon = () => (
  <svg className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AlertIcon = () => (
  <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const LoadingFallback = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <LoaderIcon />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { profile, loading, error } = useUserProfile();

  // Show loading with minimal component
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingFallback message="กำลังตรวจสอบสถานะการเข้าสู่ระบบ..." />
      </div>
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
      <div className="min-h-screen bg-gray-50">
        <LoadingFallback message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  // Error state with inline components
  if (error || !profile?.success) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <div className="text-red-500">
                <AlertIcon />
              </div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-600 mb-4">
                {error || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                โหลดใหม่
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { user } = profile;
  const latestExamCode = user.examCodes[0]; // Most recent exam code

  // No exam code state
  if (!latestExamCode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-yellow-200">
            <CardContent className="p-6 text-center">
              <div className="text-yellow-500">
                <AlertIcon />
              </div>
              <h3 className="text-lg font-semibold text-yellow-700 mb-2">ไม่พบรหัสสอบ</h3>
              <p className="text-yellow-600 mb-4">
                คุณยังไม่มีรหัสสอบ กรุณาลงทะเบียนสอบก่อน
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard with lazy loaded components
  return (
    <Suspense fallback={<LoadingFallback message="กำลังโหลดข้อมูลผู้ใช้..." />}>
      <DashboardLayout userName={user.thaiName}>
        <div className="space-y-6">
          {/* Registration Information */}
          <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" />}>
            <RegistrationInfo user={user} />
          </Suspense>

          {/* Exam Code and Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div className="h-48 bg-gray-100 rounded animate-pulse" />}>
              <ExamCodeDisplay examCode={latestExamCode} />
            </Suspense>
            <Suspense fallback={<div className="h-48 bg-gray-100 rounded animate-pulse" />}>
              <ExamInfoPanel examCode={latestExamCode} />
            </Suspense>
          </div>

          {/* Hidden print-only content */}
          <div className="hidden">
            <Suspense fallback={null}>
              <PrintRegistration user={user} examCode={latestExamCode} />
            </Suspense>
          </div>
        </div>
      </DashboardLayout>
    </Suspense>
  );
}
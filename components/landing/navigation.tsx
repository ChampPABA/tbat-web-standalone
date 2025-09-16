"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { LoginModal } from '@/components/auth/login-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
// Inline SVG icons to reduce bundle size
const ChevronDownIcon = () => (
  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);
const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const LogOutIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const HomeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
import { toast } from 'sonner';

interface NavigationProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
}

export default function Navigation({ onRegisterClick, onLoginClick }: NavigationProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleRegisterClick = () => {
    try {
      if (onRegisterClick) {
        onRegisterClick();
      } else {
        // Use Link component instead of router.push to avoid prefetch issues
        window.location.href = '/register';
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to regular navigation
      window.location.href = '/register';
    }
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (userData: any) => {
    setIsLoginModalOpen(false);
    // Use user data from AuthProvider context instead of callback parameter
    toast.success("เข้าสู่ระบบสำเร็จ", {
      description: user?.thaiName ? `ยินดีต้อนรับ คุณ${user.thaiName}` : "ยินดีต้อนรับสู่ระบบ",
    });
  };

  const handleLoginError = (error: string) => {
    toast.error("เข้าสู่ระบบไม่สำเร็จ", {
      description: error,
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("ออกจากระบบสำเร็จ", {
        description: "ขอบคุณสำหรับการใช้บริการ",
      });
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถออกจากระบบได้",
      });
    }
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <nav
        className="bg-white shadow-sm sticky top-0 z-50"
        role="navigation"
        aria-label="หลัก"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center group"
              aria-label="TBAT Mock Exam หน้าหลัก"
            >
              <div className="flex items-center">
                <span className="text-3xl font-bold text-tbat-primary group-hover:text-tbat-secondary transition-colors duration-200">
                  TBAT
                </span>
              </div>
              <span className="text-2xl font-light text-gray-600 ml-2">
                Mock Exam
              </span>
            </Link>

            {/* Navigation Links - Always visible like in mockup */}
            <div className="flex items-center gap-6">
              <a
                href="#details"
                className="nav-link text-gray-700 hover:text-tbat-primary font-medium transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('details');
                }}
              >
                รายละเอียด
              </a>
              <a
                href="#features"
                className="nav-link text-gray-700 hover:text-tbat-primary font-medium transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                }}
              >
                คุณสมบัติ
              </a>
              <a
                href="#pricing"
                className="nav-link text-gray-700 hover:text-tbat-primary font-medium transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('pricing');
                }}
              >
                แพ็กเกจ
              </a>
              <a
                href="#faq"
                className="nav-link text-gray-700 hover:text-tbat-primary font-medium transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('faq');
                }}
              >
                คำถามที่พบบ่อย
              </a>
              <Link
                href="/contact"
                className="nav-link text-gray-700 hover:text-tbat-primary font-medium transition-colors duration-200"
              >
                ติดต่อเรา
              </Link>

              {/* Action Buttons */}
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : isAuthenticated && user ? (
                /* Authenticated User Menu (Option A - Dropdown) */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-tbat-primary border-tbat-primary hover:bg-tbat-primary hover:text-white font-medium"
                    >
                      <UserIcon />
                      สวัสดี คุณ{user.thaiName}
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-gray-50 shadow-2xl border-2 border-gray-400"
                    style={{ backgroundColor: '#f9fafb', opacity: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.thaiName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-tbat-primary font-medium">
                        {user.packageType === 'FREE' ? 'แพ็กเกจฟรี' : 'แพ็กเกจขั้นสูง'}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDashboardClick} className="cursor-pointer">
                      <HomeIcon />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOutIcon />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Not Authenticated - Show Login/Register Buttons */
                <>
                  <button
                    onClick={handleLoginClick}
                    className="px-3 py-2 text-tbat-primary border border-tbat-primary rounded-lg hover:bg-tbat-primary hover:text-white transition-colors duration-200 font-medium text-sm"
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    data-testid="nav-register-button"
                    className="px-4 py-2 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-colors duration-200 font-medium text-sm btn-hover-effect relative overflow-hidden"
                  >
                    สมัครสมาชิก
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </>
  );
}
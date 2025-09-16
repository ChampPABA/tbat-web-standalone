"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
import { ChevronDown, User, Settings, LogOut, Home, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface SiteNavigationProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onPrint?: () => void; // For dashboard page
  showPrintButton?: boolean; // Only show on dashboard
}

export default function SiteNavigation({
  onRegisterClick,
  onLoginClick,
  onPrint,
  showPrintButton = false
}: SiteNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isHomePage = pathname === '/';

  const scrollToSection = (sectionId: string) => {
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      // Navigate to home page with hash
      router.push(`/#${sectionId}`);
    }
  };

  const handleRegisterClick = () => {
    try {
      if (onRegisterClick) {
        onRegisterClick();
      } else {
        window.location.href = '/register';
      }
    } catch (error) {
      console.error('Navigation error:', error);
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
      // Always redirect to landing page after logout
      router.push('/');
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถออกจากระบบได้",
      });
    }
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
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

            {/* Navigation Links */}
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
                <div className="flex items-center gap-3">
                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-tbat-primary border-tbat-primary hover:bg-tbat-primary hover:text-white font-medium"
                      >
                        <User className="h-4 w-4 mr-2" />
                        สวัสดี คุณ{user.thaiName}
                        <ChevronDown className="h-4 w-4 ml-1" />
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
                          {user.packageType === 'FREE' ? 'Free' : 'Advanced'}
                        </p>
                      </div>
                      <DropdownMenuSeparator />

                      {pathname !== '/dashboard' && (
                        <>
                          <DropdownMenuItem onClick={handleDashboardClick} className="cursor-pointer">
                            <Home className="h-4 w-4 mr-2" />
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {showPrintButton && (
                        <>
                          <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
                            <Printer className="h-4 w-4 mr-2" />
                            พิมพ์รายละเอียด
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        ออกจากระบบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
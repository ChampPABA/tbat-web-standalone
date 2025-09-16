"use client";

import React from 'react';
import SiteNavigation from '@/components/shared/site-navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  onPrint?: () => void;
}

export default function DashboardLayout({ children, userName, onPrint }: DashboardLayoutProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      // Hide non-printable elements and use native print dialog
      const hideElements = document.querySelectorAll('.print\\:hidden, .no-print');
      const originalDisplay: string[] = [];

      // Store original display values and hide elements
      hideElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        originalDisplay[index] = htmlElement.style.display;
        htmlElement.style.display = 'none';
      });

      // Show only print content
      const printContent = document.querySelector('.print-content');
      if (printContent) {
        const htmlElement = printContent as HTMLElement;
        const originalStyles = {
          position: htmlElement.style.position,
          left: htmlElement.style.left,
          top: htmlElement.style.top,
          zIndex: htmlElement.style.zIndex,
          width: htmlElement.style.width,
          height: htmlElement.style.height
        };

        // Temporarily make print content full screen for better printing
        htmlElement.style.position = 'absolute';
        htmlElement.style.left = '0';
        htmlElement.style.top = '0';
        htmlElement.style.zIndex = '9999';
        htmlElement.style.width = '100%';
        htmlElement.style.height = 'auto';

        // Use native print dialog
        window.print();

        // Restore original styles after printing
        setTimeout(() => {
          // Restore print content styles
          htmlElement.style.position = originalStyles.position;
          htmlElement.style.left = originalStyles.left;
          htmlElement.style.top = originalStyles.top;
          htmlElement.style.zIndex = originalStyles.zIndex;
          htmlElement.style.width = originalStyles.width;
          htmlElement.style.height = originalStyles.height;

          // Restore hidden elements
          hideElements.forEach((element, index) => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.display = originalDisplay[index];
          });
        }, 100);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavigation
        showPrintButton={true}
        onPrint={handlePrint}
      />

      {/* Page Header */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">จัดการข้อมูลการสอบและรหัสสอบของคุณ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
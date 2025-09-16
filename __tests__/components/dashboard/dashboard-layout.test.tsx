import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

// Mock SiteNavigation component
jest.mock('@/components/shared/site-navigation', () => {
  return function MockSiteNavigation({ onPrint, showPrintButton }: { onPrint?: () => void; showPrintButton?: boolean }) {
    return (
      <nav data-testid="site-navigation">
        {showPrintButton && (
          <button onClick={onPrint} data-testid="print-button">
            พิมพ์รายละเอียด
          </button>
        )}
      </nav>
    );
  };
});

// Mock window.print
const mockPrint = jest.fn();
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true,
});

// Mock querySelector for print content
const mockPrintContent = document.createElement('div');
mockPrintContent.className = 'print-content';
mockPrintContent.innerHTML = '<div>Mock print content</div>';

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.querySelector = jest.fn().mockReturnValue(mockPrintContent);
    document.querySelectorAll = jest.fn().mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders dashboard layout with header and navigation', () => {
    render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้">
        <div>Dashboard content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('site-navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('จัดการข้อมูลการสอบและรหัสสอบของคุณ')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('shows print button in navigation', () => {
    render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้">
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('print-button')).toBeInTheDocument();
  });

  it('calls custom onPrint function when provided', () => {
    const mockOnPrint = jest.fn();
    render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้" onPrint={mockOnPrint}>
        <div>Content</div>
      </DashboardLayout>
    );

    fireEvent.click(screen.getByTestId('print-button'));
    expect(mockOnPrint).toHaveBeenCalledTimes(1);
  });

  it('handles native print when no custom onPrint provided', () => {
    render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้">
        <div className="print-content">Printable content</div>
      </DashboardLayout>
    );

    fireEvent.click(screen.getByTestId('print-button'));

    // Should call native window.print
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });

  it('handles missing print content gracefully', () => {
    document.querySelector = jest.fn().mockReturnValue(null);

    render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้">
        <div>Content</div>
      </DashboardLayout>
    );

    fireEvent.click(screen.getByTestId('print-button'));

    // Should not crash when print content is missing
    expect(mockPrint).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes for layout', () => {
    const { container } = render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้">
        <div>Content</div>
      </DashboardLayout>
    );

    const mainContainer = container.querySelector('.min-h-screen.bg-gray-50');
    expect(mainContainer).toBeInTheDocument();

    const header = container.querySelector('.bg-white.border-b.print\\:hidden');
    expect(header).toBeInTheDocument();

    const mainContent = container.querySelector('.max-w-6xl.mx-auto.px-4.py-8');
    expect(mainContent).toBeInTheDocument();
  });

  it('hides header in print mode with print:hidden class', () => {
    const { container } = render(
      <DashboardLayout userName="ทดสอบ ผู้ใช้">
        <div>Content</div>
      </DashboardLayout>
    );

    const header = container.querySelector('.print\\:hidden');
    expect(header).toBeInTheDocument();
  });
});
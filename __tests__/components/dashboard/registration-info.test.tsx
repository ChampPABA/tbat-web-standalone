import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegistrationInfo from '@/components/dashboard/registration-info';

describe('RegistrationInfo', () => {
  const mockUserFree = {
    id: '1',
    email: 'test@example.com',
    thaiName: 'ทดสอบ นักเรียน',
    nationalId: '1234567890123',
    phone: '0812345678',
    school: 'โรงเรียนทดสอบ',
    packageType: 'FREE' as const,
    pdpaConsent: true,
  };

  const mockUserAdvanced = {
    id: '2',
    email: 'premium@example.com',
    thaiName: 'พรีเมียม ผู้ใช้',
    nationalId: '9876543210987',
    phone: '0987654321',
    school: 'โรงเรียนพรีเมียม',
    packageType: 'ADVANCED' as const,
    pdpaConsent: true,
  };

  it('renders registration info with correct title', () => {
    render(<RegistrationInfo user={mockUserFree} />);

    expect(screen.getByText('ข้อมูลการลงทะเบียน')).toBeInTheDocument();
  });

  it('displays user personal information correctly', () => {
    render(<RegistrationInfo user={mockUserFree} />);

    expect(screen.getByText('ชื่อ-นามสกุล')).toBeInTheDocument();
    expect(screen.getByText('ทดสอบ นักเรียน')).toBeInTheDocument();

    expect(screen.getByText('เลขประจำตัวประชาชน')).toBeInTheDocument();
    expect(screen.getByText('1234567890123')).toBeInTheDocument();

    expect(screen.getByText('หมายเลขโทรศัพท์')).toBeInTheDocument();
    expect(screen.getByText('0812345678')).toBeInTheDocument();

    expect(screen.getByText('โรงเรียน')).toBeInTheDocument();
    expect(screen.getByText('โรงเรียนทดสอบ')).toBeInTheDocument();
  });

  it('displays FREE package type and payment status correctly', () => {
    render(<RegistrationInfo user={mockUserFree} />);

    expect(screen.getByText('แพ็กเกจ')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();

    expect(screen.getByText('สถานะการชำระเงิน')).toBeInTheDocument();
    expect(screen.getByText('ไม่ต้องชำระ')).toBeInTheDocument();
  });

  it('displays ADVANCED package type and payment status correctly', () => {
    render(<RegistrationInfo user={mockUserAdvanced} />);

    expect(screen.getByText('แพ็กเกจ')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();

    expect(screen.getByText('สถานะการชำระเงิน')).toBeInTheDocument();
    expect(screen.getByText('ชำระแล้ว')).toBeInTheDocument();
  });

  it('applies correct badge variants for FREE package', () => {
    const { container } = render(<RegistrationInfo user={mockUserFree} />);

    // Find badges by their text content
    const packageBadge = screen.getByText('Free').closest('.inline-flex');
    const paymentBadge = screen.getByText('ไม่ต้องชำระ').closest('.inline-flex');

    expect(packageBadge).toHaveClass('bg-secondary'); // secondary variant
    expect(paymentBadge).toHaveClass('border'); // outline variant
  });

  it('applies correct badge variants for ADVANCED package', () => {
    const { container } = render(<RegistrationInfo user={mockUserAdvanced} />);

    // Find badges by their text content
    const packageBadge = screen.getByText('Advanced').closest('.inline-flex');
    const paymentBadge = screen.getByText('ชำระแล้ว').closest('.inline-flex');

    expect(packageBadge).toHaveClass('bg-primary'); // default variant
    expect(paymentBadge).toHaveClass('bg-primary'); // default variant
  });

  it('applies monospace font to national ID', () => {
    render(<RegistrationInfo user={mockUserFree} />);

    const nationalIdElement = screen.getByText('1234567890123');
    expect(nationalIdElement).toHaveClass('font-mono');
  });

  it('displays icons for contact information', () => {
    const { container } = render(<RegistrationInfo user={mockUserFree} />);

    // Check for SVG icons (Lucide icons render as SVG)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);

    // Should have User, Phone, School, Package, and CreditCard icons
    expect(icons.length).toBe(5);
  });

  it('applies responsive grid layout', () => {
    const { container } = render(<RegistrationInfo user={mockUserFree} />);

    const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles Thai characters correctly', () => {
    const thaiUser = {
      ...mockUserFree,
      thaiName: 'สมชาย ใจดี',
      school: 'โรงเรียนวัดไผ่ใหญ่',
    };

    render(<RegistrationInfo user={thaiUser} />);

    expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument();
    expect(screen.getByText('โรงเรียนวัดไผ่ใหญ่')).toBeInTheDocument();
  });

  it('maintains consistent spacing and typography', () => {
    const { container } = render(<RegistrationInfo user={mockUserFree} />);

    // Check for proper spacing classes
    expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    expect(container.querySelector('.space-y-3')).toBeInTheDocument();
    expect(container.querySelector('.gap-4')).toBeInTheDocument();

    // Check for proper text styling
    const labels = container.querySelectorAll('.text-sm.font-medium.text-gray-600');
    expect(labels.length).toBe(6); // 6 field labels

    const values = container.querySelectorAll('.text-gray-900');
    expect(values.length).toBeGreaterThan(0);
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExamInfoPanel from '@/components/dashboard/exam-info-panel';

describe('ExamInfoPanel', () => {
  const mockExamCodeMorning = {
    sessionTime: '09:00-12:00' as const,
  };

  const mockExamCodeAfternoon = {
    sessionTime: '13:00-16:00' as const,
  };

  it('renders exam info panel with correct title', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    expect(screen.getByText('ข้อมูลการสอบ')).toBeInTheDocument();
  });

  it('displays fixed exam date correctly', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    expect(screen.getByText('วันที่สอบ')).toBeInTheDocument();
    expect(screen.getByText('27 กันยายน 2568')).toBeInTheDocument();
  });

  it('displays morning session time correctly', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    expect(screen.getByText('เวลาสอบ')).toBeInTheDocument();
    expect(screen.getByText('เช้า 09:00-12:00')).toBeInTheDocument();
  });

  it('displays afternoon session time correctly', () => {
    render(<ExamInfoPanel examCode={mockExamCodeAfternoon} />);

    expect(screen.getByText('เวลาสอบ')).toBeInTheDocument();
    expect(screen.getByText('บ่าย 13:00-16:00')).toBeInTheDocument();
  });

  it('displays exam location information', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    expect(screen.getByText('สถานที่สอบ')).toBeInTheDocument();
    expect(screen.getByText('สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่')).toBeInTheDocument();
    expect(screen.getByText('ห้องทองกวาว 1 และห้องทองกวาว 2')).toBeInTheDocument();
  });

  it('includes Google Maps link with correct attributes', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    const mapsLink = screen.getByRole('link', { name: 'ดูแผนที่ Google Maps' });
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute('href', 'https://maps.app.goo.gl/6crQRkv2eZzPwoXP8');
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays arrival instruction note', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    expect(screen.getByText(/💡/)).toBeInTheDocument();
    expect(screen.getByText('หมายเหตุ:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/กรุณามาถึงก่อนเวลาสอบ 45 นาที/)).toBeInTheDocument();
    expect(screen.getByText(/เพื่อเช็คอิน รับเอกสาร และเตรียมตัว/)).toBeInTheDocument();
  });

  it('applies correct styling and color schemes', () => {
    const { container } = render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    // Check for date section styling (TBAT primary colors)
    const dateSection = container.querySelector('.bg-tbat-primary\\/5.border-tbat-primary\\/20');
    expect(dateSection).toBeInTheDocument();

    // Check for time section styling (TBAT secondary colors)
    const timeSection = container.querySelector('.bg-tbat-secondary\\/5.border-tbat-secondary\\/20');
    expect(timeSection).toBeInTheDocument();

    // Check for location section styling (gray colors)
    const locationSection = container.querySelector('.bg-gray-50.border-gray-200');
    expect(locationSection).toBeInTheDocument();
  });

  it('displays icons for different sections', () => {
    const { container } = render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    // Should have Calendar icons, Clock icon, and MapPin icon
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);

    // Should have multiple calendar icons, one clock icon, and one map pin icon
    expect(icons.length).toBe(4); // Header calendar + date calendar + clock + map pin
  });

  it('applies responsive layout and spacing', () => {
    const { container } = render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    // Check for proper spacing classes
    expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    expect(container.querySelector('.space-y-3')).toBeInTheDocument();

    // Check for padding and margin classes
    expect(container.querySelector('.p-3')).toBeInTheDocument();

    // Check for rounded corners
    const roundedElements = container.querySelectorAll('.rounded-lg');
    expect(roundedElements.length).toBeGreaterThan(0);
  });

  it('maintains consistent text hierarchy', () => {
    const { container } = render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    // Check for different text sizes and weights
    expect(container.querySelector('.text-sm.font-medium')).toBeInTheDocument();
    expect(container.querySelector('.font-medium')).toBeInTheDocument();
    expect(container.querySelector('.text-xs')).toBeInTheDocument();
  });

  it('handles Google Maps link interaction', () => {
    render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    const mapsLink = screen.getByRole('link', { name: 'ดูแผนที่ Google Maps' });
    expect(mapsLink).toHaveClass('hover:underline');
    expect(mapsLink).toHaveClass('text-tbat-primary');
  });

  it('uses proper color scheme for badges', () => {
    const { container } = render(<ExamInfoPanel examCode={mockExamCodeMorning} />);

    // Check date badge colors
    const dateBadge = screen.getByText('27 กันยายน 2568').closest('.inline-flex');
    expect(dateBadge).toHaveClass('bg-tbat-primary/10', 'text-tbat-primary', 'border-tbat-primary/30');

    // Check time badge colors
    const timeBadge = screen.getByText('เช้า 09:00-12:00').closest('.inline-flex');
    expect(timeBadge).toHaveClass('bg-tbat-secondary/10', 'text-tbat-secondary', 'border-tbat-secondary/30');
  });
});
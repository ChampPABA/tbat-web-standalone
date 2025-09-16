import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExamCodeDisplay from '@/components/dashboard/exam-code-display';

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe('ExamCodeDisplay', () => {
  const mockExamCodeFree = {
    code: 'FREE-A1B2-BIOLOGY',
    packageType: 'FREE' as const,
    subject: 'BIOLOGY' as const,
    sessionTime: '09:00-12:00' as const,
    createdAt: new Date('2025-09-15T10:00:00Z'),
    usedAt: null,
  };

  const mockExamCodeAdvanced = {
    code: 'ADV-X9Y8',
    packageType: 'ADVANCED' as const,
    subject: null,
    sessionTime: '13:00-16:00' as const,
    createdAt: new Date('2025-09-15T10:00:00Z'),
    usedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  it('renders exam code display with correct title', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    expect(screen.getByText('รหัสสอบของคุณ')).toBeInTheDocument();
  });

  it('displays exam code correctly', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    expect(screen.getByText('FREE-A1B2-BIOLOGY')).toBeInTheDocument();
    expect(screen.getByText('FREE-A1B2-BIOLOGY')).toHaveClass('text-2xl', 'font-mono', 'font-bold');
  });

  it('displays correct subject label for FREE package', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    expect(screen.getByText('ชีววิทยา')).toBeInTheDocument();
  });

  it('displays correct subject label for ADVANCED package (ทุกวิชา)', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeAdvanced} />);

    expect(screen.getByText('ทุกวิชา')).toBeInTheDocument();
  });

  it('displays correct session time labels', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);
    expect(screen.getByText('เช้า 09:00-12:00')).toBeInTheDocument();

    render(<ExamCodeDisplay examCode={mockExamCodeAdvanced} />);
    expect(screen.getByText('บ่าย 13:00-16:00')).toBeInTheDocument();
  });

  it('displays warning message about keeping exam code safe', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    expect(screen.getByText('⚠️ กรุณาเก็บรหัสสอบนี้ไว้ให้ดี คุณจะต้องใช้รหัสนี้ในการเข้าสอบ')).toBeInTheDocument();
  });

  it('shows copy button with correct initial text', () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    const copyButton = screen.getByRole('button', { name: /คัดลอกรหัสสอบ/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('copies exam code to clipboard when copy button is clicked', async () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    const copyButton = screen.getByRole('button', { name: /คัดลอกรหัสสอบ/i });
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('FREE-A1B2-BIOLOGY');
  });

  it('shows success state after copying', async () => {
    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    const copyButton = screen.getByRole('button', { name: /คัดลอกรหัสสอบ/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('คัดลอกแล้ว')).toBeInTheDocument();
    });
  });

  it('resets copy state after 2 seconds', async () => {
    jest.useFakeTimers();

    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    const copyButton = screen.getByRole('button', { name: /คัดลอกรหัสสอบ/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('คัดลอกแล้ว')).toBeInTheDocument();
    });

    // Fast forward 2 seconds
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('คัดลอกรหัสสอบ')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('handles clipboard write failure gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockWriteText.mockRejectedValue(new Error('Clipboard not available'));

    render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    const copyButton = screen.getByRole('button', { name: /คัดลอกรหัสสอบ/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('renders all subject types correctly', () => {
    const chemistryCode = { ...mockExamCodeFree, subject: 'CHEMISTRY' as const };
    const physicsCode = { ...mockExamCodeFree, subject: 'PHYSICS' as const };

    const { rerender } = render(<ExamCodeDisplay examCode={chemistryCode} />);
    expect(screen.getByText('เคมี')).toBeInTheDocument();

    rerender(<ExamCodeDisplay examCode={physicsCode} />);
    expect(screen.getByText('ฟิสิกส์')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<ExamCodeDisplay examCode={mockExamCodeFree} />);

    // Check card structure
    expect(container.querySelector('.bg-gray-50.p-4.rounded-lg')).toBeInTheDocument();

    // Check exam code styling
    const examCodeElement = screen.getByText('FREE-A1B2-BIOLOGY');
    expect(examCodeElement).toHaveClass('text-2xl', 'font-mono', 'font-bold', 'text-tbat-primary');

    // Check button styling
    const copyButton = screen.getByRole('button', { name: /คัดลอกรหัสสอบ/i });
    expect(copyButton).toHaveClass('bg-tbat-primary', 'hover:bg-tbat-secondary');
  });
});
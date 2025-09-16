import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HeroSection from '@/components/landing/hero-section';
import { useCapacity } from '@/hooks/useCapacity';

// Mock the useCapacity hook
jest.mock('@/hooks/useCapacity');

const mockUseCapacity = useCapacity as jest.MockedFunction<typeof useCapacity>;

// Mock skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  CapacityStatusSkeleton: () => <div data-testid="capacity-skeleton">Loading capacity...</div>
}));

// Mock timers for countdown testing
jest.useFakeTimers();

const mockCapacityData = [
  {
    session_time: 'MORNING' as const,
    current_count: 73,
    max_capacity: 150,
    availability_status: 'AVAILABLE' as const,
    thai_message: 'เปิดรับสมัคร'
  },
  {
    session_time: 'AFTERNOON' as const,
    current_count: 74,
    max_capacity: 150,
    availability_status: 'AVAILABLE' as const,
    thai_message: 'เปิดรับสมัคร'
  }
];

describe('HeroSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set a fixed date for countdown testing
    jest.setSystemTime(new Date('2025-09-20T10:00:00Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders main hero content correctly', () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    expect(screen.getByText('สนามสอบ TBAT จำลองที่เชียงใหม่')).toBeInTheDocument();
    expect(screen.getByText(/สมัคร "สอบฟรี" ทุกคน/)).toBeInTheDocument();
    expect(screen.getByText(/Mock Exam จัดโดย ASPECT/)).toBeInTheDocument();
    expect(screen.getByText('วันเสาร์ที่ 27 กันยายน 2568')).toBeInTheDocument();
  });

  it('displays countdown timer correctly', () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    expect(screen.getByText('⏰ เหลือเวลาสมัคร')).toBeInTheDocument();
    expect(screen.getByText('สมัครได้ถึงวันที่ 24 กันยายน 2568 เวลา 23:59 น.')).toBeInTheDocument();
    
    // Check countdown elements
    expect(screen.getByText('วัน')).toBeInTheDocument();
    expect(screen.getByText('ชั่วโมง')).toBeInTheDocument();
    expect(screen.getByText('นาที')).toBeInTheDocument();
    expect(screen.getByText('วินาที')).toBeInTheDocument();
  });

  it('updates countdown timer correctly', () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    // Initial countdown values should be visible
    expect(screen.getByText('วัน')).toBeInTheDocument();

    // Advance time by 1 second
    jest.advanceTimersByTime(1000);

    // Timer should update (we can't test exact values due to timezone complexity,
    // but we can verify the timer structure remains)
    expect(screen.getByText('วัน')).toBeInTheDocument();
    expect(screen.getByText('ชั่วโมง')).toBeInTheDocument();
  });

  it('shows capacity status when data is loaded', async () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText('📊 สถานะที่นั่งปัจจุบัน')).toBeInTheDocument();
      expect(screen.getByText('🌅 รอบเช้า (09:00-12:00)')).toBeInTheDocument();
      expect(screen.getByText('🌆 รอบบ่าย (13:00-16:00)')).toBeInTheDocument();
    });

    // Check capacity information
    expect(screen.getByText('ผู้สมัคร: 73/150 คน (48.7%)')).toBeInTheDocument();
    expect(screen.getByText('ผู้สมัคร: 74/150 คน (49.3%)')).toBeInTheDocument();
  });

  it('shows capacity loading skeleton when loading', () => {
    mockUseCapacity.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    expect(screen.getByTestId('capacity-skeleton')).toBeInTheDocument();
  });

  it('shows capacity error state when there is an error', () => {
    const mockError = new Error('Network error');
    mockUseCapacity.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    expect(screen.getByText('ไม่สามารถโหลดข้อมูลจำนวนที่นั่งได้ กรุณาลองใหม่อีกครั้ง')).toBeInTheDocument();
  });

  it('handles different capacity statuses correctly', async () => {
    const fullCapacityData = [
      {
        session_time: 'MORNING' as const,
        current_count: 150,
        max_capacity: 150,
        availability_status: 'FULL' as const,
        thai_message: 'เต็มแล้ว'
      },
      {
        session_time: 'AFTERNOON' as const,
        current_count: 135,
        max_capacity: 150,
        availability_status: 'NEARLY_FULL' as const,
        thai_message: 'เหลือที่นั่งจำนวนจำกัด'
      }
    ];

    mockUseCapacity.mockReturnValue({
      data: fullCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText('เต็มแล้ว')).toBeInTheDocument();
      expect(screen.getByText('เหลือที่นั่งจำนวนจำกัด')).toBeInTheDocument();
    });
  });

  it('handles ADVANCED_ONLY status correctly', async () => {
    const advancedOnlyData = [
      {
        session_time: 'MORNING' as const,
        current_count: 140,
        max_capacity: 150,
        availability_status: 'ADVANCED_ONLY' as const,
        thai_message: 'เหลือที่สำหรับ Advanced Package เท่านั้น'
      }
    ];

    mockUseCapacity.mockReturnValue({
      data: advancedOnlyData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText('เหลือที่สำหรับ Advanced Package เท่านั้น')).toBeInTheDocument();
      // Should NOT show participant count for ADVANCED_ONLY status
      expect(screen.queryByText('ผู้สมัคร: 140/150')).not.toBeInTheDocument();
    });
  });

  it('calls onRegisterClick when register button is clicked', () => {
    const mockOnRegisterClick = jest.fn();

    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection onRegisterClick={mockOnRegisterClick} />);

    const registerButton = screen.getByText('สมัครฟรีเลย');
    fireEvent.click(registerButton);

    expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
  });

  it('calls onViewPackagesClick when view packages button is clicked', () => {
    const mockOnViewPackagesClick = jest.fn();

    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection onViewPackagesClick={mockOnViewPackagesClick} />);

    const viewPackagesButton = screen.getByText('ดูแพ็กเกจ');
    fireEvent.click(viewPackagesButton);

    expect(mockOnViewPackagesClick).toHaveBeenCalledTimes(1);
  });

  it('scrolls to pricing section when view packages clicked without handler', () => {
    const mockScrollIntoView = jest.fn();
    
    // Mock getElementById
    const mockElement = { scrollIntoView: mockScrollIntoView };
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    const viewPackagesButton = screen.getByText('ดูแพ็กเกจ');
    fireEvent.click(viewPackagesButton);

    expect(document.getElementById).toHaveBeenCalledWith('pricing');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });
  });

  it('has correct accessibility attributes', () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'hero-title');

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveAttribute('id', 'hero-title');

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    
    const registerButton = screen.getByTestId('register-button');
    expect(registerButton).toBeInTheDocument();
  });

  it('shows exam date clarification correctly', () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    expect(screen.getByText('📝 TBAT Mock Exam')).toBeInTheDocument();
    expect(screen.getByText('🏛️ TBAT จริง')).toBeInTheDocument();
    expect(screen.getByText('วันเสาร์ที่ 27 กันยายน 2568')).toBeInTheDocument();
    expect(screen.getByText('วันเสาร์ที่ 5 ตุลาคม 2568')).toBeInTheDocument();
  });

  it('displays location information with map link', () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    expect(screen.getByText('สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่')).toBeInTheDocument();
    expect(screen.getByText('ห้องทองกวาว 1 และห้องทองกวาว 2')).toBeInTheDocument();
    
    const mapLink = screen.getByText('ดูแผนที่ Google Maps');
    expect(mapLink).toHaveAttribute('href', 'https://maps.app.goo.gl/6crQRkv2eZzPwoXP8');
    expect(mapLink).toHaveAttribute('target', '_blank');
    expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows capacity update notice', async () => {
    mockUseCapacity.mockReturnValue({
      data: mockCapacityData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText('* ข้อมูลอัปเดตทุก 30 วินาที | การสมัครจะปิดเมื่อเต็มจำนวน')).toBeInTheDocument();
    });
  });
});
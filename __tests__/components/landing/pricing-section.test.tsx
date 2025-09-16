import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PricingSection from '@/components/landing/pricing-section';
import { usePackages } from '@/hooks/usePackages';

// Mock the usePackages hook
jest.mock('@/hooks/usePackages');

const mockUsePackages = usePackages as jest.MockedFunction<typeof usePackages>;

// Mock skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  PricingCardSkeleton: () => <div data-testid="pricing-skeleton">Loading...</div>
}));

const mockPackageData = [
  {
    type: 'FREE' as const,
    name: 'Free Package',
    price: 0,
    features: ['เลือกสอบได้ 1 วิชา', 'ผลสอบพื้นฐาน'],
    is_active: true,
    description: 'ทดลองฟรี',
    badge: 'เปิดรับสมัคร',
    badgeColor: 'green',
    features_detailed: [
      { text: 'เลือกสอบได้ 1 วิชา', included: true },
      { text: 'ผลสอบพื้นฐาน', included: true },
      { text: 'การวิเคราะห์แบบจำกัด', included: false }
    ],
    availability: {
      status: 'available' as const,
      statusText: 'เปิดรับสมัคร',
      maxCapacity: 300,
      currentCount: 147
    },
    buttonText: 'เลือกแพ็กเกจฟรี',
    buttonStyle: 'outline' as const,
    footerNote: 'เหมาะสำหรับผู้ที่ต้องการทดลองสอบเบื้องต้น',
    limitations: ['จำกัด 300 ที่']
  },
  {
    type: 'ADVANCED' as const,
    name: 'Advanced Package',
    price: 690,
    features: ['ครบทั้ง 3 วิชา', 'รายงานการวิเคราะห์แบบละเอียด'],
    is_active: true,
    description: 'สิทธิพิเศษ สมัคร 3 วันแรกเท่านั้น',
    badge: 'แนะนำ',
    badgeColor: 'yellow',
    features_detailed: [
      { text: 'ครบทั้ง 3 วิชา (ชีวะ เคมี ฟิสิกส์)', included: true, highlight: true },
      { text: 'รายงานการวิเคราะห์แบบละเอียด', included: true }
    ],
    availability: {
      status: 'limited' as const,
      statusText: 'จำนวนจำกัด'
    },
    buttonText: 'อัพเกรดเลย',
    buttonStyle: 'solid' as const,
    footerNote: 'เหมาะสำหรับผู้ที่ต้องการเตรียมตัวอย่างจริงจัง'
  }
];

describe('PricingSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading skeleton when data is loading', () => {
    mockUsePackages.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    expect(screen.getByText('กำลังโหลดข้อมูลแพ็กเกจ...')).toBeInTheDocument();
    expect(screen.getAllByTestId('pricing-skeleton')).toHaveLength(2);
  });

  it('shows error state when there is an error', () => {
    const mockError = new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    const mockRefetch = jest.fn();

    mockUsePackages.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      refetch: mockRefetch
    });

    render(<PricingSection />);

    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('เกิดข้อผิดพลาดในการโหลดข้อมูล')).toBeInTheDocument();
    
    // Test retry button
    const retryButton = screen.getByText('ลองใหม่อีกครั้ง');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders package data correctly', async () => {
    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      expect(screen.getByText('Free Package')).toBeInTheDocument();
      expect(screen.getByText('Advanced Package')).toBeInTheDocument();
    });

    // Check pricing display
    expect(screen.getByText('฿0')).toBeInTheDocument();
    expect(screen.getByText('฿690')).toBeInTheDocument();

    // Check features
    expect(screen.getByText('เลือกสอบได้ 1 วิชา')).toBeInTheDocument();
    expect(screen.getByText('ครบทั้ง 3 วิชา (ชีวะ เคมี ฟิสิกส์)')).toBeInTheDocument();

    // Check availability status
    expect(screen.getByText('เปิดรับสมัคร')).toBeInTheDocument();
    expect(screen.getByText('จำนวนจำกัด')).toBeInTheDocument();
  });

  it('handles package selection correctly', async () => {
    const mockOnSelectPackage = jest.fn();

    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection onSelectPackage={mockOnSelectPackage} />);

    await waitFor(() => {
      expect(screen.getByText('เลือกแพ็กเกจฟรี')).toBeInTheDocument();
    });

    // Click Free package button
    const freeButton = screen.getByText('เลือกแพ็กเกจฟรี');
    fireEvent.click(freeButton);
    expect(mockOnSelectPackage).toHaveBeenCalledWith('FREE');

    // Click Advanced package button
    const advancedButton = screen.getByText('อัพเกรดเลย');
    fireEvent.click(advancedButton);
    expect(mockOnSelectPackage).toHaveBeenCalledWith('ADVANCED');
  });

  it('shows appropriate styling for different package types', async () => {
    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      const freePackageContainer = screen.getByText('Free Package').closest('div');
      const advancedPackageContainer = screen.getByText('Advanced Package').closest('div');

      // Free package should have border styling
      expect(freePackageContainer).toHaveClass('border-2', 'border-gray-200');
      
      // Advanced package should have gradient styling
      expect(advancedPackageContainer).toHaveClass('bg-gradient-to-br');
    });
  });

  it('displays badges correctly', async () => {
    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      expect(screen.getByText('เปิดรับสมัคร')).toBeInTheDocument();
      expect(screen.getByText('แนะนำ')).toBeInTheDocument();
    });
  });

  it('shows features with correct included/excluded styling', async () => {
    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      // Should show checkmarks for included features
      const includedFeatures = screen.getAllByText('✓');
      expect(includedFeatures.length).toBeGreaterThan(0);

      // Should show dashes for excluded features
      const excludedFeatures = screen.getAllByText('–');
      expect(excludedFeatures.length).toBeGreaterThan(0);
    });
  });

  it('handles full capacity state correctly', async () => {
    const fullPackageData = [...mockPackageData];
    (fullPackageData[0] as any).availability = {
      status: 'limited' as const,
      statusText: 'เต็มแล้ว'
    };

    mockUsePackages.mockReturnValue({
      data: fullPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      const fullButton = screen.getByText('เต็มแล้ว');
      expect(fullButton).toBeDisabled();
      expect(fullButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  it('displays footer notes and limitations correctly', async () => {
    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      expect(screen.getByText('เหมาะสำหรับผู้ที่ต้องการทดลองสอบเบื้องต้น')).toBeInTheDocument();
      expect(screen.getByText('เหมาะสำหรับผู้ที่ต้องการเตรียมตัวอย่างจริงจัง')).toBeInTheDocument();
      expect(screen.getByText('จำกัด 300 ที่')).toBeInTheDocument();
    });
  });

  it('shows default alert when no onSelectPackage handler provided', async () => {
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      const freeButton = screen.getByText('เลือกแพ็กเกจฟรี');
      fireEvent.click(freeButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('เลือก Package: FREE')
      );
    });

    mockAlert.mockRestore();
  });

  it('has correct accessibility attributes', async () => {
    mockUsePackages.mockReturnValue({
      data: mockPackageData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PricingSection />);

    await waitFor(() => {
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('id', 'pricing');
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });
});
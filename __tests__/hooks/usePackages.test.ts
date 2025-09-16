import { renderHook, waitFor } from '@testing-library/react';
import { usePackages } from '@/hooks/usePackages';
import { mockPackages } from '@/lib/mock-data';

// Mock the mock-data module
jest.mock('@/lib/mock-data', () => ({
  mockPackages: [
    {
      type: 'FREE',
      name: 'Free Package',
      price: 0,
      description: 'ทดลองฟรี',
      badge: 'เปิดรับสมัคร',
      badgeColor: 'green',
      features: [
        { text: 'เลือกสอบได้ 1 วิชา', included: true },
        { text: 'ผลสอบพื้นฐาน', included: true },
      ],
      availability: {
        status: 'available',
        statusText: 'เปิดรับสมัคร',
        maxCapacity: 300,
        currentCount: 147
      },
      buttonText: 'เลือกแพ็กเกจฟรี',
      buttonStyle: 'outline',
      footerNote: 'เหมาะสำหรับผู้ที่ต้องการทดลองสอบเบื้องต้น',
    },
    {
      type: 'ADVANCED',
      name: 'Advanced Package',
      price: 690,
      description: 'สิทธิพิเศษ สมัคร 3 วันแรกเท่านั้น',
      badge: 'แนะนำ',
      badgeColor: 'yellow',
      features: [
        { text: 'ครบทั้ง 3 วิชา (ชีวะ เคมี ฟิสิกส์)', included: true },
        { text: 'รายงานการวิเคราะห์แบบละเอียด', included: true },
      ],
      availability: {
        status: 'limited',
        statusText: 'จำนวนจำกัด',
      },
      buttonText: 'อัพเกรดเลย',
      buttonStyle: 'solid',
      footerNote: 'เหมาะสำหรับผู้ที่ต้องการเตรียมตัวอย่างจริงจัง'
    }
  ]
}));

describe('usePackages Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Math.random for consistent testing
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch packages successfully', async () => {
    const { result } = renderHook(() => usePackages());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for the hook to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that data is loaded correctly
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].type).toBe('FREE');
    expect(result.current.data?.[1].type).toBe('ADVANCED');
    expect(result.current.error).toBeNull();
  });

  it('should handle errors correctly', async () => {
    // Mock Math.random to always trigger errors
    jest.spyOn(Math, 'random').mockReturnValue(0.01); // Less than 0.05 = error

    const { result } = renderHook(() => usePackages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('เกิดข้อผิดพลาดในการโหลดข้อมูลแพ็กเกจ');
  });

  it('should allow refetching data', async () => {
    const { result } = renderHook(() => usePackages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch data
    expect(typeof result.current.refetch).toBe('function');
    
    // Call refetch
    result.current.refetch();
    
    // Should be loading again
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should respect enabled option', () => {
    const { result } = renderHook(() => usePackages({ enabled: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => usePackages({ onSuccess }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onSuccess).toHaveBeenCalledWith(expect.any(Array));
  });

  it('should call onError callback', async () => {
    // Mock Math.random to always trigger errors
    jest.spyOn(Math, 'random').mockReturnValue(0.01);
    
    const onError = jest.fn();
    const { result } = renderHook(() => usePackages({ onError }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should transform mock data to API format correctly', async () => {
    const { result } = renderHook(() => usePackages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const freePackage = result.current.data?.find(pkg => pkg.type === 'FREE');
    expect(freePackage).toBeDefined();
    expect(freePackage?.name).toBe('Free Package');
    expect(freePackage?.price).toBe(0);
    expect(freePackage?.features).toEqual(['เลือกสอบได้ 1 วิชา', 'ผลสอบพื้นฐาน']);
    expect(freePackage?.is_active).toBe(true);

    const advancedPackage = result.current.data?.find(pkg => pkg.type === 'ADVANCED');
    expect(advancedPackage).toBeDefined();
    expect(advancedPackage?.name).toBe('Advanced Package');
    expect(advancedPackage?.price).toBe(690);
  });

  it('should handle retry mechanism with exponential backoff', async () => {
    // Mock Math.random to trigger errors for first few attempts
    let callCount = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount <= 2 ? 0.01 : 0.5; // First 2 calls error, then success
    });

    const retryConfig = {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2
    };

    const { result } = renderHook(() => usePackages({ retry: retryConfig }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 5000 });

    // Should eventually succeed after retries
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  }, 10000);
});
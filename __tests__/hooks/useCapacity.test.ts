import { renderHook, waitFor } from '@testing-library/react';
import { useCapacity } from '@/hooks/useCapacity';

// Mock the mock-data module
jest.mock('@/lib/mock-data', () => ({
  mockSessionCapacity: [
    {
      session_time: '09:00-12:00',
      current_count: 73,
      max_capacity: 150,
      availability: 'available'
    },
    {
      session_time: '13:00-16:00',
      current_count: 74,
      max_capacity: 150,
      availability: 'available'
    }
  ],
  getAvailabilityStatus: jest.fn((current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 95) return 'full';
    if (percentage >= 80) return 'limited';
    return 'available';
  })
}));

// Mock timers for testing auto-refresh
jest.useFakeTimers();

describe('useCapacity Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.runOnlyPendingTimers();
  });

  it('should fetch capacity data successfully', async () => {
    const { result } = renderHook(() => useCapacity());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].session_time).toBe('MORNING');
    expect(result.current.data?.[1].session_time).toBe('AFTERNOON');
    expect(result.current.error).toBeNull();
  });

  it('should transform session times correctly', async () => {
    const { result } = renderHook(() => useCapacity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const morningSession = result.current.data?.find(s => s.session_time === 'MORNING');
    const afternoonSession = result.current.data?.find(s => s.session_time === 'AFTERNOON');

    expect(morningSession).toBeDefined();
    expect(afternoonSession).toBeDefined();
    expect(morningSession?.current_count).toBeGreaterThanOrEqual(68); // 73 ± 5
    expect(morningSession?.current_count).toBeLessThanOrEqual(78);
    expect(morningSession?.max_capacity).toBe(150);
  });

  it('should set ADVANCED_ONLY status when nearly full', async () => {
    // Mock high capacity usage
    const mockData = require('@/lib/mock-data');
    mockData.mockSessionCapacity = [
      {
        session_time: '09:00-12:00',
        current_count: 140, // 93.3% full
        max_capacity: 150,
        availability: 'limited'
      }
    ];

    const { result } = renderHook(() => useCapacity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const session = result.current.data?.[0];
    expect(session?.availability_status).toBe('ADVANCED_ONLY');
    expect(session?.thai_message).toBe('เหลือที่สำหรับ Advanced Package เท่านั้น');
  });

  it('should provide appropriate Thai messages', async () => {
    const { result } = renderHook(() => useCapacity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const session = result.current.data?.[0];
    expect(session?.thai_message).toMatch(/^(เปิดรับสมัคร|เหลือที่นั่งจำนวนจำกัด|เต็มแล้ว|เหลือที่สำหรับ Advanced Package เท่านั้น)$/);
  });

  it('should handle errors correctly', async () => {
    // Mock Math.random to always trigger errors
    jest.spyOn(Math, 'random').mockReturnValue(0.01);

    const { result } = renderHook(() => useCapacity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('เกิดข้อผิดพลาดในการโหลดข้อมูลจำนวนที่นั่ง');
  });

  it('should auto-refresh every 30 seconds', async () => {
    const { result } = renderHook(() => useCapacity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get initial data
    const initialData = result.current.data;
    expect(initialData).not.toBeNull();

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      // Data should be refreshed (might be different due to variance)
      expect(result.current.data).not.toBeNull();
    });
  });

  it('should respect custom refetch interval', async () => {
    const customInterval = 10000; // 10 seconds
    const { result } = renderHook(() => useCapacity({ 
      refetchInterval: customInterval 
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fast-forward 10 seconds
    jest.advanceTimersByTime(customInterval);

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });
  });

  it('should not auto-refresh when disabled', async () => {
    const { result } = renderHook(() => useCapacity({ 
      refetchInterval: 0 
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialData = result.current.data;

    // Fast-forward 60 seconds
    jest.advanceTimersByTime(60000);

    // Data should be the same since auto-refresh is disabled
    expect(result.current.data).toBe(initialData);
  });

  it('should not auto-refresh when loading', async () => {
    let resolvePromise: (value: any) => void;
    const slowPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    // Mock a slow response
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    
    const { result } = renderHook(() => useCapacity());

    // Verify it's loading
    expect(result.current.loading).toBe(true);

    // Fast-forward the auto-refresh interval
    jest.advanceTimersByTime(30000);

    // Should still be loading and not trigger another request
    expect(result.current.loading).toBe(true);
  });

  it('should add realistic variance to capacity counts', async () => {
    // Test multiple renders to see variance
    const results = [];
    for (let i = 0; i < 10; i++) {
      const { result } = renderHook(() => useCapacity());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      if (result.current.data) {
        results.push(result.current.data[0].current_count);
      }
    }

    // Should have some variance in the results
    const uniqueCounts = new Set(results);
    expect(uniqueCounts.size).toBeGreaterThan(1);
  });

  it('should handle refetch correctly', async () => {
    const { result } = renderHook(() => useCapacity());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
    
    // Call refetch
    result.current.refetch();
    
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });
});
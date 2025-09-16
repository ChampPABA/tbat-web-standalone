import { renderHook, waitFor } from '@testing-library/react';
import { useCapacityStatus, getSessionCapacityCompat } from '@/hooks/use-capacity-status';

// Mock fetch globally
global.fetch = jest.fn();

describe('useCapacityStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch capacity status successfully', async () => {
    const mockMorningResponse = {
      success: true,
      data: {
        session_time: 'MORNING',
        availability_status: 'AVAILABLE',
        message: 'ยังมีที่นั่งว่าง',
        can_register_free: true,
        can_register_advanced: true,
        show_disabled_state: false
      }
    };

    const mockAfternoonResponse = {
      success: true,
      data: {
        session_time: 'AFTERNOON',
        availability_status: 'AVAILABLE',
        message: 'ยังมีที่นั่งว่าง',
        can_register_free: true,
        can_register_advanced: true,
        show_disabled_state: false
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMorningResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAfternoonResponse,
      });

    const { result } = renderHook(() => useCapacityStatus('2025-09-15'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.morningStatus).toEqual(mockMorningResponse.data);
    expect(result.current.afternoonStatus).toEqual(mockAfternoonResponse.data);
    expect(result.current.error).toBeNull();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('/api/capacity/status?sessionTime=MORNING&examDate=2025-09-15');
    expect(fetch).toHaveBeenCalledWith('/api/capacity/status?sessionTime=AFTERNOON&examDate=2025-09-15');
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCapacityStatus('2025-09-15'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.morningStatus).toBeNull();
    expect(result.current.afternoonStatus).toBeNull();
  });
});

describe('getSessionCapacityCompat', () => {
  it('should convert API response to legacy format', () => {
    const morningStatus = {
      session_time: 'MORNING' as const,
      availability_status: 'AVAILABLE',
      message: 'ยังมีที่นั่งว่าง',
      can_register_free: true,
      can_register_advanced: true,
      show_disabled_state: false
    };

    const afternoonStatus = {
      session_time: 'AFTERNOON' as const,
      availability_status: 'FULL',
      message: 'เต็มแล้ว',
      can_register_free: false,
      can_register_advanced: false,
      show_disabled_state: true
    };

    const result = getSessionCapacityCompat(morningStatus, afternoonStatus);

    expect(result).toEqual({
      '09:00-12:00': {
        isFull: false,
        canRegisterFree: true,
        canRegisterAdvanced: true,
        message: 'ยังมีที่นั่งว่าง'
      },
      '13:00-16:00': {
        isFull: true,
        canRegisterFree: false,
        canRegisterAdvanced: false,
        message: 'เต็มแล้ว'
      }
    });
  });

  it('should handle null statuses', () => {
    const result = getSessionCapacityCompat(null, null);

    expect(result).toEqual({
      '09:00-12:00': {
        isFull: false,
        canRegisterFree: false,
        canRegisterAdvanced: false,
        message: ''
      },
      '13:00-16:00': {
        isFull: false,
        canRegisterFree: false,
        canRegisterAdvanced: false,
        message: ''
      }
    });
  });
});
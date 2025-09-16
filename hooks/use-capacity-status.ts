import { useState, useEffect } from 'react';

interface CapacityStatus {
  session_time: "MORNING" | "AFTERNOON";
  availability_status: string;
  message: string;
  can_register_free: boolean;
  can_register_advanced: boolean;
  show_disabled_state: boolean;
}

interface CapacityResponse {
  success: boolean;
  data: CapacityStatus;
}

interface UseCapacityStatusResult {
  morningStatus: CapacityStatus | null;
  afternoonStatus: CapacityStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCapacityStatus(examDate: string = '2025-09-15'): UseCapacityStatusResult {
  const [morningStatus, setMorningStatus] = useState<CapacityStatus | null>(null);
  const [afternoonStatus, setAfternoonStatus] = useState<CapacityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacityStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both morning and afternoon capacity in parallel
      const [morningResponse, afternoonResponse] = await Promise.all([
        fetch(`/api/capacity/status?sessionTime=MORNING&examDate=${examDate}`),
        fetch(`/api/capacity/status?sessionTime=AFTERNOON&examDate=${examDate}`)
      ]);

      if (!morningResponse.ok || !afternoonResponse.ok) {
        throw new Error('Failed to fetch capacity status');
      }

      const morningData: CapacityResponse = await morningResponse.json();
      const afternoonData: CapacityResponse = await afternoonResponse.json();

      if (morningData.success) {
        setMorningStatus(morningData.data);
      }
      if (afternoonData.success) {
        setAfternoonStatus(afternoonData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดปัญหาการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacityStatus();
  }, [examDate]);

  return {
    morningStatus,
    afternoonStatus,
    isLoading,
    error,
    refetch: fetchCapacityStatus
  };
}

// Helper function to convert session time format for compatibility
export function getSessionCapacityCompat(morningStatus: CapacityStatus | null, afternoonStatus: CapacityStatus | null) {
  return {
    "09:00-12:00": {
      isFull: morningStatus?.show_disabled_state || false,
      canRegisterFree: morningStatus?.can_register_free || false,
      canRegisterAdvanced: morningStatus?.can_register_advanced || false,
      message: morningStatus?.message || ""
    },
    "13:00-16:00": {
      isFull: afternoonStatus?.show_disabled_state || false,
      canRegisterFree: afternoonStatus?.can_register_free || false,
      canRegisterAdvanced: afternoonStatus?.can_register_advanced || false,
      message: afternoonStatus?.message || ""
    }
  };
}
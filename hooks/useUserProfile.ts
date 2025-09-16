"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  thaiName: string;
  nationalId: string;
  phone: string;
  school: string;
  packageType: "FREE" | "ADVANCED";
  pdpaConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ExamCode {
  code: string;
  packageType: "FREE" | "ADVANCED";
  subject: "BIOLOGY" | "CHEMISTRY" | "PHYSICS" | null;
  sessionTime: "09:00-12:00" | "13:00-16:00";
  createdAt: Date;
  usedAt: Date | null;
}

interface Payment {
  amount: number;
  paymentType: string;
  createdAt: Date;
}

interface UserProfile {
  success: boolean;
  user: User & {
    examCodes: ExamCode[];
    payments: Payment[];
  };
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setProfile(data);
      } else {
        throw new Error(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const refetch = async () => {
    await fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    refetch,
  };
}
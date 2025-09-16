'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status for graceful degradation
 * Used in API error handling to show appropriate Thai messages
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setWasOffline(false);
        // Optionally trigger a custom event for components to refetch data
        window.dispatchEvent(new CustomEvent('network-reconnected'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      // Optionally trigger a custom event for components to handle offline state
      window.dispatchEvent(new CustomEvent('network-disconnected'));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
    getOfflineMessage: () => isOnline 
      ? null 
      : 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต - กำลังใช้ข้อมูลสำรอง'
  };
}
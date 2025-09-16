'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance';

export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
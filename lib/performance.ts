import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
  navigationType: string;
}

const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!threshold) return 'needs-improvement';
  
  if (value <= threshold.good) return 'good';
  if (value >= threshold.poor) return 'poor';
  return 'needs-improvement';
}

export function sendToAnalytics(metric: Metric) {
  const body: PerformanceMetrics = {
    name: metric.name,
    value: Math.round(metric.value),
    rating: getRating(metric.name, metric.value),
    timestamp: Date.now(),
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
  };

  // Send to Vercel Analytics endpoint
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'Web Vitals', body);
  }

  // Send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(console.error);
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', body);
  }
}

export function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onCLS(sendToAnalytics);
    // FID is deprecated in web-vitals v5, using INP instead
    onINP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

// Custom performance marks for critical user flows
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string) {
    if (typeof window === 'undefined') return;
    
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    try {
      performance.mark(name);
    } catch (error) {
      console.error(`Failed to mark ${name}:`, error);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window === 'undefined') return;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        const startTime = this.marks.get(startMark);
        if (startTime) {
          const duration = performance.now() - startTime;
          this.measures.set(name, duration);
          
          // Send custom metric to analytics
          sendToAnalytics({
            name: `custom_${name}`,
            value: duration,
            delta: duration,
            rating: getRating('custom', duration),
            id: `${name}_${Date.now()}`,
            navigationType: 'custom',
            entries: [],
          } as unknown as Metric);
        }
      }
    } catch (error) {
      console.error(`Failed to measure ${name}:`, error);
    }
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  clearMarks() {
    this.marks.clear();
    if (typeof window !== 'undefined') {
      performance.clearMarks();
    }
  }

  clearMeasures() {
    this.measures.clear();
    if (typeof window !== 'undefined') {
      performance.clearMeasures();
    }
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Critical user flow tracking
export const CriticalFlows = {
  REGISTRATION: {
    start: () => performanceTracker.mark('registration_start'),
    formLoad: () => performanceTracker.mark('registration_form_loaded'),
    submit: () => performanceTracker.mark('registration_submit'),
    complete: () => {
      performanceTracker.mark('registration_complete');
      performanceTracker.measure('registration_total', 'registration_start');
      performanceTracker.measure('registration_form_time', 'registration_form_loaded', 'registration_submit');
    },
  },
  EXAM_CODE_GENERATION: {
    start: () => performanceTracker.mark('exam_code_start'),
    generated: () => {
      performanceTracker.mark('exam_code_generated');
      performanceTracker.measure('exam_code_generation', 'exam_code_start');
    },
  },
  PDF_DOWNLOAD: {
    start: () => performanceTracker.mark('pdf_download_start'),
    firstByte: () => performanceTracker.mark('pdf_first_byte'),
    complete: () => {
      performanceTracker.mark('pdf_download_complete');
      performanceTracker.measure('pdf_ttfb', 'pdf_download_start', 'pdf_first_byte');
      performanceTracker.measure('pdf_download_total', 'pdf_download_start');
    },
  },
  DASHBOARD_LOAD: {
    start: () => performanceTracker.mark('dashboard_start'),
    dataFetched: () => performanceTracker.mark('dashboard_data_fetched'),
    rendered: () => {
      performanceTracker.mark('dashboard_rendered');
      performanceTracker.measure('dashboard_data_fetch', 'dashboard_start', 'dashboard_data_fetched');
      performanceTracker.measure('dashboard_total', 'dashboard_start');
    },
  },
};

// Type declarations for window.va
declare global {
  interface Window {
    va?: (event: string, type: string, data: any) => void;
  }
}
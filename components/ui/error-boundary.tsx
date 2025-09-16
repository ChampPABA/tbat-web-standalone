'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Default error fallback component with Thai language support
const DefaultErrorFallback: React.FC<{ 
  error: Error; 
  resetError: () => void 
}> = ({ error, resetError }) => (
  <div className="min-h-[400px] flex items-center justify-center p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
      <div className="text-red-600 text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-semibold text-red-800 mb-3 font-prompt">
        เกิดข้อผิดพลาดที่ไม่คาดคิด
      </h2>
      <p className="text-red-600 mb-4 text-sm font-prompt">
        ขออภัย ระบบพบปัญหาในการแสดงผลหน้านี้
      </p>
      <details className="mb-4 text-left">
        <summary className="text-red-700 text-xs cursor-pointer hover:text-red-800 font-prompt">
          ดูรายละเอียดข้อผิดพลาด
        </summary>
        <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
          {error.message}
          {error.stack && '\n\n' + error.stack}
        </pre>
      </details>
      <div className="space-y-2">
        <button
          onClick={resetError}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-prompt"
        >
          ลองใหม่อีกครั้ง
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 font-prompt"
        >
          รีเฟรชหน้า
        </button>
      </div>
      <p className="text-xs text-red-500 mt-3 font-prompt">
        หากปัญหานี้เกิดขึ้นอย่างต่อเนื่อง กรุณาติดต่อฝ่ายสนับสนุน
      </p>
    </div>
  </div>
);

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service (Sentry integration)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to external monitoring
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    // Reset error state when resetKeys change
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((resetKey, idx) => 
        prevProps.resetKeys?.[idx] !== resetKey
      )) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for manual error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error reported:', error, errorInfo);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo,
      });
    }
    
    throw error; // Re-throw to trigger error boundary
  };
}

// Wrapper component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
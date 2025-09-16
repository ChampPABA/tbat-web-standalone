import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health';

export async function GET() {
  try {
    const criticalChecks = await healthChecker.performCriticalChecks();
    
    // Service is ready only if critical dependencies are healthy
    const isReady = criticalChecks.database && criticalChecks.redis;
    
    if (isReady) {
      return NextResponse.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        criticalServices: criticalChecks,
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else {
      return NextResponse.json({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        criticalServices: criticalChecks,
        message: 'Critical services are not available',
      }, {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
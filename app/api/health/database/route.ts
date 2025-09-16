/**
 * Database Health Monitoring API Endpoint
 * GET /api/health/database - Returns database performance metrics and health status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseMonitor } from '@/lib/db-monitoring'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get or create database monitor
    const monitor = getDatabaseMonitor()
    
    if (!monitor) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database monitoring not initialized' 
        },
        { status: 500 }
      )
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const includeMetrics = searchParams.get('metrics') === 'true'
    const includeDetails = searchParams.get('details') === 'true'
    const summaryMinutes = parseInt(searchParams.get('summary') || '5')

    // Perform health check
    const healthCheck = await monitor.healthCheck()
    
    // Base response
    const response: any = {
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      database: 'postgresql',
      issues: healthCheck.issues
    }

    // Add performance summary if requested
    if (includeMetrics || includeDetails) {
      const summary = await monitor.getPerformanceSummary(summaryMinutes)
      response.performance = {
        averageLatency: `${summary.averageLatency}ms`,
        slowQueryCount: summary.slowQueryCount,
        errorCount: summary.errorCount,
        capacityUtilization: `${summary.capacityUtilization}%`
      }
    }

    // Add detailed metrics if requested
    if (includeDetails) {
      response.metrics = {
        queryLatency: `${healthCheck.metrics.queryLatency}ms`,
        connectionCount: healthCheck.metrics.connectionCount,
        capacity: {
          totalSessions: healthCheck.metrics.capacityMetrics.totalSessions,
          freeSlotsRemaining: healthCheck.metrics.capacityMetrics.freeSlotsRemaining,
          advancedSlotsRemaining: healthCheck.metrics.capacityMetrics.advancedSlotsRemaining,
          concurrentUsers: healthCheck.metrics.capacityMetrics.concurrentUsers
        },
        slowQueries: healthCheck.metrics.slowQueries.map(query => ({
          query: query.query,
          duration: `${query.duration}ms`,
          timestamp: query.timestamp
        }))
      }
    }

    // Set appropriate HTTP status based on health
    const httpStatus = healthCheck.status === 'healthy' ? 200 :
                      healthCheck.status === 'warning' ? 200 : 503

    return NextResponse.json(response, { status: httpStatus })

  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error'
      },
      { status: 503 }
    )
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const monitor = getDatabaseMonitor()
    
    if (!monitor) {
      return new NextResponse(null, { status: 503 })
    }

    const healthCheck = await monitor.healthCheck()
    const httpStatus = healthCheck.status === 'healthy' ? 200 :
                      healthCheck.status === 'warning' ? 200 : 503

    return new NextResponse(null, { 
      status: httpStatus,
      headers: {
        'X-Health-Status': healthCheck.status,
        'X-Health-Issues': healthCheck.issues.length.toString()
      }
    })

  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
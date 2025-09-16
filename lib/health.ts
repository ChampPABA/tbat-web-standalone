import { checkDatabaseConnection } from './prisma';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
}

class HealthChecker {
  private version = process.env.npm_package_version || '1.0.0';
  private environment = process.env.NODE_ENV || 'development';
  private startTime = Date.now();

  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const isConnected = await checkDatabaseConnection();
      const responseTime = Date.now() - start;
      
      return {
        name: 'database',
        status: isConnected ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          type: 'PostgreSQL',
          provider: 'Vercel Postgres',
        },
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Import Redis dynamically to avoid issues if not configured
      const { redis } = await import('./redis');
      
      await redis.ping();
      const responseTime = Date.now() - start;
      
      return {
        name: 'redis',
        status: 'healthy',
        responseTime,
        details: {
          type: 'Redis',
          provider: 'Upstash',
        },
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }

  async checkStripe(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          name: 'stripe',
          status: 'degraded',
          responseTime: 0,
          error: 'Stripe not configured',
        };
      }

      // Simple Stripe API connectivity check
      const stripe = await import('stripe').then(s => new s.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-08-27.basil',
      }));
      
      // Test with a simple API call
      await stripe.balance.retrieve();
      const responseTime = Date.now() - start;
      
      return {
        name: 'stripe',
        status: 'healthy',
        responseTime,
        details: {
          type: 'Payment Gateway',
          provider: 'Stripe',
        },
      };
    } catch (error) {
      return {
        name: 'stripe',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Stripe connection failed',
      };
    }
  }

  async checkEmail(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      if (!process.env.RESEND_API_KEY) {
        return {
          name: 'email',
          status: 'degraded',
          responseTime: 0,
          error: 'Email service not configured',
        };
      }

      // Simple connectivity check without sending email
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          name: 'email',
          status: 'healthy',
          responseTime,
          details: {
            type: 'Email Service',
            provider: 'Resend',
          },
        };
      } else {
        return {
          name: 'email',
          status: 'unhealthy',
          responseTime,
          error: `Email service returned ${response.status}`,
        };
      }
    } catch (error) {
      return {
        name: 'email',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Email service connection failed',
      };
    }
  }

  async checkMemory(): Promise<HealthCheck> {
    try {
      const memUsage = process.memoryUsage();
      const memUsageInMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      };
      
      // Consider memory unhealthy if heap usage exceeds 400MB
      const status = memUsageInMB.heapUsed > 400 ? 'degraded' : 'healthy';
      
      return {
        name: 'memory',
        status,
        details: memUsageInMB,
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Memory check failed',
      };
    }
  }

  checkDisk(): HealthCheck {
    // Basic disk space check (simplified for serverless)
    try {
      const tmpDir = '/tmp';
      
      return {
        name: 'disk',
        status: 'healthy', // Assume healthy in serverless environment
        details: {
          tmpDir,
          note: 'Serverless environment - disk space managed automatically',
        },
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Disk check failed',
      };
    }
  }

  async performBasicHealthCheck(): Promise<HealthStatus> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Basic checks that should be fast
    const checks = [
      this.checkMemory(),
      Promise.resolve(this.checkDisk()),
    ];
    
    const resolvedChecks = await Promise.all(checks);
    
    // Determine overall status
    const hasUnhealthy = resolvedChecks.some(check => check.status === 'unhealthy');
    const hasDegraded = resolvedChecks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: this.version,
      environment: this.environment,
      checks: resolvedChecks,
    };
  }

  async performDetailedHealthCheck(): Promise<HealthStatus> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    // All health checks including external dependencies
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkEmail(),
      this.checkMemory(),
    ]);
    
    // Add disk check (synchronous)
    checks.push(this.checkDisk());
    
    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: this.version,
      environment: this.environment,
      checks,
    };
  }

  async performCriticalChecks(): Promise<{
    database: boolean;
    redis: boolean;
  }> {
    const [dbCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    
    return {
      database: dbCheck.status === 'healthy',
      redis: redisCheck.status === 'healthy',
    };
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker();
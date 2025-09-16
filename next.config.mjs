// import path from 'path';

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false, // TEMPORARILY DISABLED to fix API spam issue 
  poweredByHeader: false,
  compress: true,

  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: false, // Re-enable linting for deployment
  },

  // Image optimization
  images: {
    domains: ['localhost', 'vercel.app'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' && {
      exclude: ['error', 'warn'],
    },
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slot',
      'lucide-react'
    ],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Webpack optimizations - simplified for Vercel deployment
  webpack: (config, { isServer }) => {
    // Prevent Prisma client from being bundled in browser - CRITICAL FIX
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        {
          '@prisma/client': 'PrismaClient',
          'prisma': 'prisma',
          'ioredis': 'ioredis',
          'redis': 'redis',
        },
      ];
    }

    return config;
  },

  // Output configuration - remove standalone for Vercel
  // output: 'standalone',
  // outputFileTracingRoot: path.join(import.meta.dirname, '../../'),

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
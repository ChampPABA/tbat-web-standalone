import path from 'path';

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false, // TEMPORARILY DISABLED to fix API spam issue 
  poweredByHeader: false,
  compress: true,
  
  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: true, // Skip linting during builds to allow compilation
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

  // Webpack optimizations
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

    // Optimize bundle size with aggressive chunk splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      maxAsyncRequests: 20,
      minSize: 20000,
      maxSize: 200000, // More aggressive chunk splitting for better performance
      cacheGroups: {
        default: false,
        vendors: false,
        
        // React framework chunk
        framework: {
          name: 'framework',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
          priority: 40,
          enforce: true
        },
        
        // Radix UI components
        radix: {
          name: 'radix',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          priority: 35,
          enforce: true
        },
        
        // Large libraries chunk
        lib: {
          test(module) {
            return (
              module.size() > 160000 && 
              /node_modules[/\\]/.test(module.identifier()) &&
              !/[\\/]node_modules[\\/](@radix-ui|react|react-dom)[\\/]/.test(module.identifier())
            );
          },
          name(module) {
            const packageNameMatch = module.identifier().match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            const packageName = packageNameMatch ? packageNameMatch[1] : '';
            return `npm.${packageName.replace('@', '').replace(/[^a-zA-Z0-9]/g, '-')}`;
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
          maxSize: 150000
        },
        
        // Common shared modules
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
          chunks: 'async',
          maxSize: 150000
        },
        
        // Vendor utilities
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](clsx|class-variance-authority|tailwind-merge)[\\/]/,
          priority: 25
        },

        // Lucide React icons separate chunk for better caching
        icons: {
          name: 'icons',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          priority: 30,
          maxSize: 100000 // Keep icon chunk small
        },

        // Demo and development pages should be separate
        demo: {
          name: 'demo-pages',
          chunks: 'all',
          test: /[\\/](auth-demo|auth-ui-options)[\\/]/,
          priority: 20,
          maxSize: 200000
        }
      }
    };

    // Performance hints with stricter limits for bundle size optimization
    if (!isServer) {
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 320000, // 320KB max entry (closer to 342KB limit)
        maxAssetSize: 320000       // 320KB max asset
      };
    }

    return config;
  },

  // Output configuration
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
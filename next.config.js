/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless', 'drizzle-orm', '@supabase/supabase-js'],
    // Disable SES lockdown for NextAuth compatibility
    esmExternals: 'loose',
  },

  // Disable SES lockdown in Vercel environment
  env: {
    DISABLE_SES_LOCKDOWN: 'true',
    NEXT_DISABLE_SES_LOCKDOWN: 'true',
  },

  // Headers configuration to handle CORS and fix cookie domain issues
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Specific headers for API routes to fix CORS issues
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ]
  },

  images: {
    domains: [
      'localhost',
      // Add Supabase storage domain
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('http://', '')]
        : []
      ),
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Enhanced webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('./src', import.meta.url).pathname,
      '@shared': new URL('./shared', import.meta.url).pathname,
    };

    // Fix for Supabase WebSocket connections and other client-side modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }

    // Optimize for Vercel serverless functions
    if (isServer) {
      config.externals.push('@neondatabase/serverless');
    }

    return config;
  },

  // Vercel-specific optimizations
  poweredByHeader: false,
  compress: true,

  // Development-specific configurations
  ...(process.env.NODE_ENV === 'development' && {
    // Disable strict mode in development to avoid double-rendering issues with Supabase
    reactStrictMode: false,
  }),

  // Production-specific configurations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable strict mode in production
    reactStrictMode: true,
    swcMinify: true,
    // Optimize for Vercel
    output: 'standalone',
  }),
}

export default nextConfig
/* eslint @typescript-eslint/no-var-requires: "off" */
const { i18n } = require('./next-i18next.config');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize webpack configuration
  webpack: (config, { isServer }) => {
    // Handle socket.io-client externally on client-side
    if (!isServer) {
      config.externals = [...(config.externals || []), 'socket.io-client'];
    }
    // Enable source maps for better debugging
    if (!isServer) {
      config.devtool = 'source-map';
    }
    return config;
  },

  // API route rewrites
  async rewrites() {
    return [
      {
        source: '/api/socketio',
        destination: '/api/socketio',
      },
    ];
  },

  // Experimental features with safety checks
  experimental: {
    esmExternals: 'loose', // More flexible ESM handling
    webpackBuildWorker: true,
    // Enable modern optimizations
    optimizeCss: true,
    scrollRestoration: true
  },
  
  // Secure image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'boxyhq.com',
        pathname: '/**' // Explicit path pattern
      },
      {
        protocol: 'https',
        hostname: 'files.stripe.com',
        pathname: '/**'
      }
    ],
    minimumCacheTTL: 60, // Cache images for better performance
  },

  // Internationalization config
  i18n,

  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()' 
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        source: '/api/socketio',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.SOCKET_CORS_ORIGIN || process.env.NEXTAUTH_URL || '*' 
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'Content-Type, Authorization, X-Requested-With'
          }
        ]
      }
    ];
  },

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  generateEtags: true, // Enable ETag generation
};

// Enhanced Sentry configuration
const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: process.env.NODE_ENV === 'development',
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true
  },
  tunnelRoute: '/monitoring',
  hideSourceMaps: process.env.NODE_ENV === 'production',
  disableLogger: false,
  automaticVercelMonitors: true,
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE || '1.0')
};

module.exports = withSentryConfig(nextConfig, sentryConfig);
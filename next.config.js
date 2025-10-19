/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Ensure proper handling of environment variables
  env: {
    DATABASE_PROVIDER: process.env.DATABASE_PROVIDER,
  },
  // Production optimizations
  swcMinify: true,
  compress: true,
}

module.exports = nextConfig

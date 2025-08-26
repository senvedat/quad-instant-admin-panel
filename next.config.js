/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    ADMIN_DB_HOST: process.env.ADMIN_DB_HOST || 'localhost',
    ADMIN_DB_PORT: process.env.ADMIN_DB_PORT || '5432',
    ADMIN_DB_NAME: process.env.ADMIN_DB_NAME || 'quad_admin_panel',
    ADMIN_DB_USER: process.env.ADMIN_DB_USER || 'admin',
    ADMIN_DB_PASSWORD: process.env.ADMIN_DB_PASSWORD || 'admin123',
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  },
}

module.exports = nextConfig
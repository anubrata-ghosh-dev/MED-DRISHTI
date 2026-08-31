/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
    NEXT_PUBLIC_KIOSK_EMAIL: process.env.NEXT_PUBLIC_KIOSK_EMAIL ?? 'kiosk@meddrishti.in',
    NEXT_PUBLIC_KIOSK_PASSWORD: process.env.NEXT_PUBLIC_KIOSK_PASSWORD ?? 'kiosk_dev_password',
  },
};

export default nextConfig;

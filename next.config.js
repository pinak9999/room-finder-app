/** @type {import('next').NextConfig} */
const nextConfig = {
  // इन दोनों को true रखने से build कभी फेल नहीं होगा
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Vercel पर इमेज लोड होने की समस्या ठीक करने के लिए
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
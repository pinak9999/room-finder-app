import withPWAInit from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // एरर इग्नोर करने की सेटिंग्स
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // इमेजेज को ऑप्टिमाइज़ करने की सेटिंग (ताकि बिल्ड तेज़ हो)
  images: {
    unoptimized: true,
  },
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // यह लाइन सबसे ज़रूरी है, यह भारी फाइलों को PWA से बाहर रखती है
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
});

export default withPWA(nextConfig);
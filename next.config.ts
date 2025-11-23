import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Agar koi aur config hai to yahan likhein
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  
  // 👇 'skipWaiting' ko iske andar likhna hota hai
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
})(nextConfig);
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed `output: "standalone"` — Vercel handles its own build output.
  // The standalone output was breaking the Vercel deployment because Vercel
  // doesn't expect a pre-built standalone server.js; it builds its own.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

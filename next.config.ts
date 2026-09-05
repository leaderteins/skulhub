import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed `output: "standalone"` — Vercel handles its own build output.
  // The standalone output was breaking the Vercel deployment because Vercel
  // doesn't expect a pre-built standalone server.js; it builds its own.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Don't auto-strip the trailing slash from /socket.io/ polling requests.
  // socket.io engine.io always polls /socket.io/?EIO=4&transport=polling —
  // if Next.js redirects that to /socket.io?... the socket.io client gets
  // a 308 instead of a handshake response and gives up.
  skipTrailingSlashRedirect: true,
  // Proxy the socket.io engine.io path to the standalone notifications
  // mini-service (port 3003). This is required so that browsers connecting
  // directly to the Next.js dev server on port 3000 (e.g. agent-browser
  // smoke tests, local dev) can still reach the realtime service. When the
  // user goes through the Caddy gateway on port 81 instead, Caddy's own
  // XTransformPort query routing handles this and the rewrite is bypassed
  // (Caddy intercepts before Next.js sees the request).
  async rewrites() {
    return {
      // Proxy BEFORE Next.js tries to handle the request itself — the
      // /socket.io path is owned entirely by the mini-service and Next.js
      // has no route for it (otherwise it returns its 404 page).
      beforeFiles: [
        {
          source: "/socket.io/:path*",
          destination: "http://localhost:3003/socket.io/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

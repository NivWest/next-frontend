import type { NextConfig } from "next";

// Where /api/v1/* is proxied to. Rewrites are resolved at build time, so Docker builds pass
// BACKEND_URL as a build arg (compose: http://api:8081). Local dev defaults to the Go API.
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8081";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

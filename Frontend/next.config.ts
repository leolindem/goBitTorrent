import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",             // anything that hits /api/*
        destination: "http://localhost:8080/api/:path*", // proxy it to Go
      },
      {
        source: '/downloads/:path*',
        destination: 'http://localhost:8080/downloads/:path*',
      },
    ];
  },
};

export default nextConfig;

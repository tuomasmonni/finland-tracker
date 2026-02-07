import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/lkporras',
        destination: '/lkporras.html',
      },
    ];
  },
};

export default nextConfig;

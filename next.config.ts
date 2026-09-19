import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // The app code uses `any` liberally by design (dense, hand-written
    // client state). Don't let lint style rules block production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

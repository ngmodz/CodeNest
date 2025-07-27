import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion']
  },
  webpack: (config) => {
    // Handle Monaco Editor
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    });
    return config;
  }
};

export default nextConfig;

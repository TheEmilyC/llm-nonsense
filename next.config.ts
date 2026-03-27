import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // Some character cards can be quite large
    },
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/character/**",
      },
      {
        pathname: "/api/persona/**",
      },
      {
        pathname: "/api/world/**",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;

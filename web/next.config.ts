import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libera o servidor de desenvolvimento para celulares na rede local (teste em aparelho real)
  allowedDevOrigins: ["10.0.0.10", "10.10.208.20", "192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

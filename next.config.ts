import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Lint tetap dijalankan melalui `npm run lint`, tetapi error lama tidak
    // boleh menghalangi pembuatan artefak deploy.
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

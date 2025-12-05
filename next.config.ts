import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build-time env injection without .env files
  env: {
    MAINTENANCE_MODE: "false",
  },
};

export default nextConfig;

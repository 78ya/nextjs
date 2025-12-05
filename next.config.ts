import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // 维护模式：设置为 "true" 启用，设置为 "false" 或未设置则禁用
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE || "false",
    DATABASE_URL: process.env.DATABASE_URL || "",
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // 启用 instrumentation hook，允许在服务器启动时运行初始化代码
    instrumentationHook: true,
  },
};

export default nextConfig;

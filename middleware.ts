import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 维护/初始化期间的白名单路径前缀
const ALLOW_PREFIXES = [
  "/admin",
  "/api/internal/init",
  "/maintenance",
  "/_next",
  "/static",
  "/favicon",
];

export function middleware(req: NextRequest) {
  // 未开启维护模式则放行
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";
  if (!maintenanceMode) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // 白名单路径放行
  if (ALLOW_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  // 其余路径重定向到维护页
  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.redirect(url);
}

// 过滤静态资源与 API route 文件等
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};


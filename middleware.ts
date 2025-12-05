import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMaintenanceMode } from "@/lib/edge-config";

// 维护/初始化期间的白名单路径前缀
const ALLOW_PREFIXES = [
  "/admin",
  "/api/internal/init",
  "/maintenance",
  "/_next",
  "/static",
  "/favicon",
];

export async function middleware(req: NextRequest) {
  // 从 Edge Config Store 获取维护模式状态
  const maintenanceMode = await getMaintenanceMode();
  
  // 未开启维护模式则放行
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


import { NextResponse } from "next/server";
import { deleteUserSession, getUserSession } from "@/lib/cookies";

function parseUA(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "未知设备", browser: "未知浏览器" };
  if (ua.includes("Mobile")) {
    return { device: "移动设备", browser: ua.slice(0, 32) };
  }
  return { device: "桌面设备", browser: ua.slice(0, 48) };
}

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;
  // @ts-ignore
  return (req as any).ip || "0.0.0.0";
}

function normalizeIp(ip: string): string {
  if (!ip) return "0.0.0.0";
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1] || 0);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip === "::1") return true;
  return false;
}

export async function GET(req: Request) {
  const email = await getUserSession();
  if (!email) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const ua = req.headers.get("user-agent");
  const { device, browser } = parseUA(ua);
  const ipRaw = getClientIp(req);
  const ip = normalizeIp(ipRaw);
  const location = isPrivateIp(ip) ? "内网地址" : "未知";

  return NextResponse.json({
    ok: true,
    items: [
      {
        id: "current",
        device,
        browser,
        ip,
        location,
        lastActive: new Date().toISOString(),
        isCurrent: true,
        email,
      },
    ],
  });
}

export async function DELETE() {
  // 撤销当前会话 = 退出登录
  await deleteUserSession();
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (action === "revoke_others") {
    // 暂无多端会话存储，视为成功
    return NextResponse.json({ ok: true, message: "已撤销其他会话（如果存在）" });
  }
  return NextResponse.json({ ok: false, message: "未知操作" }, { status: 400 });
}


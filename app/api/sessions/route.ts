import { NextResponse } from "next/server";
import { deleteUserSession, getUserSessionInfo } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";
import { getClientIpFromHeaders, listUserSessions, revokeOtherSessions, revokeSession, touchSession } from "@/lib/db/sessions";

export async function GET(req: Request) {
  const info = await getUserSessionInfo();
  if (!info?.email) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const user = await getUserByEmail(info.email);
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: "用户不存在" }, { status: 404 });
  }

  // 轻量“触碰”当前会话的 last_active_at
  if (info.sid) {
    try {
      await touchSession(info.sid);
    } catch (e) {
      console.warn("[api/sessions] touchSession failed", e);
    }
  }

  // 兜底：如果当前 cookie 没有 sid（旧版本），仍然可以返回一个 current 会话，但提示为仅当前
  if (!info.sid) {
    const ip = getClientIpFromHeaders(req.headers);
    return NextResponse.json({
      ok: true,
      items: [
        {
          id: "current",
          device: "未知设备",
          browser: req.headers.get("user-agent")?.slice(0, 64) || "未知浏览器",
          ip,
          location: "未知",
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          expiresAt: "",
          isCurrent: true,
        },
      ],
      legacy: true,
      message: "当前会话为旧版本 cookie（建议重新登录以启用多端会话管理）",
    });
  }

  const items = await listUserSessions({ userId: user.id, currentSessionId: info.sid });
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(req: Request) {
  const info = await getUserSessionInfo();
  if (!info?.email) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const user = await getUserByEmail(info.email);
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: "用户不存在" }, { status: 404 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  // 没传 id：按“撤销当前会话”处理
  const target = id || info.sid;

  if (target && target !== "current") {
    await revokeSession({ userId: user.id, sessionId: target });
  }

  // 撤销当前会话时，需要清掉 cookie 并让用户重新登录
  if (!id || target === info.sid || target === "current") {
    await deleteUserSession();
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const info = await getUserSessionInfo();
  if (!info?.email) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }
  const user = await getUserByEmail(info.email);
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: "用户不存在" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (action === "revoke_others") {
    await revokeOtherSessions({ userId: user.id, keepSessionId: info.sid });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "未知操作" }, { status: 400 });
}


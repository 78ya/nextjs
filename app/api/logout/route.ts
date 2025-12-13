import { NextResponse } from "next/server";
import { deleteUserSession, getUserSessionInfo } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";
import { revokeSession } from "@/lib/db/sessions";

export async function POST() {
  try {
    const info = await getUserSessionInfo();
    if (info?.email && info.sid) {
      const user = await getUserByEmail(info.email);
      if (user?.id) {
        try {
          await revokeSession({ userId: user.id, sessionId: info.sid });
        } catch (e) {
          console.warn("[api/logout] revokeSession failed", e);
        }
      }
    }
    await deleteUserSession();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/logout] POST failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "退出失败" }, { status: 500 });
  }
}


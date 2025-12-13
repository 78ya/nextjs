import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";

export async function GET() {
  try {
    const email = await getUserSession();
    if (!email) {
      return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ ok: false, message: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[api/me] GET failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "获取失败" }, { status: 500 });
  }
}


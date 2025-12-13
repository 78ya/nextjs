"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { setUserSession } from "@/lib/cookies";
import { getUserByEmail, ensureUsersTable } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createUserSession, getClientIpFromHeaders } from "@/lib/db/sessions";

export type LoginState = {
  ok: boolean;
  message?: string;
};

async function fetchUser(email: string) {
  // 确保表存在
  await ensureUsersTable();
  
  // 获取用户信息
  return await getUserByEmail(email);
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "请输入邮箱和密码" };
  }

  const user = await fetchUser(email);

  if (!user || !verifyPassword(password, user.password)) {
    return { ok: false, message: "邮箱或密码不正确" };
  }

  // 创建真实 session（用于多端会话管理）
  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const ua = h.get("user-agent");
  const maxAge = 60 * 60 * 24; // 24h
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

  let sid: string | undefined = undefined;
  try {
    if (user.id) {
      const created = await createUserSession({
        userId: user.id,
        email,
        ip,
        userAgent: ua,
        expiresAt,
      });
      sid = created.sessionId;
    }
  } catch (e) {
    console.warn("[loginAction] createUserSession failed", e);
  }

  await setUserSession(email, maxAge, sid);

  redirect("/");
}


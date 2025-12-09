"use server";

import { redirect } from "next/navigation";
import { setUserSession } from "@/lib/cookies";
import { getUserByEmail, ensureUsersTable } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

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

  await setUserSession(email);

  redirect("/");
}


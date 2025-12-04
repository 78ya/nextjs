"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get } from "@vercel/edge-config";

export type LoginState = {
  ok: boolean;
  message?: string;
};

type EdgeUser = {
  password: string;
  name?: string;
};

async function fetchUser(email: string) {
  const users =
    (await get<Record<string, EdgeUser>>("users")) ??
    (await get<Record<string, EdgeUser>>("logins")) ??
    {};

  return users[email];
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

  if (!process.env.EDGE_CONFIG) {
    return {
      ok: false,
      message: "未配置 EDGE_CONFIG，无法连接 Nextjs Store。",
    };
  }

  const user = await fetchUser(email);

  if (!user || user.password !== password) {
    return { ok: false, message: "邮箱或密码不正确" };
  }

  const cookieStore = await cookies();
  cookieStore.set("session", JSON.stringify({ email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/");
}


"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@libsql/client";
import { getDatabaseConfig } from "@/lib/edge-config";

export type LoginState = {
  ok: boolean;
  message?: string;
};

type DbUser = {
  email: string;
  password: string;
  name?: string | null;
};

async function getLibsqlClient() {
  const { url, authToken } = await getDatabaseConfig();

  if (!url) {
    throw new Error("未配置数据库 URL，无法连接数据库");
  }

  return authToken ? createClient({ url, authToken }) : createClient({ url });
}

async function fetchUser(email: string): Promise<DbUser | null> {
  const client = await getLibsqlClient();

  // 确保表存在（与注册流程一致）
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT
    )
  `);

  const result = await client.execute({
    sql: "SELECT email, password, name FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as unknown as DbUser;
  return {
    email: row.email,
    password: row.password,
    name: row.name,
  };
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


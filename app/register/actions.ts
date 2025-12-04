"use server";

import { redirect } from "next/navigation";

export type RegisterState = {
  ok: boolean;
  message?: string;
};

export async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirm) {
    return { ok: false, message: "请填写所有必填字段" };
  }

  if (!email.includes("@")) {
    return { ok: false, message: "请输入有效的邮箱地址" };
  }

  if (password.length < 6) {
    return { ok: false, message: "密码长度不能少于 6 位" };
  }

  if (password !== confirm) {
    return { ok: false, message: "两次输入的密码不一致" };
  }

  // 这里只做示例，不真正写入 Nextjs Store / Edge Config。
  // 实际项目中应在这里调用 API 或数据库完成注册。

  redirect("/login");
}



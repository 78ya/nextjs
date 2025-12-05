"use server";

import { redirect } from "next/navigation";
import { getAdminConfig } from "@/lib/edge-config";
import { setAdminSession } from "@/lib/cookies";

export type AdminLoginState = {
  ok: boolean;
  message?: string;
};

export async function adminLoginAction(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const account = String(formData.get("account") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!account || !password) {
    return { ok: false, message: "请输入账号和密码" };
  }

  try {
    // 从 Edge Config 获取管理员配置
    const adminConfig = await getAdminConfig();

    // 验证账号和密码
    if (account !== adminConfig.account || password !== adminConfig.password) {
      return { ok: false, message: "账号或密码不正确" };
    }

    // 登录成功，设置 session cookie
    await setAdminSession(account);

    // 重定向到管理后台 URL
    redirect(adminConfig.url || "/admin");
  } catch (error) {
    console.error("管理员登录失败:", error);
    return { ok: false, message: "登录失败，请稍后重试" };
  }
}


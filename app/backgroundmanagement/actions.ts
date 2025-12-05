"use server";

import { redirect } from "next/navigation";
import { getAdminConfig } from "@/lib/edge-config";
import { setAdminSession } from "@/lib/cookies";
import { getUserSession, deleteUserSession } from "@/lib/cookies";
import { createClient } from "@libsql/client";
import { getDatabaseConfig } from "@/lib/edge-config";

export type AdminLoginState = {
  ok: boolean;
  message?: string;
};

export type UserInfoState = {
  ok: boolean;
  message?: string;
};

export type PasswordChangeState = {
  ok: boolean;
  message?: string;
};

// 获取数据库客户端
async function getLibsqlClient() {
  const { url, authToken } = await getDatabaseConfig();

  if (!url) {
    throw new Error("未配置数据库 URL，无法连接数据库");
  }

  return authToken ? createClient({ url, authToken }) : createClient({ url });
}

// 获取用户信息
export async function getUserInfo(): Promise<{
  email: string;
  name: string | null;
} | null> {
  const email = await getUserSession();
  if (!email) {
    return null;
  }

  try {
    const client = await getLibsqlClient();
    const result = await client.execute({
      sql: "SELECT email, name FROM users WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as unknown as { email: string; name: string | null };
    return {
      email: row.email,
      name: row.name,
    };
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
}

// 管理员登录
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

// 更新用户信息
export async function updateUserInfo(
  prevState: UserInfoState,
  formData: FormData
): Promise<UserInfoState> {
  const email = await getUserSession();
  if (!email) {
    return { ok: false, message: "请先登录" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) {
    return { ok: false, message: "昵称不能为空" };
  }

  try {
    const client = await getLibsqlClient();
    
    // 更新用户信息（目前数据库只有 name 字段，phone 可以后续扩展）
    await client.execute({
      sql: "UPDATE users SET name = ? WHERE email = ?",
      args: [name, email],
    });

    return { ok: true, message: "个人信息更新成功" };
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return { ok: false, message: "更新失败，请稍后重试" };
  }
}

// 修改密码
export async function changePassword(
  prevState: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const email = await getUserSession();
  if (!email) {
    return { ok: false, message: "请先登录" };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, message: "请填写所有密码字段" };
  }

  if (newPassword.length < 6) {
    return { ok: false, message: "新密码长度不能少于 6 位" };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "两次输入的新密码不一致" };
  }

  try {
    const client = await getLibsqlClient();
    
    // 验证当前密码
    const result = await client.execute({
      sql: "SELECT password FROM users WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (result.rows.length === 0) {
      return { ok: false, message: "用户不存在" };
    }

    const row = result.rows[0] as unknown as { password: string };
    if (row.password !== currentPassword) {
      return { ok: false, message: "当前密码不正确" };
    }

    // 更新密码
    await client.execute({
      sql: "UPDATE users SET password = ? WHERE email = ?",
      args: [newPassword, email],
    });

    return { ok: true, message: "密码修改成功" };
  } catch (error) {
    console.error("修改密码失败:", error);
    return { ok: false, message: "修改失败，请稍后重试" };
  }
}

// 退出登录
export async function logoutAction(): Promise<void> {
  await deleteUserSession();
  redirect("/login");
}

// 删除账号
export async function deleteAccountAction(): Promise<void> {
  const email = await getUserSession();
  if (!email) {
    redirect("/login");
    return;
  }

  try {
    const client = await getLibsqlClient();
    
    // 删除用户
    await client.execute({
      sql: "DELETE FROM users WHERE email = ?",
      args: [email],
    });

    // 删除 session
    await deleteUserSession();
    
    redirect("/");
  } catch (error) {
    console.error("删除账号失败:", error);
    redirect("/BackgroundManagement");
  }
}


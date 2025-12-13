"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminConfig } from "@/lib/edge-config";
import { setAdminSession } from "@/lib/cookies";
import { getUserSession, deleteUserSession, getUserSessionInfo } from "@/lib/cookies";
import { getUserByEmail, updateUser, deleteUser } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { uploadImage } from "@/lib/image-host";
import { revokeSession } from "@/lib/db/sessions";

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

// 获取用户信息
export async function getUserInfo(): Promise<{
  email: string;
  name: string | null;
  avatar: string | null;
} | null> {
  const email = await getUserSession();
  if (!email) {
    return null;
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }

    return {
      email: user.email,
      name: user.name,
      avatar: user.avatar ?? null,
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
  const avatarFile = formData.get("avatar");

  if (!name) {
    return { ok: false, message: "昵称不能为空" };
  }

  try {
    console.info("[bm/updateUserInfo] start", { email });

    let avatarUrl: string | null | undefined = undefined;

    if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      console.info("[bm/updateUserInfo] uploading avatar", {
        email,
        fileName: avatarFile.name,
        size: avatarFile.size,
      });
      const uploaded = await uploadImage({
        file: avatarFile,
        filename: avatarFile.name,
      });
      avatarUrl = uploaded.url;
      console.info("[bm/updateUserInfo] avatar uploaded", {
        email,
        key: uploaded.key,
        url: uploaded.url,
        thumbnail: uploaded.thumbnail_url,
      });
    } else {
      console.info("[bm/updateUserInfo] no avatar file provided", {
        email,
        hasFile: avatarFile instanceof File,
        size: avatarFile instanceof File ? avatarFile.size : null,
        type: avatarFile instanceof File ? avatarFile.type : typeof avatarFile,
      });
    }

    // 更新用户信息（phone 暂不入库，仅 name / avatar）
    await updateUser(email, { name, avatar: avatarUrl });

    // 调试：读取一次更新后的用户数据，确认 avatar 是否落库
    try {
      const fresh = await getUserByEmail(email);
      console.info("[bm/updateUserInfo] post-update snapshot", {
        email,
        hasAvatar: !!fresh?.avatar,
        avatar: fresh?.avatar,
        name: fresh?.name,
      });
    } catch (e) {
      console.warn("[bm/updateUserInfo] post-update snapshot failed", { email, error: e });
    }

    // 重新验证相关页面的缓存
    revalidatePath("/bm");
    revalidatePath("/bm/profile");

    console.info("[bm/updateUserInfo] user updated", {
      email,
      name,
      avatar: avatarUrl ?? "unchanged",
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
    // 验证当前密码
    const user = await getUserByEmail(email);

    if (!user) {
      return { ok: false, message: "用户不存在" };
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return { ok: false, message: "当前密码不正确" };
    }

    // 对新密码进行哈希处理
    const hashedNewPassword = hashPassword(newPassword);
    
    // 更新密码
    await updateUser(email, { password: hashedNewPassword });

    return { ok: true, message: "密码修改成功" };
  } catch (error) {
    console.error("修改密码失败:", error);
    return { ok: false, message: "修改失败，请稍后重试" };
  }
}

// 退出登录
export async function logoutAction(): Promise<void> {
  // 如果是新会话（含 sid），先撤销当前 sid，确保“撤销其他会话/单会话撤销”真正生效
  try {
    const info = await getUserSessionInfo();
    if (info?.email && info.sid) {
      const user = await getUserByEmail(info.email);
      if (user?.id) {
        await revokeSession({ userId: user.id, sessionId: info.sid });
      }
    }
  } catch (e) {
    console.warn("[bm/logoutAction] revoke current session failed", e);
  }
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
    // 删除用户
    await deleteUser(email);

    // 删除 session
    await deleteUserSession();
    
    redirect("/");
  } catch (error) {
    console.error("删除账号失败:", error);
    redirect("/bm");
  }
}


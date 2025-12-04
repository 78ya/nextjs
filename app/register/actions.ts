"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export type RegisterState = {
  ok: boolean;
  message?: string;
  step?: "info" | "verify"; // 当前步骤
  email?: string; // 保存邮箱用于验证码步骤
};

export type SendCodeState = {
  ok: boolean;
  message?: string;
};

/**
 * 发送验证码到邮箱（空函数，待实现）
 */
async function sendVerificationCode(email: string): Promise<void> {
  // TODO: 实现发送验证码到邮箱的逻辑
  // 例如：调用邮件服务 API（SendGrid、AWS SES、Nodemailer 等）
  // 生成 6 位随机验证码
  // 将验证码存储到临时存储（Redis、数据库等）并设置过期时间
  // 发送邮件
  
  // 当前为空函数，仅占位
  console.log(`[占位] 应向 ${email} 发送验证码`);
}

/**
 * 验证验证码（空函数，待实现）
 */
async function verifyCode(email: string, code: string): Promise<boolean> {
  // TODO: 实现验证码验证逻辑
  // 从临时存储中读取该邮箱的验证码
  // 比较用户输入的验证码
  // 检查是否过期
  // 验证成功后清除验证码
  
  // 当前为空函数，仅占位，返回 true 用于测试
  console.log(`[占位] 验证邮箱 ${email} 的验证码: ${code}`);
  return true; // 临时返回 true，方便测试流程
}

/**
 * 第一步：提交基本信息并发送验证码
 */
export async function sendCodeAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirm) {
    return { ok: false, message: "请填写所有必填字段", step: "info" };
  }

  if (!email.includes("@")) {
    return { ok: false, message: "请输入有效的邮箱地址", step: "info" };
  }

  if (password.length < 6) {
    return { ok: false, message: "密码长度不能少于 6 位", step: "info" };
  }

  if (password !== confirm) {
    return { ok: false, message: "两次输入的密码不一致", step: "info" };
  }

  // 发送验证码
  try {
    await sendVerificationCode(email);
    
    // 将用户信息临时存储到 cookie（用于验证码步骤）
    const cookieStore = await cookies();
    cookieStore.set("register_temp", JSON.stringify({ name, email, password }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10, // 10 分钟过期
    });

    return {
      ok: true,
      message: "验证码已发送到您的邮箱，请查收",
      step: "verify",
      email,
    };
  } catch (error) {
    return {
      ok: false,
      message: "发送验证码失败，请稍后重试",
      step: "info",
    };
  }
}

/**
 * 第二步：验证验证码并完成注册
 */
export async function verifyCodeAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return { ok: false, message: "请输入验证码", step: "verify" };
  }

  if (code.length !== 6) {
    return { ok: false, message: "验证码应为 6 位数字", step: "verify" };
  }

  // 从 cookie 中获取临时注册信息
  const cookieStore = await cookies();
  const tempData = cookieStore.get("register_temp");
  
  if (!tempData) {
    return {
      ok: false,
      message: "注册信息已过期，请重新填写",
      step: "info",
    };
  }

  let registerData: { name: string; email: string; password: string };
  try {
    registerData = JSON.parse(tempData.value);
  } catch {
    return {
      ok: false,
      message: "注册信息无效，请重新填写",
      step: "info",
    };
  }

  // 验证验证码
  const isValid = await verifyCode(registerData.email, code);
  
  if (!isValid) {
    return {
      ok: false,
      message: "验证码错误或已过期，请重新获取",
      step: "verify",
      email: registerData.email,
    };
  }

  // 验证成功，完成注册
  // TODO: 这里应该将用户信息写入 Nextjs Store / Edge Config 或数据库
  // 当前仅做示例，不真正写入
  
  // 清除临时 cookie
  cookieStore.delete("register_temp");

  redirect("/login");
}



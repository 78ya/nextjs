"use server";

import { redirect } from "next/navigation";
import { getResendApiKey, getEmailApiEndpoint, getEmailFromAddress } from "@/lib/edge-config";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  setVerificationCode,
  getVerificationCode,
  deleteVerificationCode,
  setRegisterTemp,
  getRegisterTemp,
  deleteRegisterTemp,
} from "@/lib/cookies";
import { saveUserToLibsql } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

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


// 生成 6 位随机验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 读取邮件模板并替换验证码
async function getEmailTemplate(code: string): Promise<string> {
  const templatePath = join(process.cwd(), "app", "register", "email-template.html");
  const template = await readFile(templatePath, "utf-8");
  return template.replace("{{CODE}}", code);
}

// 读取注册成功邮件模板并替换信息
async function getRegisterSuccessTemplate(name: string, email: string): Promise<string> {
  const templatePath = join(process.cwd(), "app", "register", "email-success.html");
  const template = await readFile(templatePath, "utf-8");
  return template.replace("{{NAME}}", name).replace("{{EMAIL}}", email);
}


// 发送邮件
async function sendEmail(
  subject: string,
  to: string[],
  text: string,
  html?: string
): Promise<void> {
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    throw new Error("未配置 Resend API Key，无法发送邮件");
  }

  const apiEndpoint = await getEmailApiEndpoint();
  if (!apiEndpoint) {
    throw new Error("未配置邮件 API Endpoint，无法发送邮件");
  }

  const from = await getEmailFromAddress();
  if (!from) {
    throw new Error("未配置邮件发件人地址");
  }

  const body: {
    from: string;
    subject: string;
    to: string[];
    text: string;
    html?: string;
  } = { from, subject, to, text };

  if (html) {
    body.html = html;
  }

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `发送邮件失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }
}

// 发送验证码到邮箱
async function sendVerificationCode(email: string): Promise<void> {
  const code = generateVerificationCode();

  // 获取 HTML 邮件模板
  const htmlTemplate = await getEmailTemplate(code);
  
  // 纯文本版本（作为备用）
  const textContent = `您的验证码是：${code}\n\n验证码有效期为 10 分钟，请勿泄露给他人。`;

  await sendEmail( 
    "邮箱验证码",
    [email],
    textContent,
    htmlTemplate
  );

  await setVerificationCode(email, code);
}

// 发送注册成功邮件（失败不影响主流程）
async function sendRegisterSuccessEmail(name: string, email: string): Promise<void> {
  try {
    const safeName = name || "用户";
    const htmlTemplate = await getRegisterSuccessTemplate(safeName, email);
    const textContent = [
      `你好，${safeName}！`,
      "你的账号已创建成功。",
      `登录邮箱：${email}`,
      "",
      "如非本人操作，请尽快修改密码。",
    ].join("\n");

    await sendEmail(
      "注册成功",
      [email],
      textContent,
      htmlTemplate
    );
  } catch (error) {
    console.warn("发送注册成功邮件失败:", error);
  }
}

// 验证验证码
async function verifyCode(email: string, code: string): Promise<boolean> {
  const codeData = await getVerificationCode(email);
  
  if (!codeData) {
    return false;
  }

  if (codeData.code === code) {
    await deleteVerificationCode(email);
    return true;
  }

  return false;
}

// 提交基本信息并发送验证码
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

  try {
    await sendVerificationCode(email);
    
    await setRegisterTemp({ name, email, password });

    return {
      ok: true,
      message: "验证码已发送到您的邮箱，请查收",
      step: "verify",
      email,
    };
  } catch (error) {
    console.error("发送验证码失败:", error);
    return {
      ok: false,
      message: `发送验证码失败：${error instanceof Error ? error.message : String(error)}`,
      step: "info",
    };
  }
}

// 验证验证码并完成注册
export async function verifyCodeAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return { ok: false, message: "请输入验证码", step: "verify" };
  }

  if (code.length !== 6) {
    return { ok: false, message: "验证码应为 6 位数字", step: "verify" };
  }

  const registerData = await getRegisterTemp();
  
  if (!registerData) {
    return {
      ok: false,
      message: "注册信息已过期，请重新填写",
      step: "info",
    };
  }

  const isValid = await verifyCode(registerData.email, code);
  
  if (!isValid) {
    return {
      ok: false,
      message: "验证码错误或已过期，请重新获取",
      step: "verify",
      email: registerData.email,
    };
  }

  try {
    // 对密码进行哈希处理
    const hashedPassword = hashPassword(registerData.password);
    
    await saveUserToLibsql(registerData.email, {
      password: hashedPassword,
      name: registerData.name,
    });

    // 发送注册成功邮件（错误仅记录，不阻断流程）
    try {
      await sendRegisterSuccessEmail(registerData.name, registerData.email);
    } catch (error) {
      console.error("发送注册成功邮件失败:", error);
    }
  } catch (error) {
    console.error("保存用户信息失败:", error);
    return {
      ok: false,
      message: "注册失败，请稍后重试",
      step: "verify",
      email: registerData.email,
    };
  }
  
  await deleteRegisterTemp();

  redirect("/login");
}



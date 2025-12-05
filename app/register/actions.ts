"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { get } from "@vercel/edge-config";
import { createClient } from "@libsql/client";
import { readFile } from "fs/promises";
import { join } from "path";

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

// 获取 Resend API Key
async function getResendApiKey(): Promise<string | null> {
  try {
    const resendEmailData = await get<{ api_keys?: string }>("resend_email");
    if (resendEmailData && typeof resendEmailData === "object" && "api_keys" in resendEmailData) {
      return resendEmailData.api_keys ?? null;
    }
    return null;
  } catch (error) {
    console.error("获取 Resend API Key 失败:", error);
    return null;
  }
}

// 获取邮件 API URL
async function getEmailApiUrl(): Promise<string | null> {
  try {
    const resendEmailData = await get<{ api_url?: string }>("resend_email");
    if (resendEmailData && typeof resendEmailData === "object" && "api_url" in resendEmailData) {
      return resendEmailData.api_url ?? null;
    }
    return null;
  } catch (error) {
    console.error("获取 Resend API URL 失败:", error);
    return null;
  }
}

// 获取邮件 API Endpoint
async function getEmailApiEndpoint(): Promise<string | null> {
  try {
    const resendEmailData = await get<{ sender?: { register?: string } }>("resend_email");
    if (
      resendEmailData &&
      typeof resendEmailData === "object" &&
      "sender" in resendEmailData &&
      resendEmailData.sender &&
      typeof resendEmailData.sender === "object" &&
      "register" in resendEmailData.sender
    ) {
      return resendEmailData.sender.register ?? null;
    }
    return null;
  } catch (error) {
    console.error("获取 Resend API Endpoint 失败:", error);
    return null;
  }
}

// 获取发件人地址
async function getEmailFromAddress(): Promise<string | null> {
  try {
    const resendEmailData = await get<{ from?: string; sender?: { from?: string } }>("resend_email");
    if (resendEmailData && typeof resendEmailData === "object") {
      if ("from" in resendEmailData && resendEmailData.from) {
        return resendEmailData.from;
      }
      if ("sender" in resendEmailData && resendEmailData.sender && typeof resendEmailData.sender === "object") {
        const maybeFrom = (resendEmailData.sender as { from?: string }).from;
        if (maybeFrom) return maybeFrom;
      }
    }
    return null;
  } catch (error) {
    console.error("获取邮件发件人失败:", error);
    return null;
  }
}


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

// 获取 libsql 客户端
function getLibsqlClient() {
  const url = process.env.LIBSQL_URL ?? process.env.TURSO_DATABASE_URL;
  const authToken = process.env.LIBSQL_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("未配置 LIBSQL_URL/TURSO_DATABASE_URL，无法连接数据库");
  }

  // authToken 可选，若数据库未开启鉴权则不传
  return createClient(
    authToken
      ? { url, authToken }
      : { url }
  );
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

  const cookieStore = await cookies();
  cookieStore.set(
    `verify_code_${email}`,
    JSON.stringify({ code, timestamp: Date.now() }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    }
  );
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
  const cookieStore = await cookies();
  const codeData = cookieStore.get(`verify_code_${email}`);
  
  if (!codeData) {
    return false;
  }

  try {
    const { code: storedCode, timestamp } = JSON.parse(codeData.value);
    const now = Date.now();
    const expireTime = timestamp + 60 * 10 * 1000;
    
    if (now > expireTime) {
      cookieStore.delete(`verify_code_${email}`);
      return false;
    }

    if (storedCode === code) {
      cookieStore.delete(`verify_code_${email}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("验证码验证失败:", error);
    return false;
  }
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
    
    const cookieStore = await cookies();
    cookieStore.set("register_temp", JSON.stringify({ name, email, password }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

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
    await saveUserToLibsql(registerData.email, {
      password: registerData.password,
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
  
  cookieStore.delete("register_temp");

  redirect("/login");
}

// 保存用户信息到 libsql 数据库
async function saveUserToLibsql(
  email: string,
  userData: { password: string; name?: string }
): Promise<void> {
  const client = getLibsqlClient();

  // 确保表存在
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT
    )
  `);

  // 检查是否已存在
  const existing = await client.execute({
    sql: "SELECT email FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (existing.rows.length > 0) {
    throw new Error("该邮箱已被注册");
  }

  // 插入新用户
  await client.execute({
    sql: "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
    args: [email, userData.password, userData.name ?? null],
  });
}



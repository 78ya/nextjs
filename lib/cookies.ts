import { cookies } from "next/headers";
import { getActiveSessionById } from "@/lib/db/sessions";

/**
 * Cookie 管理工具
 * 统一管理项目中所有 cookie 的设置、获取和删除
 */

// Cookie 配置常量
const COOKIE_CONFIG = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

/**
 * 设置用户会话 cookie
 * @param email 用户邮箱
 * @param maxAge 过期时间（秒），默认 24 小时
 */
export async function setUserSession(
  email: string,
  maxAge: number = 60 * 60 * 24,
  sessionId?: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", JSON.stringify({ email, sid: sessionId || null }), {
    ...COOKIE_CONFIG,
    maxAge,
  });
}

/**
 * 获取用户会话
 * @returns 用户邮箱，如果不存在返回 null
 */
export async function getUserSession(): Promise<string | null> {
  const info = await getUserSessionInfo();
  return info?.email || null;
}

/**
 * 获取用户会话详情（包含 sid）
 * - 兼容旧 cookie：{ email }
 * - 新 cookie：{ email, sid }
 * - 如果 sid 存在，会校验该 sid 是否在 sessions 表中处于有效状态；无效则返回 null
 */
export async function getUserSessionInfo(): Promise<{ email: string; sid: string | null } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  
  if (!session) {
    return null;
  }

  try {
    const data = JSON.parse(session.value);
    const email = (data?.email as string | undefined) || null;
    const sid = (data?.sid as string | undefined) || null;
    if (!email) return null;

    // 如果存在 sid，则必须校验 sid 是否有效（防止伪造 cookie）
    if (sid) {
      const s = await getActiveSessionById(sid);
      if (!s) return null;
      if (s.email !== email) return null;
    }

    return { email, sid };
  } catch {
    return null;
  }
}

/**
 * 获取当前会话 sid（不存在则返回 null）
 */
export async function getUserSessionId(): Promise<string | null> {
  const info = await getUserSessionInfo();
  return info?.sid || null;
}

/**
 * 删除用户会话 cookie
 */
export async function deleteUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

/**
 * 设置管理员会话 cookie
 * @param account 管理员账号
 * @param maxAge 过期时间（秒），默认 7 天
 */
export async function setAdminSession(
  account: string,
  maxAge: number = 60 * 60 * 24 * 7
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", JSON.stringify({ account, loggedIn: true }), {
    ...COOKIE_CONFIG,
    maxAge,
  });
}

/**
 * 获取管理员会话
 * @returns 管理员账号，如果不存在返回 null
 */
export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  
  if (!session) {
    return null;
  }

  try {
    const data = JSON.parse(session.value);
    return data.account || null;
  } catch {
    return null;
  }
}

/**
 * 删除管理员会话 cookie
 */
export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

/**
 * 设置验证码 cookie
 * @param email 用户邮箱
 * @param code 验证码
 * @param maxAge 过期时间（秒），默认 10 分钟
 */
export async function setVerificationCode(
  email: string,
  code: string,
  maxAge: number = 60 * 10
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    `verify_code_${email}`,
    JSON.stringify({ code, timestamp: Date.now() }),
    {
      ...COOKIE_CONFIG,
      maxAge,
    }
  );
}

/**
 * 获取验证码
 * @param email 用户邮箱
 * @returns 验证码和时间戳，如果不存在或已过期返回 null
 */
export async function getVerificationCode(
  email: string
): Promise<{ code: string; timestamp: number } | null> {
  const cookieStore = await cookies();
  const codeData = cookieStore.get(`verify_code_${email}`);
  
  if (!codeData) {
    return null;
  }

  try {
    const data = JSON.parse(codeData.value);
    const now = Date.now();
    const expireTime = data.timestamp + 60 * 10 * 1000; // 10 分钟
    
    if (now > expireTime) {
      // 已过期，删除 cookie
      cookieStore.delete(`verify_code_${email}`);
      return null;
    }

    return {
      code: data.code,
      timestamp: data.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * 删除验证码 cookie
 * @param email 用户邮箱
 */
export async function deleteVerificationCode(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`verify_code_${email}`);
}

/**
 * 设置注册临时数据 cookie
 * @param data 注册数据
 * @param maxAge 过期时间（秒），默认 10 分钟
 */
export async function setRegisterTemp(
  data: { name: string; email: string; password: string },
  maxAge: number = 60 * 10
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("register_temp", JSON.stringify(data), {
    ...COOKIE_CONFIG,
    maxAge,
  });
}

/**
 * 获取注册临时数据
 * @returns 注册数据，如果不存在返回 null
 */
export async function getRegisterTemp(): Promise<{
  name: string;
  email: string;
  password: string;
} | null> {
  const cookieStore = await cookies();
  const tempData = cookieStore.get("register_temp");
  
  if (!tempData) {
    return null;
  }

  try {
    return JSON.parse(tempData.value);
  } catch {
    return null;
  }
}

/**
 * 删除注册临时数据 cookie
 */
export async function deleteRegisterTemp(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("register_temp");
}


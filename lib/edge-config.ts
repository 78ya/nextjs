import { get } from "@vercel/edge-config";

/**
 * 从 Edge Config Store 获取维护模式状态
 * 
 * @returns {Promise<boolean>} 维护模式是否启用
 * 
 * 配置结构：
 * Edge Config key: "admin"
 * JSON 格式: { "MAINTENANCE_MODE": "true" | "false" }
 * 
 * 如果 Edge Config 获取失败或没有配置，默认返回 false（不启用维护模式）
 */
export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const adminConfig = await get<{ MAINTENANCE_MODE?: string }>("admin");
    
    if (adminConfig && typeof adminConfig === "object" && "MAINTENANCE_MODE" in adminConfig) {
      return adminConfig.MAINTENANCE_MODE === "true";
    }
    
    // Edge Config 中没有配置，默认不启用维护模式
    return false;
  } catch (error) {
    // Edge Config 获取失败时，默认不启用维护模式
    console.error("获取 Edge Config 失败:", error);
    return false;
  }
}

/**
 * 从 Edge Config Store 获取 Resend API Key
 * 
 * @returns {Promise<string | null>} Resend API Key，获取失败返回 null
 * 
 * 配置结构：
 * Edge Config key: "resend_email"
 * JSON 格式: { "api_keys": "string" }
 */
export async function getResendApiKey(): Promise<string | null> {
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

/**
 * 从 Edge Config Store 获取邮件 API Endpoint
 * 
 * @returns {Promise<string | null>} 邮件 API Endpoint，获取失败返回 null
 * 
 * 配置结构：
 * Edge Config key: "resend_email"
 * JSON 格式: { "api_url": "string" }
 */
export async function getEmailApiEndpoint(): Promise<string | null> {
  try {
    const resendEmailData = await get<{ api_url?: string }>("resend_email");
    if (resendEmailData && typeof resendEmailData === "object" && "api_url" in resendEmailData) {
      return resendEmailData.api_url ?? null;
    }
    return null;
  } catch (error) {
    console.error("获取 Resend API Endpoint 失败:", error);
    return null;
  }
}

/**
 * 从 Edge Config Store 获取邮件发件人地址
 * 
 * @returns {Promise<string | null>} 发件人地址，获取失败返回 null
 * 
 * 配置结构：
 * Edge Config key: "resend_email"
 * JSON 格式: { 
 *   "sender": { "register": "string", "from": "string" },
 *   "from": "string"
 * }
 * 
 * 优先级：sender.register > sender.from > from
 */
export async function getEmailFromAddress(): Promise<string | null> {
  try {
    const resendEmailData = await get<{ sender?: { register?: string; from?: string }; from?: string }>("resend_email");
    if (resendEmailData && typeof resendEmailData === "object") {
      // 优先读取 sender.register
      const sender = resendEmailData.sender;
      if (sender && typeof sender === "object") {
        if ("register" in sender && sender.register) {
          return sender.register;
        }
        if ("from" in sender && sender.from) {
          return sender.from;
        }
      }
      // 退回顶层 from
      if ("from" in resendEmailData && resendEmailData.from) {
        return resendEmailData.from;
      }
    }
    return null;
  } catch (error) {
    console.error("获取邮件发件人失败:", error);
    return null;
  }
}

/**
 * 从 Edge Config Store 获取数据库配置
 * 
 * @returns {Promise<{ url: string | null; authToken: string | null }>} 数据库 URL 和认证 Token
 * 
 * 配置结构：
 * Edge Config key: "database" 或 "libsql"
 * JSON 格式: { 
 *   "url": "string",
 *   "auth_token": "string" (可选)
 * }
 * 
 * 如果 Edge Config 获取失败，会回退到环境变量
 */
export async function getDatabaseConfig(): Promise<{ url: string | null; authToken: string | null }> {
  try {
    // 尝试从 database key 获取
    const databaseConfig = await get<{ url?: string; auth_token?: string }>("database");
    if (databaseConfig && typeof databaseConfig === "object" && "url" in databaseConfig) {
      return {
        url: databaseConfig.url ?? null,
        authToken: databaseConfig.auth_token ?? null,
      };
    }

    // 尝试从 libsql key 获取
    const libsqlConfig = await get<{ url?: string; auth_token?: string }>("libsql");
    if (libsqlConfig && typeof libsqlConfig === "object" && "url" in libsqlConfig) {
      return {
        url: libsqlConfig.url ?? null,
        authToken: libsqlConfig.auth_token ?? null,
      };
    }

    // Edge Config 中没有配置，回退到环境变量
    return {
      url: process.env.LIBSQL_URL ?? process.env.TURSO_DATABASE_URL ?? null,
      authToken: process.env.LIBSQL_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? null,
    };
  } catch (error) {
    // Edge Config 获取失败时，回退到环境变量
    console.error("获取数据库配置失败，使用环境变量:", error);
    return {
      url: process.env.LIBSQL_URL ?? process.env.TURSO_DATABASE_URL ?? null,
      authToken: process.env.LIBSQL_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? null,
    };
  }
}


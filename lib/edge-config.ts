import { get } from "@vercel/edge-config";

/**
 * 基本函数：从 Edge Config Store 获取配置值
 * 
 * @param path 配置路径，格式如 "/admin/MAINTENANCE_MODE" 或 "/admin"
 *             路径格式：/key 或 /key/property 或 /key/nested/property
 * @returns Promise<T | null> 配置值，获取失败返回 null
 * 
 * @example
 * // 获取整个 admin 对象
 * const admin = await getEdgeConfig("/admin");
 * 
 * // 获取 admin 下的 MAINTENANCE_MODE 属性
 * const mode = await getEdgeConfig("/admin/MAINTENANCE_MODE");
 * 
 * // 获取嵌套属性
 * const sender = await getEdgeConfig("/resend_email/sender/register");
 */
export async function getEdgeConfig<T = unknown>(path: string): Promise<T | null> {
  try {
    // 移除开头的斜杠并分割路径
    const parts = path.replace(/^\//, "").split("/");
    if (parts.length === 0 || !parts[0]) {
      return null;
    }

    const key = parts[0];
    const propertyPath = parts.slice(1);

    // 获取配置对象
    const config = await get<unknown>(key);

    if (!config || typeof config !== "object") {
      return null;
    }

    // 如果没有属性路径，返回整个对象
    if (propertyPath.length === 0) {
      return config as T;
    }

    // 遍历属性路径获取嵌套值
    let value: unknown = config;
    for (const prop of propertyPath) {
      if (value && typeof value === "object" && prop in value) {
        value = (value as Record<string, unknown>)[prop];
      } else {
        return null;
      }
    }

    return value as T;
  } catch (error) {
    // 在本地开发时，这是正常情况，不需要记录错误
    if (process.env.NODE_ENV !== "development") {
      console.error(`获取 Edge Config 失败 (路径: ${path}):`, error);
    }
    return null;
  }
}

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
  const mode = await getEdgeConfig<string>("/admin/MAINTENANCE_MODE");
  return mode === "true";
}

/**
 * 从 Edge Config Store 获取管理员配置
 * 
 * @returns {Promise<{ url: string; account: string; password: string }>} 管理员配置
 * 
 * 配置结构：
 * Edge Config key: "admin"
 * JSON 格式: { 
 *   "url": "string",
 *   "account": "string",
 *   "password": "string"
 * }
 * 
 * 如果 Edge Config 获取失败，返回默认值
 */
export async function getAdminConfig(): Promise<{ url: string; account: string; password: string }> {
  const cfg = await getEdgeConfig<{ url?: string; account?: string; password?: string }>("/admin");

  if (cfg && typeof cfg === "object") {
    return {
      url: cfg.url || "/admin",
      account: cfg.account || "admin",
      password: cfg.password || "admin",
    };
  }

  // Edge Config 中没有配置，返回默认值
  return {
    url: "/admin",
    account: "admin",
    password: "admin",
  };
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
  return await getEdgeConfig<string>("/resend_email/api_keys");
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
  return await getEdgeConfig<string>("/resend_email/api_url");
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
  // 优先读取 sender.register
  const register = await getEdgeConfig<string>("/resend_email/sender/register");
  if (register) {
    return register;
  }

  // 其次读取 sender.from
  const senderFrom = await getEdgeConfig<string>("/resend_email/sender/from");
  if (senderFrom) {
    return senderFrom;
  }

  // 最后读取顶层 from
  return await getEdgeConfig<string>("/resend_email/from");
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
  // 优先检查环境变量，如果存在则直接返回（避免在本地开发时连接 Edge Config）
  const envUrl = process.env.LIBSQL_URL ?? process.env.TURSO_DATABASE_URL;
  if (envUrl) {
    return {
      url: envUrl,
      authToken: process.env.LIBSQL_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? null,
    };
  }

  // 如果没有环境变量，尝试从 Edge Config 获取（仅在生产环境或配置了 Edge Config 时）
  // 尝试从 database key 获取
  const databaseConfig = await getEdgeConfig<{ url?: string; auth_token?: string }>("/database");
  if (databaseConfig && typeof databaseConfig === "object" && "url" in databaseConfig) {
    return {
      url: databaseConfig.url ?? null,
      authToken: databaseConfig.auth_token ?? null,
    };
  }

  // 尝试从 libsql key 获取
  const libsqlConfig = await getEdgeConfig<{ url?: string; auth_token?: string }>("/libsql");
  if (libsqlConfig && typeof libsqlConfig === "object" && "url" in libsqlConfig) {
    return {
      url: libsqlConfig.url ?? null,
      authToken: libsqlConfig.auth_token ?? null,
    };
  }

  // Edge Config 中没有配置，返回 null
  return {
    url: null,
    authToken: null,
  };
}

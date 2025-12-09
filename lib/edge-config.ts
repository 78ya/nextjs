import { get } from "@vercel/edge-config";

/**
 * 获取 Edge Config API 端点
 * 从环境变量 EDGE_CONFIG_API_URL 获取，如果没有则使用默认的 Vercel API 端点
 * 
 * 配置方式：
 * 在 .env.local 或环境变量中设置：
 * EDGE_CONFIG_API_URL=https://api.vercel.com/v1/edge-config
 * 
 * 如果不设置，默认使用 Vercel 官方 API 端点
 */
function getEdgeConfigApiUrl(): string {
  return process.env.EDGE_CONFIG_API_URL || "https://api.vercel.com/v1/edge-config";
}

/**
 * 获取 Edge Config ID 和 API Token
 * 从环境变量 EDGE_CONFIG 中解析，格式：https://edge-config.vercel.com/<id>?token=<token>
 * 或者分别从 EDGE_CONFIG_ID 和 VERCEL_API_TOKEN 环境变量获取
 */
function getEdgeConfigCredentials(): { id: string | null; token: string | null } {
  // 方式1：从 EDGE_CONFIG 环境变量解析（格式：https://edge-config.vercel.com/<id>?token=<token>）
  const edgeConfigUrl = process.env.EDGE_CONFIG;
  if (edgeConfigUrl) {
    try {
      const url = new URL(edgeConfigUrl);
      const id = url.pathname.split("/").pop() || null;
      const token = url.searchParams.get("token");
      if (id && token) {
        return { id, token };
      }
    } catch {
      // URL 解析失败，继续尝试其他方式
    }
  }

  // 方式2：从独立的环境变量获取
  const id = process.env.EDGE_CONFIG_ID || null;
  const token = process.env.VERCEL_API_TOKEN || process.env.EDGE_CONFIG_TOKEN || null;

  return { id, token };
}

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
 * @returns {Promise<string | null>} 发件人地址，格式为 "名字 <邮箱>" 或 "<邮箱>"，获取失败返回 null
 * 
 * 配置结构：
 * Edge Config key: "resend_email"
 * JSON 格式: { 
 *   "email_username": "string",  // 发送名字，如 "78ya 的私人博客"
 *   "from": "string",             // 发送邮箱，如 "login@78ya.me" 或 "<login@78ya.me>"
 *   "sender": { 
 *     "register": "string", 
 *     "from": "string" 
 *   }
 * }
 * 
 * 邮箱优先级：from > sender.register > sender.from
 * 如果 email_username 为空，只返回邮箱（保持原有格式）
 * 如果 email_username 不为空，返回 "名字 <邮箱>" 格式
 * 
 * @example
 * // 配置示例
 * email_username: "78ya 的私人博客"
 * from: "login@78ya.me" 或 "<login@78ya.me>"
 * // 返回: "78ya 的私人博客 <login@78ya.me>"
 */
export async function getEmailFromAddress(): Promise<string | null> {
  const emailUsername = await getEdgeConfig<string>("/resend_email/email_username");
  let from = await getEdgeConfig<string>("/resend_email/from");
  
  if (!from) {
    from = await getEdgeConfig<string>("/resend_email/sender/register");
  }
  
  if (!from) {
    from = await getEdgeConfig<string>("/resend_email/sender/from");
  }
  
  if (!from) {
    return null;
  }
  const cleanEmail = from.replace(/^<|>$/g, "");
  if (!emailUsername || emailUsername.trim() === "") {
    return from.includes("<") ? from : `<${cleanEmail}>`;
  }
  
  return `${emailUsername} <${cleanEmail}>`;
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

/**
 * 基本函数：向 Edge Config Store 写入配置值
 * 
 * @param path 配置路径，格式如 "/admin/MAINTENANCE_MODE" 或 "/admin"
 *             路径格式：/key 或 /key/property 或 /key/nested/property
 * @param value 要写入的值（可以是字符串、数字、布尔值、对象等）
 * @returns Promise<boolean> 写入是否成功
 * 
 * @example
 * // 写入嵌套属性
 * await setEdgeConfig("/resend_email/sender/register", "noreply@example.com");
 * 
 * 注意：
 * - 需要配置环境变量：
 *   1. EDGE_CONFIG（格式：https://edge-config.vercel.com/<id>?token=<token>）
 *      或者分别配置 EDGE_CONFIG_ID 和 VERCEL_API_TOKEN
 *   2. EDGE_CONFIG_API_URL（可选，默认：https://api.vercel.com/v1/edge-config）
 * - 写入操作会替换整个 key 的值，如果要更新嵌套属性，需要先读取整个对象，修改后再写入
 */
export async function setEdgeConfig(path: string, value: unknown): Promise<boolean> {
  try {
    const { id, token } = getEdgeConfigCredentials();

    if (!id || !token) {
      console.error("Edge Config 凭据未配置，请设置 EDGE_CONFIG 或 EDGE_CONFIG_ID + VERCEL_API_TOKEN");
      return false;
    }

    // 解析路径
    const parts = path.replace(/^\//, "").split("/");
    if (parts.length === 0 || !parts[0]) {
      console.error("无效的路径格式");
      return false;
    }

    const key = parts[0];
    const propertyPath = parts.slice(1);

    // 如果路径只有 key（没有属性路径），直接写入整个值
    if (propertyPath.length === 0) {
      const apiUrl = getEdgeConfigApiUrl();
      const response = await fetch(`${apiUrl}/${id}/items`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: {
            [key]: value,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`写入 Edge Config 失败 (路径: ${path}):`, error);
        return false;
      }

      return true;
    }

    // 如果有属性路径，需要先读取整个对象，然后更新嵌套属性
    const currentConfig = await get<unknown>(key);
    let updatedValue: unknown;

    if (!currentConfig || typeof currentConfig !== "object") {
      // 如果 key 不存在，创建新的嵌套对象
      updatedValue = createNestedObject(propertyPath, value);
    } else {
      // 更新现有对象的嵌套属性
      updatedValue = updateNestedObject(
        currentConfig as Record<string, unknown>,
        propertyPath,
        value
      );
    }

    // 写入更新后的对象
    const apiUrl = getEdgeConfigApiUrl();
    const response = await fetch(`${apiUrl}/${id}/items`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: {
          [key]: updatedValue,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`写入 Edge Config 失败 (路径: ${path}):`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`写入 Edge Config 失败 (路径: ${path}):`, error);
    return false;
  }
}

/**
 * 创建嵌套对象
 */
function createNestedObject(path: string[], value: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] = {};
    current = current[path[i]] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = value;
  return result;
}

/**
 * 更新嵌套对象的属性
 */
function updateNestedObject(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in current) || typeof current[path[i]] !== "object" || current[path[i]] === null) {
      current[path[i]] = {};
    }
    current = current[path[i]] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = value;
  return result;
}

/**
 * 删除 Edge Config 中的配置项
 * 
 * @param path 配置路径，格式如 "/admin" 或 "/admin/MAINTENANCE_MODE"
 * @returns Promise<boolean> 删除是否成功
 * 
 * @example
 * // 删除整个 admin 对象
 * await deleteEdgeConfig("/admin");
 * 
 * // 删除 admin 下的 MAINTENANCE_MODE 属性（需要先读取，删除属性后重新写入）
 * const admin = await getEdgeConfig("/admin");
 * if (admin && typeof admin === "object") {
 *   delete (admin as Record<string, unknown>).MAINTENANCE_MODE;
 *   await setEdgeConfig("/admin", admin);
 * }
 */
export async function deleteEdgeConfig(path: string): Promise<boolean> {
  try {
    const { id, token } = getEdgeConfigCredentials();

    if (!id || !token) {
      console.error("Edge Config 凭据未配置");
      return false;
    }

    // 解析路径
    const parts = path.replace(/^\//, "").split("/");
    if (parts.length === 0 || !parts[0]) {
      console.error("无效的路径格式");
      return false;
    }

    const key = parts[0];
    const propertyPath = parts.slice(1);

    // 如果路径只有 key，删除整个 key
    if (propertyPath.length === 0) {
      const apiUrl = getEdgeConfigApiUrl();
      const response = await fetch(`${apiUrl}/${id}/items`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: {
            [key]: null, // 设置为 null 表示删除
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`删除 Edge Config 失败 (路径: ${path}):`, error);
        return false;
      }

      return true;
    }

    // 如果有属性路径，需要先读取，删除属性后重新写入
    const currentConfig = await get<unknown>(key);
    if (!currentConfig || typeof currentConfig !== "object") {
      return false;
    }

    const updatedValue = deleteNestedProperty(
      currentConfig as Record<string, unknown>,
      propertyPath
    );

    const apiUrl = getEdgeConfigApiUrl();
    const response = await fetch(`${apiUrl}/${id}/items`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: {
          [key]: updatedValue,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`删除 Edge Config 失败 (路径: ${path}):`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`删除 Edge Config 失败 (路径: ${path}):`, error);
    return false;
  }
}

/**
 * 删除嵌套对象的属性
 */
function deleteNestedProperty(
  obj: Record<string, unknown>,
  path: string[]
): Record<string, unknown> {
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in current) || typeof current[path[i]] !== "object" || current[path[i]] === null) {
      return result; // 路径不存在，无需删除
    }
    current = { ...(current[path[i]] as Record<string, unknown>) };
    result[path[i]] = current;
  }

  delete current[path[path.length - 1]];
  return result;
}

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


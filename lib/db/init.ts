/**
 * 数据库初始化模块
 * 用于在服务器启动时初始化数据库结构
 */

import { ensureUsersTable} from "./schema";

/**
 * 初始化数据库
 * 确保所有必需的表都已创建
 */
export async function initializeDatabase(): Promise<void> {
  console.log("[数据库初始化] 开始初始化数据库表...");

  try {
    // 初始化 users 表
    await ensureUsersTable();
    console.log("[数据库初始化] ✅ users 表初始化成功");

    // 可以在这里添加其他表的初始化
    // 例如：
    // await ensurePostsTable();
    // await ensureCommentsTable();

    console.log("[数据库初始化] ✅ 所有数据库表初始化完成");
  } catch (error) {
    console.error("[数据库初始化] ❌ 数据库初始化失败:", error);
    throw error; // 重新抛出错误，让调用者决定如何处理
  }
}
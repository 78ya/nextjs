"use server";

import { getLibsqlClient } from "./client";
import { ensureUsersTable } from "./schema";

// 确保 users 表包含 avatar 列（用于老表迁移）
async function ensureAvatarColumn(client: Awaited<ReturnType<typeof getLibsqlClient>>): Promise<void> {
  try {
    const info = await client.execute({
      sql: "PRAGMA table_info(users)",
    });
    const columns = info.rows.map((row: any) => row.name);
    if (!columns.includes("avatar")) {
      console.info("[db/ensureAvatarColumn] adding avatar column");
      await client.execute({
        sql: "ALTER TABLE users ADD COLUMN avatar TEXT",
      });
      console.info("[db/ensureAvatarColumn] avatar column added");
    }
  } catch (error) {
    console.error("[db/ensureAvatarColumn] failed", error);
  }
}

/**
 * 保存用户信息到数据库（注册时使用）
 * @param email 用户邮箱
 * @param userData 用户数据，包含密码和可选的名称
 * @throws 如果邮箱已被注册，抛出错误
 */
export async function saveUserToLibsql(
  email: string,
  userData: { password: string; name?: string }
): Promise<void> {
  const client = await getLibsqlClient();

  // 确保表存在
  await ensureUsersTable();

  // 检查是否已存在
  const existing = await client.execute({
    sql: "SELECT email FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (existing.rows.length > 0) {
    throw new Error("该邮箱已被注册");
  }

  // 插入新用户（role 默认为 'user'）
  await client.execute({
    sql: "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
    args: [email, userData.password, userData.name ?? null, 'user'],
  });
}

/**
 * 根据邮箱获取用户信息
 * @param email 用户邮箱
 * @returns 用户信息，如果不存在返回 null
 */
export async function getUserByEmail(email: string): Promise<{
  email: string;
  password: string;
  name: string | null;
  avatar: string | null;
} | null> {
  const client = await getLibsqlClient();
  
  // 老表迁移：确保 avatar 列存在
  await ensureAvatarColumn(client);

  // 调试日志：查询用户
  console.info("[db/getUserByEmail] query", { email });

  const result = await client.execute({
    sql: "SELECT email, password, name, avatar FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (result.rows.length === 0) {
    console.warn("[db/getUserByEmail] not found", { email });
    return null;
  }

  const row = result.rows[0] as unknown as {
    email: string;
    password: string;
    name: string | null;
    avatar: string | null;
  };
  
  console.info("[db/getUserByEmail] found", {
    email: row.email,
    hasAvatar: !!row.avatar,
    name: row.name,
  });

  return {
    email: row.email,
    password: row.password,
    name: row.name,
    avatar: row.avatar,
  };
}

/**
 * 更新用户信息
 * @param email 用户邮箱
 * @param updates 要更新的字段
 */
export async function updateUser(
  email: string,
  updates: { name?: string; password?: string; avatar?: string | null }
): Promise<void> {
  const client = await getLibsqlClient();
  // 老表迁移：确保 avatar 列存在
  await ensureAvatarColumn(client);
  
  if (updates.password) {
    await client.execute({
      sql: "UPDATE users SET password = ? WHERE email = ?",
      args: [updates.password, email],
    });
  }
  
  if (updates.name !== undefined) {
    await client.execute({
      sql: "UPDATE users SET name = ? WHERE email = ?",
      args: [updates.name, email],
    });
  }

  if (updates.avatar !== undefined) {
    await client.execute({
      sql: "UPDATE users SET avatar = ? WHERE email = ?",
      args: [updates.avatar, email],
    });
  }
}

/**
 * 删除用户
 * @param email 用户邮箱
 */
export async function deleteUser(email: string): Promise<void> {
  const client = await getLibsqlClient();
  
  await client.execute({
    sql: "DELETE FROM users WHERE email = ?",
    args: [email],
  });
}


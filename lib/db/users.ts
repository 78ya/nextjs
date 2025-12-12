"use server";

import { getLibsqlClient } from "./client";
import { ensureUsersTable, ensureRoleRequestsTable, ensureAuditLogsTable } from "./schema";

// 确保 users 表包含新增列（用于老表迁移）
async function ensureUserColumns(client: Awaited<ReturnType<typeof getLibsqlClient>>): Promise<void> {
  try {
    const info = await client.execute({
      sql: "PRAGMA table_info(users)",
    });
    const columns = info.rows.map((row: any) => row.name);

    if (!columns.includes("avatar")) {
      console.info("[db/ensureUserColumns] adding avatar column");
      await client.execute({ sql: "ALTER TABLE users ADD COLUMN avatar TEXT" });
    }

    if (!columns.includes("status")) {
      console.info("[db/ensureUserColumns] adding status column");
      await client.execute({ sql: "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'" });
    }

    if (!columns.includes("created_at")) {
      console.info("[db/ensureUserColumns] adding created_at column");
      // SQLite 不允许在 ALTER TABLE 时使用非常量默认值（如 CURRENT_TIMESTAMP）
      await client.execute({ sql: "ALTER TABLE users ADD COLUMN created_at TEXT" });
      await client.execute({ sql: "UPDATE users SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)" });
    }
  } catch (error) {
    console.error("[db/ensureUserColumns] failed", error);
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
  await ensureUserColumns(client);

  // 检查是否已存在
  const existing = await client.execute({
    sql: "SELECT email FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (existing.rows.length > 0) {
    throw new Error("该邮箱已被注册");
  }

  // 插入新用户（role 默认为 'editor'，status 为 active）
  await client.execute({
    sql: "INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, ?, 'active')",
    args: [email, userData.password, userData.name ?? null, "editor"],
  });
}

/**
 * 根据邮箱获取用户信息
 * @param email 用户邮箱
 * @returns 用户信息，如果不存在返回 null
 */
export async function getUserByEmail(email: string): Promise<{
  id?: number;
  email: string;
  password: string;
  name: string | null;
  avatar: string | null;
  role: string | null;
  status: string | null;
} | null> {
  const client = await getLibsqlClient();
  
  // 老表迁移：确保 avatar 列存在
  await ensureUserColumns(client);

  // 调试日志：查询用户
  console.info("[db/getUserByEmail] query", { email });

  const result = await client.execute({
    sql: "SELECT id, email, password, name, avatar, role, status FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (result.rows.length === 0) {
    console.warn("[db/getUserByEmail] not found", { email });
    return null;
  }

  const row = result.rows[0] as unknown as {
    id?: number;
    email: string;
    password: string;
    name: string | null;
    avatar: string | null;
    role: string | null;
    status: string | null;
  };
  
  console.info("[db/getUserByEmail] found", {
    email: row.email,
    hasAvatar: !!row.avatar,
    name: row.name,
    role: row.role,
    status: row.status,
  });

  return {
    email: row.email,
    password: row.password,
    name: row.name,
    avatar: row.avatar,
    role: row.role,
    status: row.status,
    id: row.id,
  };
}

/**
 * 更新用户信息
 * @param email 用户邮箱
 * @param updates 要更新的字段
 */
export async function updateUser(
  email: string,
  updates: { name?: string; password?: string; avatar?: string | null; role?: string; status?: string | null }
): Promise<void> {
  const client = await getLibsqlClient();
  // 老表迁移：确保必要列存在
  await ensureUserColumns(client);
  
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

  if (updates.role !== undefined) {
    await client.execute({
      sql: "UPDATE users SET role = ? WHERE email = ?",
      args: [updates.role, email],
    });
  }

  if (updates.status !== undefined) {
    await client.execute({
      sql: "UPDATE users SET status = ? WHERE email = ?",
      args: [updates.status, email],
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

// 仅用于角色/状态管理的基础操作
export async function getUserById(
  id: number
): Promise<{ id: number; email: string; name: string | null; avatar: string | null; role: string; status: string } | null> {
  const client = await getLibsqlClient();
  await ensureUsersTable();
  await ensureUserColumns(client);

  const res = await client.execute({
    sql: "SELECT id, email, name, avatar, role, status FROM users WHERE id = ? LIMIT 1",
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0] as any;
  return {
    id: row.id as number,
    email: row.email as string,
    name: row.name as string | null,
    avatar: row.avatar as string | null,
    role: row.role as string,
    status: row.status as string,
  };
}

export async function listUsersAdmin(params: {
  search?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total: number }> {
  const client = await getLibsqlClient();
  await ensureUsersTable();
  await ensureUserColumns(client);

  const limit = Math.min(params.limit ?? 20, 100);
  const offset = Math.max(params.offset ?? 0, 0);

  const conditions: string[] = [];
  const args: any[] = [];
  if (params.search) {
    conditions.push("(email LIKE ? OR name LIKE ?)");
    args.push(`%${params.search}%`, `%${params.search}%`);
  }
  if (params.role) {
    conditions.push("role = ?");
    args.push(params.role);
  }
  if (params.status) {
    conditions.push("status = ?");
    args.push(params.status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await client.execute({
    sql: `SELECT COUNT(*) as cnt FROM users ${where}`,
    args,
  });
  const total = Number((totalRes.rows[0] as any)?.cnt ?? 0);

  const listRes = await client.execute({
    sql: `
      SELECT id, email, name, avatar, role, status, created_at
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [...args, limit, offset],
  });

  const items = listRes.rows.map((row: any) => ({
    id: row.id as number,
    email: row.email as string,
    name: row.name as string | null,
    avatar: row.avatar as string | null,
    role: row.role as string,
    status: row.status as string,
    created_at: row.created_at as string | null,
  }));

  return { items, total };
}

export async function updateUserRoleStatusById(
  id: number,
  updates: { role?: string; status?: string }
): Promise<void> {
  const client = await getLibsqlClient();
  await ensureUsersTable();
  await ensureUserColumns(client);

  const fields: string[] = [];
  const args: any[] = [];
  if (updates.role !== undefined) {
    fields.push("role = ?");
    args.push(updates.role);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    args.push(updates.status);
  }
  if (!fields.length) return;

  args.push(id);

  await client.execute({
    sql: `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function createRoleRequest(params: {
  userId: number;
  targetRole: string;
  reason?: string;
}): Promise<number> {
  const client = await getLibsqlClient();
  await ensureUsersTable();
  await ensureUserColumns(client);
  await ensureRoleRequestsTable();
  const res = await client.execute({
    sql: `INSERT INTO role_requests (user_id, target_role, reason, status) VALUES (?, ?, ?, 'pending')`,
    args: [params.userId, params.targetRole, params.reason ?? null],
  });
  const id = (res.lastInsertRowid as number) ?? 0;
  return id;
}

export async function updateRoleRequest(params: {
  id: number;
  status: "approved" | "rejected";
  reviewedBy: number;
  remark?: string;
}): Promise<void> {
  const client = await getLibsqlClient();
  await ensureRoleRequestsTable();
  await client.execute({
    sql: `
      UPDATE role_requests
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, remark = ?
      WHERE id = ?
    `,
    args: [params.status, params.reviewedBy, params.remark ?? null, params.id],
  });
}

export async function logAudit(params: {
  actorId: number | null;
  targetUserId: number | null;
  action: string;
  beforeRole?: string | null;
  afterRole?: string | null;
  beforeStatus?: string | null;
  afterStatus?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const client = await getLibsqlClient();
  await ensureAuditLogsTable();
  await client.execute({
    sql: `
      INSERT INTO audit_logs
        (actor_id, target_user_id, action, before_role, after_role, before_status, after_status, ip, user_agent)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      params.actorId ?? null,
      params.targetUserId ?? null,
      params.action,
      params.beforeRole ?? null,
      params.afterRole ?? null,
      params.beforeStatus ?? null,
      params.afterStatus ?? null,
      params.ip ?? null,
      params.userAgent ?? null,
    ],
  });
}


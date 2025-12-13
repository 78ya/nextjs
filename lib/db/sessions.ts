"use server";

import crypto from "crypto";
import { getLibsqlClient } from "./client";
import { ensureSessionsTable, ensureUsersTable } from "./schema";

function nowIso() {
  return new Date().toISOString();
}

function toIso(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  try {
    return new Date(value).toISOString();
  } catch {
    return String(value);
  }
}

async function ensureSessionColumns(client: Awaited<ReturnType<typeof getLibsqlClient>>): Promise<void> {
  await ensureSessionsTable();
  try {
    const info = await client.execute({ sql: "PRAGMA table_info(sessions)" });
    const columns = info.rows.map((r: any) => r.name);

    // 这些列是为了“真实会话管理”新增的；老表没有则补齐
    if (!columns.includes("last_active_at")) {
      await client.execute({ sql: "ALTER TABLE sessions ADD COLUMN last_active_at TEXT" });
      // 回填：没有 last_active_at 时，用 created_at 填充
      await client.execute({
        sql: "UPDATE sessions SET last_active_at = COALESCE(last_active_at, created_at)",
      });
    }

    if (!columns.includes("revoked_at")) {
      await client.execute({ sql: "ALTER TABLE sessions ADD COLUMN revoked_at TEXT" });
    }

    if (!columns.includes("ip")) {
      await client.execute({ sql: "ALTER TABLE sessions ADD COLUMN ip TEXT" });
    }

    if (!columns.includes("user_agent")) {
      await client.execute({ sql: "ALTER TABLE sessions ADD COLUMN user_agent TEXT" });
    }

    if (!columns.includes("device")) {
      await client.execute({ sql: "ALTER TABLE sessions ADD COLUMN device TEXT" });
    }

    if (!columns.includes("browser")) {
      await client.execute({ sql: "ALTER TABLE sessions ADD COLUMN browser TEXT" });
    }
  } catch (e) {
    console.error("[db/sessions] ensureSessionColumns failed", e);
  }
}

export function generateSessionId(): string {
  // 兼容 Node 18/20
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
}

export function parseUA(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "未知设备", browser: "未知浏览器" };

  const lower = ua.toLowerCase();
  const isMobile =
    lower.includes("mobile") || lower.includes("iphone") || lower.includes("android") || lower.includes("ipad");

  let device = "桌面设备";
  if (lower.includes("iphone")) device = "iPhone";
  else if (lower.includes("ipad")) device = "iPad";
  else if (lower.includes("android")) device = "Android";
  else if (isMobile) device = "移动设备";
  else if (lower.includes("mac os")) device = "macOS";
  else if (lower.includes("windows")) device = "Windows";
  else if (lower.includes("linux")) device = "Linux";

  // 浏览器：不追求完全精准，只取 UA 前 64 字符作为可识别信息
  const browser = ua.slice(0, 64);
  return { device, browser };
}

export function normalizeIp(ip: string): string {
  if (!ip) return "0.0.0.0";
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  if (ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1] || 0);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export function getClientIpFromHeaders(headers: Headers): string {
  const xf = headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const xr = headers.get("x-real-ip");
  if (xr) return xr;
  return "0.0.0.0";
}

export async function createUserSession(params: {
  userId: number;
  email: string;
  ip: string;
  userAgent: string | null;
  expiresAt: string; // ISO
}): Promise<{ sessionId: string }> {
  const client = await getLibsqlClient();
  await ensureUsersTable();
  await ensureSessionsTable();
  await ensureSessionColumns(client);

  const sessionId = generateSessionId();
  const { device, browser } = parseUA(params.userAgent);

  await client.execute({
    sql: `
      INSERT INTO sessions (session_id, user_id, data, expires_at, created_at, last_active_at, ip, user_agent, device, browser, revoked_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, NULL)
    `,
    args: [
      sessionId,
      params.userId,
      JSON.stringify({ email: params.email }),
      params.expiresAt,
      nowIso(),
      normalizeIp(params.ip),
      params.userAgent || null,
      device,
      browser,
    ],
  });

  return { sessionId };
}

export async function getActiveSessionById(
  sessionId: string
): Promise<{ sessionId: string; userId: number | null; email: string | null; expiresAt: string; revokedAt: string | null } | null> {
  const client = await getLibsqlClient();
  await ensureSessionsTable();
  await ensureSessionColumns(client);

  const res = await client.execute({
    sql: `
      SELECT session_id, user_id, data, expires_at, revoked_at
      FROM sessions
      WHERE session_id = ?
      LIMIT 1
    `,
    args: [sessionId],
  });

  if (!res.rows.length) return null;
  const row = res.rows[0] as any;
  const revokedAt = toIso(row.revoked_at);
  const expiresAt = toIso(row.expires_at) || "";
  if (revokedAt) return null;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return null;

  let email: string | null = null;
  try {
    const data = row.data ? JSON.parse(String(row.data)) : null;
    email = (data?.email as string | undefined) || null;
  } catch {
    email = null;
  }

  return {
    sessionId: String(row.session_id),
    userId: (row.user_id as number | null) ?? null,
    email,
    expiresAt,
    revokedAt,
  };
}

export async function touchSession(sessionId: string): Promise<void> {
  const client = await getLibsqlClient();
  await ensureSessionsTable();
  await ensureSessionColumns(client);

  // 只在有效会话上更新 last_active_at
  await client.execute({
    sql: `
      UPDATE sessions
      SET last_active_at = ?
      WHERE session_id = ? AND revoked_at IS NULL
    `,
    args: [nowIso(), sessionId],
  });
}

export async function listUserSessions(params: {
  userId: number;
  currentSessionId: string | null;
}): Promise<
  Array<{
    id: string;
    device: string;
    browser: string;
    ip: string;
    location: string;
    lastActive: string;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
  }>
> {
  const client = await getLibsqlClient();
  await ensureSessionsTable();
  await ensureSessionColumns(client);

  const res = await client.execute({
    sql: `
      SELECT session_id, ip, device, browser, last_active_at, created_at, expires_at
      FROM sessions
      WHERE user_id = ? AND revoked_at IS NULL
      ORDER BY last_active_at DESC, created_at DESC
      LIMIT 50
    `,
    args: [params.userId],
  });

  return res.rows.map((row: any) => {
    const ip = normalizeIp(String(row.ip || "0.0.0.0"));
    return {
      id: String(row.session_id),
      device: String(row.device || "未知设备"),
      browser: String(row.browser || "未知浏览器"),
      ip,
      location: isPrivateIp(ip) ? "内网地址" : "未知",
      lastActive: toIso(row.last_active_at) || toIso(row.created_at) || nowIso(),
      createdAt: toIso(row.created_at) || nowIso(),
      expiresAt: toIso(row.expires_at) || "",
      isCurrent: !!params.currentSessionId && String(row.session_id) === params.currentSessionId,
    };
  });
}

export async function revokeSession(params: { userId: number; sessionId: string }): Promise<void> {
  const client = await getLibsqlClient();
  await ensureSessionsTable();
  await ensureSessionColumns(client);

  await client.execute({
    sql: `
      UPDATE sessions
      SET revoked_at = ?
      WHERE user_id = ? AND session_id = ? AND revoked_at IS NULL
    `,
    args: [nowIso(), params.userId, params.sessionId],
  });
}

export async function revokeOtherSessions(params: { userId: number; keepSessionId: string | null }): Promise<void> {
  const client = await getLibsqlClient();
  await ensureSessionsTable();
  await ensureSessionColumns(client);

  if (params.keepSessionId) {
    await client.execute({
      sql: `
        UPDATE sessions
        SET revoked_at = ?
        WHERE user_id = ? AND revoked_at IS NULL AND session_id <> ?
      `,
      args: [nowIso(), params.userId, params.keepSessionId],
    });
    return;
  }

  // 没有 current sid 时，视为全部撤销
  await client.execute({
    sql: `
      UPDATE sessions
      SET revoked_at = ?
      WHERE user_id = ? AND revoked_at IS NULL
    `,
    args: [nowIso(), params.userId],
  });
}



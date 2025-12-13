import { getLibsqlClient } from "./client";
import { ensureAuditLogsTable, ensureUsersTable } from "./schema";

export type AuditAction = "role_change" | "disable" | "enable" | string;

export interface AuditLogRecord {
  id: number;
  actor_id: number | null;
  target_user_id: number | null;
  action: AuditAction;
  before_role: string | null;
  after_role: string | null;
  before_status: string | null;
  after_status: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  actor_email?: string | null;
  target_email?: string | null;
}

export async function listAuditLogs(limit = 10): Promise<AuditLogRecord[]> {
  const client = await getLibsqlClient();
  await ensureAuditLogsTable();
  await ensureUsersTable();

  const res = await client.execute({
    sql: `
      SELECT 
        a.*,
        ua.email AS actor_email,
        ut.email AS target_email
      FROM audit_logs a
      LEFT JOIN users ua ON ua.id = a.actor_id
      LEFT JOIN users ut ON ut.id = a.target_user_id
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ?
    `,
    args: [limit],
  });

  return res.rows.map((row: any) => ({
    ...row,
  })) as AuditLogRecord[];
}


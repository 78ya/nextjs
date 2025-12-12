'use server';

import { getLibsqlClient } from "./client";

export type ProviderType = "aliyun" | "tencent" | "cloudflare";

export interface DomainRecord {
  id: number;
  name: string;
  provider_type: ProviderType;
  token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

async function ensureDomainsTable() {
  const client = await getLibsqlClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      token TEXT NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_domains_provider ON domains(provider_type)`);
}

export async function createDomain(params: {
  name: string;
  providerType: ProviderType;
  token: string;
  createdBy?: string | null;
}): Promise<DomainRecord> {
  const client = await getLibsqlClient();
  await ensureDomainsTable();
  await client.execute({
    sql: `
      INSERT INTO domains (name, provider_type, token, created_by)
      VALUES (?, ?, ?, ?)
    `,
    args: [params.name, params.providerType, params.token, params.createdBy ?? null],
  });
  const res = await client.execute({
    sql: `SELECT * FROM domains WHERE name = ? ORDER BY id DESC LIMIT 1`,
    args: [params.name],
  });
  const row = res.rows[0] as any;
  return row as DomainRecord;
}

export async function getDomainById(id: number): Promise<DomainRecord | null> {
  const client = await getLibsqlClient();
  await ensureDomainsTable();
  const res = await client.execute({
    sql: `SELECT * FROM domains WHERE id = ? LIMIT 1`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return res.rows[0] as any as DomainRecord;
}

export async function listDomains(params: {
  keyword?: string;
  providerType?: ProviderType | "all";
  limit: number;
  offset: number;
}): Promise<{ items: DomainRecord[]; total: number }> {
  const client = await getLibsqlClient();
  await ensureDomainsTable();

  const conds: string[] = [];
  const args: any[] = [];

  if (params.keyword) {
    conds.push("name LIKE ?");
    args.push(`%${params.keyword}%`);
  }
  if (params.providerType && params.providerType !== "all") {
    conds.push("provider_type = ?");
    args.push(params.providerType);
  }

  const whereSql = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  const listRes = await client.execute({
    sql: `
      SELECT * FROM domains
      ${whereSql}
      ORDER BY updated_at DESC, id DESC
      LIMIT ? OFFSET ?
    `,
    args: [...args, params.limit, params.offset],
  });
  const countRes = await client.execute({
    sql: `
      SELECT COUNT(*) as cnt FROM domains
      ${whereSql}
    `,
    args,
  });
  const total = Number((countRes.rows[0] as any)?.cnt ?? 0);
  return { items: listRes.rows as any as DomainRecord[], total };
}


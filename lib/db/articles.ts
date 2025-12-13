import { getLibsqlClient } from "./client";
import { ensureArticlesTable } from "./schema";

export type ArticleStatus = "draft" | "published";

export interface ArticleRecord {
  id: number;
  title: string;
  slug: string;
  author_email: string;
  status: ArticleStatus;
  tags: string[];
  version: number;
  current_blob_path: string;
  blob_url: string;
  line_count: number;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  soft_deleted_at: string | null;
}

function serializeTags(tags?: string[] | null): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags.slice(0, 5));
}

function deserializeTags(raw: any): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export async function ensureArticles(): Promise<void> {
  await ensureArticlesTable();
}

export async function findBySlug(slug: string): Promise<ArticleRecord | null> {
  const client = await getLibsqlClient();
  await ensureArticles();

  const res = await client.execute({
    sql: `
      SELECT * FROM articles
      WHERE slug = ?
      LIMIT 1
    `,
    args: [slug],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0] as any;
  return { ...row, tags: deserializeTags(row.tags) } as ArticleRecord;
}

export async function findById(id: number): Promise<ArticleRecord | null> {
  const client = await getLibsqlClient();
  await ensureArticles();

  const res = await client.execute({
    sql: `SELECT * FROM articles WHERE id = ? LIMIT 1`,
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0] as any;
  return { ...row, tags: deserializeTags(row.tags) } as ArticleRecord;
}

export async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const client = await getLibsqlClient();
  await ensureArticles();

  const res = await client.execute({
    sql: excludeId
      ? `SELECT 1 FROM articles WHERE slug = ? AND id != ? LIMIT 1`
      : `SELECT 1 FROM articles WHERE slug = ? LIMIT 1`,
    args: excludeId ? [slug, excludeId] : [slug],
  });

  return res.rows.length > 0;
}

export async function createArticle(params: {
  title: string;
  slug: string;
  authorEmail: string;
  status: ArticleStatus;
  tags: string[];
  blobPath: string;
  blobUrl: string;
  lineCount: number;
  sizeBytes: number;
  publishedAt?: string | null;
}): Promise<ArticleRecord> {
  const client = await getLibsqlClient();
  await ensureArticles();

  const tagStr = serializeTags(params.tags);

  const res = await client.execute({
    sql: `
      INSERT INTO articles (
        title, slug, author_email, status, tags,
        version, current_blob_path, blob_url, line_count, size_bytes, published_at
      )
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `,
    args: [
      params.title,
      params.slug,
      params.authorEmail,
      params.status,
      tagStr,
      params.blobPath,
      params.blobUrl,
      params.lineCount,
      params.sizeBytes,
      params.publishedAt ?? null,
    ],
  });

  const id = Number(res.lastInsertRowid);
  const created = await findById(id);
  if (!created) {
    throw new Error("创建文章失败，未找到新记录");
  }
  return created;
}

export async function updateArticle(params: {
  id: number;
  title: string;
  slug: string;
  status: ArticleStatus;
  tags: string[];
  blobPath: string;
  blobUrl: string;
  lineCount: number;
  sizeBytes: number;
  publishedAt?: string | null;
}): Promise<ArticleRecord> {
  const client = await getLibsqlClient();
  await ensureArticles();

  const tagStr = serializeTags(params.tags);

  await client.execute({
    sql: `
      UPDATE articles
      SET
        title = ?,
        slug = ?,
        status = ?,
        tags = ?,
        version = version + 1,
        current_blob_path = ?,
        blob_url = ?,
        line_count = ?,
        size_bytes = ?,
        published_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    args: [
      params.title,
      params.slug,
      params.status,
      tagStr,
      params.blobPath,
      params.blobUrl,
      params.lineCount,
      params.sizeBytes,
      params.publishedAt ?? null,
      params.id,
    ],
  });

  const updated = await findById(params.id);
  if (!updated) {
    throw new Error("更新文章失败，未找到记录");
  }
  return updated;
}

export async function softDeleteArticle(id: number): Promise<void> {
  const client = await getLibsqlClient();
  await ensureArticles();

  await client.execute({
    sql: `
      UPDATE articles
      SET soft_deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    args: [id],
  });
}

export async function restoreArticle(id: number): Promise<void> {
  const client = await getLibsqlClient();
  await ensureArticles();

  await client.execute({
    sql: `
      UPDATE articles
      SET soft_deleted_at = NULL
      WHERE id = ?
    `,
    args: [id],
  });
}

export async function listArticles(params: {
  limit: number;
  offset: number;
  authorEmail?: string | null;
  status?: ArticleStatus | "all";
  titleKeyword?: string;
  tag?: string;
  start?: string;
  end?: string;
  includeSoftDeleted?: boolean;
  includeDraftOfOthers?: boolean;
}): Promise<{ items: ArticleRecord[]; total: number }> {
  const client = await getLibsqlClient();
  await ensureArticles();

  const conditions: string[] = [];
  const args: any[] = [];

  if (params.authorEmail) {
    conditions.push("author_email = ?");
    args.push(params.authorEmail);
  }

  if (params.status && params.status !== "all") {
    conditions.push("status = ?");
    args.push(params.status);
  }

  if (!params.includeSoftDeleted) {
    conditions.push("soft_deleted_at IS NULL");
  }

  if (params.titleKeyword) {
    conditions.push("title LIKE ?");
    args.push(`%${params.titleKeyword}%`);
  }

  if (params.tag) {
    conditions.push("tags LIKE ?");
    args.push(`%${params.tag}%`);
  }

  if (params.start) {
    conditions.push("updated_at >= ?");
    args.push(params.start);
  }

  if (params.end) {
    conditions.push("updated_at <= ?");
    args.push(params.end);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const listRes = await client.execute({
    sql: `
      SELECT * FROM articles
      ${whereSql}
      ORDER BY updated_at DESC, id DESC
      LIMIT ? OFFSET ?
    `,
    args: [...args, params.limit, params.offset],
  });

  const countRes = await client.execute({
    sql: `
      SELECT COUNT(*) as cnt
      FROM articles
      ${whereSql}
    `,
    args,
  });

  const items = listRes.rows.map((row: any) => ({
    ...row,
    tags: deserializeTags(row.tags),
  })) as ArticleRecord[];
  const total = Number((countRes.rows[0] as any)?.cnt ?? 0);
  return { items, total };
}


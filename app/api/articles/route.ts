'use server';

import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";
import {
  listArticles,
  slugExists,
  ensureArticles,
  findById,
} from "@/lib/db/articles";
import { getLibsqlClient } from "@/lib/db/client";
import { uploadToBlob } from "@/lib/blob-storage";

const MAX_MD_BYTES = 1024 * 1024; // 1MB
const MAX_MD_LINES = 1000;

type ParsedContent = {
  content: string;
  lineCount: number;
  sizeBytes: number;
};

function parseTags(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  return [];
}

async function getAuthUser() {
  const email = await getUserSession();
  if (!email) return { email: null, isAdmin: false };
  const user = await getUserByEmail(email);
  const isAdmin = user?.role === "admin";
  return { email, isAdmin };
}

async function parseContentFromRequest(
  req: NextRequest
): Promise<{ contentInfo: ParsedContent; title: string; slug: string; status: "draft" | "published"; tags: string[] }> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const statusRaw = String(formData.get("status") ?? "draft").trim();
    const status = statusRaw === "published" ? "published" : "draft";
    const tags = parseTags(formData.getAll("tags"));

    const file = formData.get("file");
    const contentField = formData.get("content");

    let content = "";
    let sizeBytes = 0;
    let lineCount = 0;

    if (file instanceof File) {
      const name = (file.name || "").toLowerCase();
      if (!name.endsWith(".md")) {
        throw new Error("仅支持上传 .md 文件");
      }
      if (file.size > MAX_MD_BYTES) {
        throw new Error("文件大小超出 1MB 限制");
      }
      content = await file.text();
      sizeBytes = file.size;
    } else if (typeof contentField === "string") {
      content = contentField;
      const encoded = new TextEncoder().encode(content);
      sizeBytes = encoded.byteLength;
    } else {
      throw new Error("缺少文章内容");
    }

    lineCount = content.split(/\r?\n/).length;

    if (lineCount > MAX_MD_LINES) {
      throw new Error("文件行数超过 1000 行限制");
    }
    if (sizeBytes > MAX_MD_BYTES) {
      throw new Error("文件大小超出 1MB 限制");
    }

    if (!title) {
      throw new Error("标题不能为空");
    }
    if (!slug) {
      throw new Error("slug 不能为空");
    }

    return {
      contentInfo: { content, lineCount, sizeBytes },
      title,
      slug,
      status,
      tags,
    };
  }

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const slug = String(body.slug ?? "").trim();
  const statusRaw = String(body.status ?? "draft").trim();
  const status = statusRaw === "published" ? "published" : "draft";
  const tags = parseTags(body.tags);
  const content = String(body.content ?? "");

  if (!title) {
    throw new Error("标题不能为空");
  }
  if (!slug) {
    throw new Error("slug 不能为空");
  }

  const encoded = new TextEncoder().encode(content);
  const sizeBytes = encoded.byteLength;
  const lineCount = content.split(/\r?\n/).length;

  if (lineCount > MAX_MD_LINES) {
    throw new Error("文件行数超过 1000 行限制");
  }
  if (sizeBytes > MAX_MD_BYTES) {
    throw new Error("文件大小超出 1MB 限制");
  }

  return { contentInfo: { content, lineCount, sizeBytes }, title, slug, status, tags };
}

export async function GET(req: NextRequest) {
  try {
    const { email, isAdmin } = await getAuthUser();
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
    const offset = Number(searchParams.get("offset") ?? 0);
    const statusParam = (searchParams.get("status") ?? "all") as "draft" | "published" | "all";
    const titleKeyword = searchParams.get("q") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    const { items, total } = await listArticles({
      limit,
      offset,
      authorEmail: isAdmin ? undefined : email,
      status: statusParam,
      titleKeyword,
      tag,
      start,
      end,
      includeSoftDeleted: isAdmin,
    });

    return NextResponse.json({
      items,
      total,
      nextOffset: offset + items.length,
      hasMore: offset + items.length < total,
    });
  } catch (error: any) {
    console.error("[api/articles] GET failed", error);
    return NextResponse.json({ message: error?.message || "获取失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let articleId: number | null = null;
  try {
    const { email, isAdmin } = await getAuthUser();
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const { contentInfo, title, slug, status, tags } = await parseContentFromRequest(req);

    if (await slugExists(slug)) {
      return NextResponse.json({ message: "slug 已存在，请更换" }, { status: 400 });
    }

    const publishedAt = status === "published" ? new Date().toISOString() : null;
    const client = await getLibsqlClient();
    await ensureArticles();

    // 先占位插入以获取 articleId
    const insertRes = await client.execute({
      sql: `
        INSERT INTO articles (
          title, slug, author_email, status, tags,
          version, current_blob_path, blob_url, line_count, size_bytes, published_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
      `,
      args: [
        title,
        slug,
        email,
        status,
        JSON.stringify(tags.slice(0, 5)),
        "pending",
        "pending",
        contentInfo.lineCount,
        contentInfo.sizeBytes,
        publishedAt,
      ],
    });

    articleId = Number(insertRes.lastInsertRowid);
    const filePath = `md/${articleId}/latest.md`;

    const uploaded = await uploadToBlob({
      file: new Blob([contentInfo.content], { type: "text/markdown" }),
      filename: filePath,
      access: "public",
      contentType: "text/markdown",
    });

    await client.execute({
      sql: `
        UPDATE articles
        SET current_blob_path = ?, blob_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [uploaded.pathname || filePath, uploaded.url, articleId],
    });

    const created = await findById(articleId);
    return NextResponse.json({ ok: true, article: created, isAdmin });
  } catch (error: any) {
    console.error("[api/articles] POST failed", error);
    if (articleId) {
      try {
        const client = await getLibsqlClient();
        await client.execute({ sql: "DELETE FROM articles WHERE id = ?", args: [articleId] });
      } catch (e) {
        console.warn("[api/articles] cleanup failed", e);
      }
    }
    return NextResponse.json({ ok: false, message: error?.message || "创建失败" }, { status: 400 });
  }
}


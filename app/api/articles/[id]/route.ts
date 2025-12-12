'use server';

import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";
import {
  findById,
  slugExists,
  updateArticle,
  softDeleteArticle,
  restoreArticle,
} from "@/lib/db/articles";
import { uploadToBlob } from "@/lib/blob-storage";

const MAX_MD_BYTES = 1024 * 1024; // 1MB
const MAX_MD_LINES = 1000;

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

const ADMIN_ROLES = ["admin", "superadmin"];

async function getAuth() {
  const email = await getUserSession();
  if (!email) return { email: null, role: null, isAdmin: false, status: null };
  const user = await getUserByEmail(email);
  const role = user?.role || null;
  const isAdmin = ADMIN_ROLES.includes(role || "");
  const status = user?.status ?? null;
  return { email, role, isAdmin, status };
}

async function readContent(content: any, nameHint?: string) {
  let text = "";
  let sizeBytes = 0;
  let lineCount = 0;

  if (content instanceof File) {
    const name = (content.name || nameHint || "").toLowerCase();
    if (!name.endsWith(".md")) {
      throw new Error("仅支持上传 .md 文件");
    }
    if (content.size > MAX_MD_BYTES) {
      throw new Error("文件大小超出 1MB 限制");
    }
    text = await content.text();
    sizeBytes = content.size;
  } else if (typeof content === "string") {
    text = content;
    const encoded = new TextEncoder().encode(text);
    sizeBytes = encoded.byteLength;
  } else {
    throw new Error("缺少文章内容");
  }

  lineCount = text.split(/\r?\n/).length;
  if (lineCount > MAX_MD_LINES) {
    throw new Error("文件行数超过 1000 行限制");
  }
  if (sizeBytes > MAX_MD_BYTES) {
    throw new Error("文件大小超出 1MB 限制");
  }

  return { text, sizeBytes, lineCount };
}

async function fetchContentText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("读取文章内容失败");
  }
  return res.text();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { email, isAdmin, status, role } = await getAuth();
    const { id } = await context.params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ message: "无效的文章 ID" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (status === "disabled") {
      return NextResponse.json({ message: "账号已禁用" }, { status: 403 });
    }
    const allowedRole = role === "editor" || isAdmin;
    if (!allowedRole) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    const article = await findById(articleId);
    if (!article) {
      return NextResponse.json({ message: "未找到文章" }, { status: 404 });
    }
    if (!isAdmin && article.author_email !== email) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    const content = await fetchContentText(article.blob_url);
    return NextResponse.json({ article: { ...article, content } });
  } catch (error: any) {
    console.error("[api/articles/:id] GET failed", error);
    return NextResponse.json({ message: error?.message || "获取失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { email, isAdmin, status, role } = await getAuth();
    const { id } = await context.params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ message: "无效的文章 ID" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (status === "disabled") {
      return NextResponse.json({ message: "账号已禁用" }, { status: 403 });
    }
    const allowedRole = role === "editor" || isAdmin;
    if (!allowedRole) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    const existing = await findById(articleId);
    if (!existing) {
      return NextResponse.json({ message: "未找到文章" }, { status: 404 });
    }
    if (!isAdmin && existing.author_email !== email) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let slug = "";
    let status: "draft" | "published" = "draft";
    let tags: string[] = [];
    let contentBlob: File | string | null = null;
    let fileNameHint = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = String(formData.get("title") ?? "").trim();
      slug = String(formData.get("slug") ?? "").trim();
      const statusRaw = String(formData.get("status") ?? "draft").trim();
      status = statusRaw === "published" ? "published" : "draft";
      tags = parseTags(formData.getAll("tags"));
      const file = formData.get("file");
      const contentField = formData.get("content");
      if (file instanceof File) {
        contentBlob = file;
        fileNameHint = file.name;
      } else if (typeof contentField === "string") {
        contentBlob = contentField;
      }
    } else {
      const body = await req.json();
      title = String(body.title ?? "").trim();
      slug = String(body.slug ?? "").trim();
      const statusRaw = String(body.status ?? "draft").trim();
      status = statusRaw === "published" ? "published" : "draft";
      tags = parseTags(body.tags);
      contentBlob = String(body.content ?? "");
    }

    if (!title) {
      return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ message: "slug 不能为空" }, { status: 400 });
    }
    if (await slugExists(slug, articleId)) {
      return NextResponse.json({ message: "slug 已存在，请更换" }, { status: 400 });
    }

    const parsed = await readContent(contentBlob, fileNameHint);

    const filePath = `md/${articleId}/latest.md`;
    const uploaded = await uploadToBlob({
      file: new Blob([parsed.text], { type: "text/markdown" }),
      filename: filePath,
      access: "public",
      contentType: "text/markdown",
    });

    const nextPublishedAt =
      status === "published"
        ? existing.published_at ?? new Date().toISOString()
        : null;

    const updated = await updateArticle({
      id: articleId,
      title,
      slug,
      status,
      tags,
      blobPath: uploaded.pathname || filePath,
      blobUrl: uploaded.url,
      lineCount: parsed.lineCount,
      sizeBytes: parsed.sizeBytes,
      publishedAt: nextPublishedAt,
    });

    return NextResponse.json({ ok: true, article: updated });
  } catch (error: any) {
    console.error("[api/articles/:id] PUT failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { email, isAdmin, status, role } = await getAuth();
    const { id } = await context.params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ message: "无效的文章 ID" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (status === "disabled") {
      return NextResponse.json({ message: "账号已禁用" }, { status: 403 });
    }
    const allowedRole = role === "editor" || isAdmin;
    if (!allowedRole) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    const existing = await findById(articleId);
    if (!existing) {
      return NextResponse.json({ message: "未找到文章" }, { status: 404 });
    }
    if (!isAdmin && existing.author_email !== email) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    await softDeleteArticle(articleId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/articles/:id] DELETE failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "删除失败" }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { email, isAdmin, status } = await getAuth();
    const { id } = await context.params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ message: "无效的文章 ID" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (status === "disabled") {
      return NextResponse.json({ message: "账号已禁用" }, { status: 403 });
    }
    if (!isAdmin) {
      return NextResponse.json({ message: "仅管理员可恢复" }, { status: 403 });
    }
    const body = await req.json();
    if (body.action !== "restore") {
      return NextResponse.json({ message: "不支持的操作" }, { status: 400 });
    }
    await restoreArticle(articleId);
    const restored = await findById(articleId);
    return NextResponse.json({ ok: true, article: restored });
  } catch (error: any) {
    console.error("[api/articles/:id] PATCH failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "操作失败" }, { status: 400 });
  }
}


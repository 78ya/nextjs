'use server';

import { NextResponse } from "next/server";
import { findBySlug } from "@/lib/db/articles";

async function fetchContent(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("读取文章内容失败");
  }
  return res.text();
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const article = await findBySlug(slug);
    if (!article || article.status !== "published" || article.soft_deleted_at) {
      return NextResponse.json({ message: "未找到文章" }, { status: 404 });
    }

    const content = await fetchContent(article.blob_url);

    return NextResponse.json({
      article: {
        ...article,
        content,
      },
    });
  } catch (error: any) {
    console.error("[api/articles/slug] GET failed", error);
    return NextResponse.json({ message: error?.message || "获取失败" }, { status: 500 });
  }
}


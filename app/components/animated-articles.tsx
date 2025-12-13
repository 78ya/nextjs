'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

type Article = {
  id: number;
  title: string;
  slug: string;
  tags: string[];
  updated_at: string;
  published_at: string | null;
  excerpt: string;
};

export function AnimatedArticles({ articles }: { articles: Article[] }) {
  const [ready, setReady] = useState(false);

  const formatDate = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-6 text-sm text-zinc-500 dark:text-zinc-400">
        暂无已发布文章，登录后台创建一篇试试。
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {articles.map((post, idx) => (
        <Link
          key={post.id}
          href={`/articles/${encodeURIComponent(post.slug)}`}
          style={{ transitionDelay: `${idx * 80}ms` }}
          className={`group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-500 ${
            ready ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="flex min-w-0 items-center justify-between gap-3 mb-2">
            <span className="inline-flex min-w-0 max-w-full items-center rounded-full bg-zinc-900 text-zinc-50 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-100 dark:text-zinc-900 truncate">
              {post.tags[0] || "文章"}
            </span>
            <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(post.published_at || post.updated_at)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-1 line-clamp-2 break-words">
            {post.title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3 break-words">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>阅读全文</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}


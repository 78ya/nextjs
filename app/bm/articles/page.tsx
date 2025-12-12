"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

type ArticleStatus = "draft" | "published";

type ArticleItem = {
  id: number;
  title: string;
  slug: string;
  status: ArticleStatus;
  version: number;
  tags: string[];
  updated_at: string;
  author_email: string;
  soft_deleted_at: string | null;
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: ArticleStatus }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPublished
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
      }`}
    >
      {isPublished ? "已发布" : "草稿"}
    </span>
  );
}

export default function ArticlesPage() {
  const router = useRouter();
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    tag: "",
  });
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.tag.trim()) params.set("tag", filters.tag.trim());
    return params.toString();
  }, [offset, filters]);

  const fetchList = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/articles?${reset ? new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: "0",
        q: filters.q.trim(),
        status: filters.status,
        tag: filters.tag.trim(),
      }) : queryString}`;

      const res = await fetch(url);
      if (res.status === 401 || res.status === 403) {
        setHasMore(false);
        throw new Error("暂无权限访问文章列表");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "获取失败");

      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setOffset(reset ? data.nextOffset : data.nextOffset);
      setHasMore(data.hasMore);
    } catch (e: any) {
      setError(e?.message || "加载失败");
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // initial load or filter change
    setOffset(0);
    fetchList(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.status, filters.tag]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          fetchList(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, queryString]);

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除（软删）这篇文章吗？")) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data?.message || "删除失败");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRestore = async (id: number) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      alert(data?.message || "恢复失败");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, soft_deleted_at: null } : i)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">文章管理</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            草稿/发布、标签筛选、无限滚动列表
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/bm/articles/new")}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            <PlusIcon className="h-4 w-4" />
            新建文章
          </button>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchList(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="搜索标题"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />
          <input
            value={filters.tag}
            onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
            placeholder="标签"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {error && (
          <div className="mb-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/bm/articles/${item.id}`}
                    className="text-base font-semibold text-zinc-900 dark:text-zinc-50 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <StatusBadge status={item.status} />
                  {item.soft_deleted_at && (
                    <span className="text-xs text-red-500">已删除</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>slug: {item.slug}</span>
                  <span>版本: v{item.version}</span>
                  <span>更新: {new Date(item.updated_at).toLocaleString()}</span>
                  {item.tags.length > 0 && (
                    <span className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/bm/articles/${item.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  编辑
                </button>
                {item.soft_deleted_at ? (
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                    恢复
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <TrashIcon className="h-4 w-4" />
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">暂无数据</div>
          )}
          <div ref={sentinelRef} className="h-4" />
          {loading && (
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-2">
              加载中...
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div className="text-center text-xs text-zinc-400 py-2">已到底</div>
          )}
        </div>
      </div>
    </div>
  );
}


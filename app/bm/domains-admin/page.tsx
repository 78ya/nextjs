"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderType = "aliyun" | "tencent" | "cloudflare";

type DomainItem = {
  id: number;
  name: string;
  provider_type: ProviderType;
  created_at: string;
};

const PAGE_SIZE = 10;

export default function DomainsAdminPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [providerFilter, setProviderFilter] = useState<ProviderType | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    providerType: "cloudflare" as ProviderType,
    token: "",
  });
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadDomains = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String((page - 1) * PAGE_SIZE));
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (providerFilter !== "all") params.set("provider", providerFilter);
    try {
      const res = await fetch(`/api/domains?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || "加载失败");
      setDomains(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, providerFilter]);

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.token.trim()) {
      alert("请填写域名和令牌");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || "创建失败");
      setShowCreate(false);
      setCreateForm({ name: "", providerType: "cloudflare", token: "" });
      setPage(1);
      await loadDomains();
    } catch (err: any) {
      alert(err?.message || "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">域名管理</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            管理域名解析记录（实时从云厂商获取）
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            新增域名
          </button>
          <button
            onClick={() => loadDomains()}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            刷新
          </button>
          <button
            onClick={() => setViewMode((m) => (m === "grid" ? "list" : "grid"))}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            切换视图（{viewMode === "grid" ? "网格" : "列表"}）
          </button>
        </div>
      </div>

      {/* 筛选 */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="搜索域名"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          >
            <option value="all">全部厂商</option>
            <option value="cloudflare">Cloudflare</option>
            <option value="aliyun">阿里云</option>
            <option value="tencent">腾讯云</option>
          </select>
        </div>
      </div>

      {/* 列表 */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">加载中...</div>
        ) : domains.length === 0 ? (
          <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">暂无数据</div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {domains.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{d.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {d.provider_type}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/bm/domains-admin/${d.id}`)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    管理记录
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  创建时间：{new Date(d.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">域名</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">厂商</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">创建时间</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{d.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{d.provider_type}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => router.push(`/bm/domains-admin/${d.id}`)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        管理记录
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            第 {page} / {totalPages} 页， 共 {total} 条
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
            >
              上一页
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* 创建弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">新增域名</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-800">
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600 dark:text-zinc-300">域名</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="example.com"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600 dark:text-zinc-300">服务厂商</label>
                <select
                  value={createForm.providerType}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, providerType: e.target.value as ProviderType }))
                  }
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                >
                  <option value="cloudflare">Cloudflare</option>
                  <option value="aliyun">阿里云</option>
                  <option value="tencent">腾讯云</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600 dark:text-zinc-300">令牌</label>
                <textarea
                  value={createForm.token}
                  onChange={(e) => setCreateForm((f) => ({ ...f, token: e.target.value }))}
                  placeholder="请输入对应厂商的 API Token"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm"
              >
                取消
              </button>
              <button
                disabled={creating}
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm disabled:opacity-50"
              >
                {creating ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


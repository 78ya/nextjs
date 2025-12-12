"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecordItem = {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number | null;
  proxied?: boolean | null;
};

export default function DomainRecordsPage({ params }: { params: { id: string } }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: "A",
    name: "",
    content: "",
    ttl: 300,
    priority: "",
    proxied: false,
  });
  const [creating, setCreating] = useState(false);

  const load = async (domainId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/domains/${domainId}/records`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || "加载失败");
      setRecords(data.items || []);
    } catch (err: any) {
      setError(err?.message || "加载失败");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // params 可能是 Promise，显式 await 解包
    Promise.resolve(params)
      .then((p) => p.id)
      .then((id) => {
        if (id) load(id);
      })
      .catch((err) => {
        console.error("加载域名记录失败", err);
        setError("参数错误");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">记录管理</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">管理域名的 DNS 记录</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/bm/domains-admin"
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            返回列表
          </Link>
          <button
            onClick={() =>
              Promise.resolve(params)
                .then((p) => {
                  if (p.id) return load(p.id);
                })
                .catch((err) => console.error(err))
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            刷新
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            新增解析
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">加载中...</div>
        ) : records.length === 0 ? (
          <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">暂无记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">类型</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">名称</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">内容</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">TTL</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">优先级</th>
                  <th className="px-3 py-2 text-left text-zinc-500 dark:text-zinc-400">代理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{r.type}</td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">{r.name}</td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">{r.content}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{r.ttl}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {r.priority ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {r.proxied === true ? "开启" : r.proxied === false ? "关闭" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 创建记录弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">新增解析</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-800">
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-zinc-600 dark:text-zinc-300">记录类型</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  >
                    {["A", "AAAA", "CNAME", "TXT", "MX", "SRV", "CAA", "NS"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-600 dark:text-zinc-300">TTL</label>
                  <input
                    type="number"
                    min={60}
                    value={createForm.ttl}
                    onChange={(e) => setCreateForm((f) => ({ ...f, ttl: Number(e.target.value) || 300 }))}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600 dark:text-zinc-300">主机记录 / Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="如 @ 或 www"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600 dark:text-zinc-300">记录值 / Content</label>
                <input
                  value={createForm.content}
                  onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="记录值"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              {(createForm.type === "MX" || createForm.type === "SRV") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm text-zinc-600 dark:text-zinc-300">优先级 / Priority</label>
                    <input
                      type="number"
                      value={createForm.priority}
                      onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value }))}
                      placeholder="如 10"
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  id="proxied"
                  type="checkbox"
                  checked={createForm.proxied}
                  onChange={(e) => setCreateForm((f) => ({ ...f, proxied: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="proxied" className="text-sm text-zinc-600 dark:text-zinc-300">
                  代理/加速（仅部分厂商支持）
                </label>
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
                onClick={async () => {
                  if (!createForm.name.trim() || !createForm.content.trim()) {
                    alert("请填写主机记录和记录值");
                    return;
                  }
                  setCreating(true);
                  try {
                    const domainId = await Promise.resolve(params).then((p) => p.id);
                    if (!domainId) throw new Error("参数错误");
                    const res = await fetch(`/api/domains/${domainId}/records`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: createForm.type,
                        name: createForm.name,
                        content: createForm.content,
                        ttl: createForm.ttl,
                        priority: createForm.priority ? Number(createForm.priority) : undefined,
                        proxied: createForm.proxied,
                      }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok || !data?.ok) throw new Error(data?.message || "创建失败");
                    setShowCreate(false);
                    setCreateForm({ type: "A", name: "", content: "", ttl: 300, priority: "", proxied: false });
                    Promise.resolve(params)
                      .then((p) => p.id)
                      .then((id) => {
                        if (id) return load(id);
                      })
                      .catch((err) => console.error(err));
                  } catch (err: any) {
                    alert(err?.message || "创建失败");
                  } finally {
                    setCreating(false);
                  }
                }}
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


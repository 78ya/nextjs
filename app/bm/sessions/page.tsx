"use client";

import { useEffect, useState } from "react";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || "获取会话失败");
      setSessions(data.items || []);
      if (data?.legacy) {
        setWarning(data?.message || "当前会话为旧版本 cookie（建议重新登录以启用多端会话管理）");
      }
    } catch (err: any) {
      setError(err?.message || "加载失败");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    if (!confirm("确定要撤销此会话吗？")) return;
    try {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "撤销失败");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      alert(err?.message || "撤销失败");
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("确定要撤销所有其他会话吗？")) return;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_others" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "撤销失败");
      await loadSessions();
    } catch (err: any) {
      alert(err?.message || "撤销失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            会话管理
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            查看和管理您的登录会话
          </p>
        </div>
        <button
          onClick={handleRevokeAll}
          className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          撤销所有其他会话
        </button>
      </div>

      {warning && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
          {warning}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm text-zinc-600 dark:text-zinc-400">
          加载中...
        </div>
      )}

      {/* 会话列表 */}
      <div className="space-y-4">
        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-6 text-sm text-zinc-500 dark:text-zinc-400">
            暂无会话记录
          </div>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {session.device.includes("iPhone") ||
                    session.device.includes("Android")
                      ? "📱"
                      : session.device.includes("macOS") || session.device.includes("Windows")
                      ? "💻"
                      : "🖥️"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {session.device}
                      </p>
                      {session.isCurrent && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                          当前会话
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {session.browser}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">IP 地址</p>
                    <p className="text-zinc-900 dark:text-zinc-50 mt-1">
                      {session.ip}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">位置</p>
                    <p className="text-zinc-900 dark:text-zinc-50 mt-1">
                      {session.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">最后活动</p>
                    <p className="text-zinc-900 dark:text-zinc-50 mt-1">
                      {new Date(session.lastActive).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  onClick={() => handleRevoke(session.id)}
                  className="ml-4 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  撤销
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 安全提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              安全提示
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              如果您发现任何可疑的会话，请立即撤销并修改密码。建议定期检查并清理不常用的会话。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

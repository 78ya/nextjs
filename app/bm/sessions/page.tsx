"use client";

import { useState } from "react";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  // TODO: 从 API 获取会话数据
  const mockSessions: Session[] = [
    {
      id: "1",
      device: "Windows 10",
      browser: "Chrome 120.0",
      ip: "192.168.1.100",
      location: "北京, 中国",
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
    {
      id: "2",
      device: "macOS 14.0",
      browser: "Safari 17.0",
      ip: "192.168.1.101",
      location: "上海, 中国",
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      isCurrent: false,
    },
    {
      id: "3",
      device: "iPhone 15",
      browser: "Safari Mobile",
      ip: "192.168.1.102",
      location: "广州, 中国",
      lastActive: new Date(Date.now() - 86400000).toISOString(),
      isCurrent: false,
    },
  ];

  const handleRevoke = (sessionId: string) => {
    if (confirm("确定要撤销此会话吗？")) {
      // TODO: 调用 API 撤销会话
      setSessions(sessions.filter((s) => s.id !== sessionId));
    }
  };

  const handleRevokeAll = () => {
    if (confirm("确定要撤销所有其他会话吗？")) {
      // TODO: 调用 API 撤销所有其他会话
      setSessions(sessions.filter((s) => s.isCurrent));
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

      {/* 会话列表 */}
      <div className="space-y-4">
        {mockSessions.map((session) => (
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
                      : session.device.includes("macOS")
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

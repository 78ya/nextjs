"use client";

import { useState } from "react";

export default function NotificationBell() {
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // TODO: 从后端获取通知数据
  const notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    time: string;
    read: boolean;
  }> = [
    // 示例数据
    {
      id: "1",
      title: "操作成功",
      message: "个人信息已更新",
      type: "success",
      time: "2分钟前",
      read: false,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        aria-label="通知"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                通知
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    ({unreadCount} 条未读)
                  </span>
                )}
              </h3>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  暂无通知
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer ${
                      !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {notification.type === "success" && "✅"}
                        {notification.type === "error" && "❌"}
                        {notification.type === "warning" && "⚠️"}
                        {notification.type === "info" && "ℹ️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                          {notification.title}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                <button className="w-full text-sm text-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-2">
                  查看全部
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}


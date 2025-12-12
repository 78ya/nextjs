"use client";

import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  isAdmin?: boolean;
}

export default function Header({
  onMenuClick,
  userName,
  userEmail,
  userAvatar,
  isAdmin = false,
}: HeaderProps) {
  const envRaw =
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV;
  const envLabel =
    envRaw && envRaw !== "production"
      ? envRaw === "development"
        ? "开发环境"
        : envRaw === "preview"
          ? "测试环境"
          : `环境：${envRaw}`
      : null;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-300">
      <div className="flex items-center justify-between h-20 px-4 lg:px-8">
        {/* 左侧：菜单按钮和标题 */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            aria-label="打开菜单"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                {isAdmin ? "管理员控制台" : "用户中心"}
              </h1>
              {envLabel && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  {envLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
            <ThemeToggle />
          </div>
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}

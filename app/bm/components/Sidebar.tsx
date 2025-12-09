"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  UserGroupIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  HomeIcon,
  FolderIcon,
  AdjustmentsHorizontalIcon,
  CpuChipIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ServerIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  Icon: (props: React.ComponentProps<"svg">) => JSX.Element;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: (props: React.ComponentProps<"svg">) => JSX.Element;
  items: NavItem[];
  adminOnly?: boolean;
}

const groups: NavGroup[] = [
  {
    label: "仪表盘",
    icon: ChartBarIcon,
    items: [
      { name: "FRP", href: "/bm", Icon: CpuChipIcon },
      { name: "服务器", href: "/bm/sessions", Icon: ServerIcon },
      { name: "VPN", href: "/bm/sessions", Icon: LockClosedIcon },
      { name: "数据统计", href: "/bm/statistics", Icon: ChartPieIcon },
    ],
  },
  {
    label: "管理",
    icon: FolderIcon,
    items: [
      { name: "FRP", href: "/bm/sessions", Icon: ShieldCheckIcon },
      { name: "VPN", href: "/bm/sessions", Icon: LockClosedIcon },
      { name: "服务器", href: "/bm/sessions", Icon: ServerIcon },
      { name: "文章管理", href: "/bm/logs", Icon: ClipboardDocumentListIcon },
      { name: "文章发布", href: "/bm/users", Icon: PencilSquareIcon, adminOnly: true },
    ],
  },
  {
    label: "设置",
    icon: Cog6ToothIcon,
    items: [
      { name: "设备管理", href: "/bm/settings", Icon: AdjustmentsHorizontalIcon, adminOnly: true },
      { name: "会话管理", href: "/bm/sessions", Icon: ShieldCheckIcon },
      { name: "个人设置", href: "/bm/profile", Icon: UserCircleIcon },
    ],
  },
];

interface SidebarProps {
  isAdmin?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isAdmin = false, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const activeGroup = groups.find((group) =>
    group.items.some((item) =>
      item.href === "/bm" ? pathname === "/bm" : pathname.startsWith(item.href)
    )
  )?.label;

  const [openLabel, setOpenLabel] = useState<string | null>(activeGroup ?? null);
  const toggleGroup = (label: string) =>
    setOpenLabel((prev) => (prev === label ? null : label));
  
  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 
          bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 shadow-xl lg:shadow-none
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        onMouseLeave={() => setOpenLabel((prev) => prev)} // 保留用户当前展开状态，不强制打开
      >
        <div className="flex flex-col h-full">
          {/* Logo/标题区域 */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              管理后台
            </h2>
            <button
              onClick={onMobileClose}
              className="lg:hidden absolute right-4 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto custom-scrollbar">
            {groups
              .filter((group) => !group.adminOnly || isAdmin)
              .map((group) => {
                const isOpen = openLabel === group.label;
                return (
                  <div
                    key={group.label}
                    className="space-y-2"
                  >
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="flex items-center w-full px-3 py-2 rounded-lg text-left text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors gap-2"
                    >
                      <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-100">
                        <group.icon className="w-5 h-5" />
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{group.label}</span>
                      <span className="ml-auto text-sm text-zinc-400">{isOpen ? "▾" : "▸"}</span>
                    </button>
                    <div
                      className={`
                        space-y-1 pl-2 overflow-hidden transition-all duration-300 ease-in-out
                        ${isOpen ? "max-h-[480px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
                      `}
                    >
                      {group.items
                        .filter((item) => !item.adminOnly || isAdmin)
                        .map((item) => {
                          const isActive =
                            item.href === "/bm" ? pathname === "/bm" : pathname.startsWith(item.href);
                          return (
                            <Link
                              key={`${item.href}-${item.name}`}
                              href={item.href}
                              onClick={onMobileClose}
                              className={`
                                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                                ${
                                  isActive
                                    ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/20 dark:shadow-zinc-50/10 font-medium translate-x-1"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 hover:translate-x-1"
                                }
                              `}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors transition-transform duration-200 ${
                                  isActive
                                    ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 scale-105"
                                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 group-hover:scale-105"
                                }`}
                              >
                                <item.Icon className="w-5 h-5" />
                              </div>
                              <span>{item.name}</span>
                              {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900 animate-pulse" />
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </nav>

          {/* 底部信息 */}
          <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-3">
            <Link
              href="/"
              onClick={onMobileClose}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-medium hover:shadow transition"
            >
              <HomeIcon className="w-5 h-5" />
              返回主页
            </Link>
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">系统运行正常</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

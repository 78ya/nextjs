"use client";

import { useState, useEffect, ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { getUserInfo } from "../actions";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [userInfo, setUserInfo] = useState<{
    email: string;
    name: string | null;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      const info = await getUserInfo();
      if (!info) {
        redirect("/login");
        return;
      }
      setUserInfo(info);
      // TODO: 检查用户是否为管理员
      // const user = await getUserByEmail(info.email);
      // setIsAdmin(user?.role === 'admin');
      setIsAdmin(false); // 临时设置，后续从数据库获取
      setLoading(false);
    }
    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  const displayName = userInfo.name || "用户";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        isAdmin={isAdmin}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="lg:pl-64">
        <Header
          onMenuClick={() => setIsMobileMenuOpen(true)}
          userName={displayName}
          userEmail={userInfo.email}
          isAdmin={isAdmin}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}


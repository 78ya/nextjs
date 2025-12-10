"use client";

import { useState, useEffect, ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [userInfo, setUserInfo] = useState<{
    email: string;
    name: string | null;
    avatar: string | null;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/users/me", {
          credentials: "include",
        });
        if (!res.ok) {
          redirect("/login");
          return;
        }
        const json = await res.json();
        if (!json?.success || !json?.data) {
          redirect("/login");
          return;
        }
        setUserInfo({
          email: json.data.email,
          name: json.data.name ?? null,
          avatar: json.data.avatar ?? null,
        });
        setIsAdmin(false); // TODO: 后续从角色判断
      } catch (error) {
        console.error("获取用户信息失败:", error);
        redirect("/login");
      } finally {
        setLoading(false);
      }
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
          userAvatar={userInfo.avatar ?? undefined}
          isAdmin={isAdmin}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}


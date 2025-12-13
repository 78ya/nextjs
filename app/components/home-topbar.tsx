'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  siteTitle?: string;
};

export function HomeTopBar({ siteTitle = "78ya 博客" }: Props) {
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<{ email: string; name: string | null; avatar: string | null } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 24);
      setLastY(y);
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        if (data?.ok && data?.user && !cancelled) {
          setUser({
            email: data.user.email,
            name: data.user.name,
            avatar: data.user.avatar,
          });
        }
      } catch (err) {
        console.warn("[home-topbar] fetch user failed", err);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.name || user?.email || "未登录";
  const initial = user?.name?.[0] || user?.email?.[0] || "U";

  const logout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error("[home-topbar] logout failed", e);
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 flex justify-center">
      <div
        className={`pointer-events-auto mx-auto mt-3 flex w-full max-w-6xl min-w-0 items-center justify-between rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-2 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/80 transition-transform duration-300 ${
          hidden ? "-translate-y-[120%]" : "translate-y-0"
        }`}
      >
        <div className="min-w-0 text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
          {siteTitle}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!user && !loadingUser && (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              登录
            </Link>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="h-8 w-8 overflow-hidden rounded-full border border-zinc-300 bg-gradient-to-br from-zinc-100 to-white text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-zinc-400/70 dark:focus:ring-zinc-500/70"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </button>
            <div
              className={`absolute right-0 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 transition transform origin-top-right ${
                open ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"
              }`}
            >
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{displayName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email || "未登录"}</p>
              </div>
              <div className="flex flex-col">
                <Link
                  href="/bm"
                  className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                >
                  用户中心
                </Link>
                <Link
                  href="/bm"
                  className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                >
                  后台管理
                </Link>
                <button
                  disabled={loggingOut}
                  className="px-4 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-60"
                  onClick={logout}
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


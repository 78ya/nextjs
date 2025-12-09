"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "../actions";
import { useTransition } from "react";

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  isAdmin?: boolean;
}

export default function UserMenu({
  userName,
  userEmail,
  userAvatar,
  isAdmin = false,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const displayName = userName || "用户";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
        aria-label="用户菜单"
        aria-expanded={isOpen}
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={displayName}
            className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-zinc-900"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {initial}
            </span>
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {displayName}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div 
        className={`absolute right-0 mt-3 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 transition-all duration-200 origin-top-right ${
          isOpen 
            ? "transform opacity-100 scale-100 visible translate-y-0" 
            : "transform opacity-0 scale-95 invisible -translate-y-2"
        }`}
      >
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-t-xl">
          <div className="flex items-center gap-3 mb-3">
             {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayName}
                className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-zinc-800 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center ring-2 ring-white dark:ring-zinc-800 shadow-sm">
                <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
                  {initial}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {displayName}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                  管理员
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate pl-1">
            {userEmail}
          </p>
        </div>
        
        <div className="p-2 space-y-1">
          <Link
            href="/bm/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors group"
          >
            <span className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              👤
            </span>
            个人设置
          </Link>
          <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1 mx-2" />
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 group"
          >
            <span className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
              🚪
            </span>
            {isPending ? "退出中..." : "退出登录"}
          </button>
        </div>
      </div>
    </div>
  );
}

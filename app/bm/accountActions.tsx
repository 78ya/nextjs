"use client";

import { logoutAction, deleteAccountAction } from "./actions";
import { useTransition } from "react";

export default function AccountActions() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const handleDeleteAccount = () => {
    if (!confirm("确定要删除账号吗？此操作不可恢复，将永久删除您的账号及所有数据。")) {
      return;
    }

    if (!confirm("再次确认：您真的要删除账号吗？")) {
      return;
    }

    startTransition(async () => {
      await deleteAccountAction();
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        账号操作
      </h2>
      <div className="space-y-4">
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
        >
          <div className="font-medium mb-1">退出登录</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            退出当前账号
          </div>
        </button>
        <button
          onClick={handleDeleteAccount}
          disabled={isPending}
          className="w-full px-6 py-3 border border-red-300 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50"
        >
          <div className="font-medium mb-1">删除账号</div>
          <div className="text-sm text-red-500 dark:text-red-400">
            永久删除账号及所有数据
          </div>
        </button>
      </div>
    </div>
  );
}


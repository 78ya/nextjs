"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminLoginAction, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = {
  ok: true,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "登录中..." : "登录"}
    </button>
  );
}

export default function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, initialState);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
          管理后台登录
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          请输入管理员账号和密码
        </p>
      </div>

      {/* 错误提示 */}
      {!state.ok && state.message && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {state.message}
        </div>
      )}

      {/* 登录表单 */}
      <form action={formAction} className="space-y-6">
        {/* 账号输入 */}
        <div>
          <label
            htmlFor="account"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            账号
          </label>
          <input
            id="account"
            name="account"
            type="text"
            required
            autoComplete="username"
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
            placeholder="请输入管理员账号"
          />
        </div>

        {/* 密码输入 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
            placeholder="请输入密码"
          />
        </div>

        {/* 登录按钮 */}
        <SubmitButton />
      </form>
    </div>
  );
}

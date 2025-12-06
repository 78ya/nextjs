"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {
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

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
          欢迎回来
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          登录您的账户以继续
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
        {/* 邮箱输入 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            邮箱地址
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
            placeholder="your@email.com"
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
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
            placeholder="••••••••"
          />
        </div>

        {/* 记住我 & 忘记密码 */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 rounded focus:ring-zinc-500 dark:focus:ring-zinc-400"
            />
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
              记住我
            </span>
          </label>
          <a
            href="#"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            忘记密码？
          </a>
        </div>

        {/* 登录按钮 */}
        <SubmitButton />
      </form>

      {/* 分隔线 */}
      <div className="mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-300 dark:border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
              或
            </span>
          </div>
        </div>
      </div>

      {/* 注册链接 */}
      <div className="text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          还没有账户？{" "}
          <a
            href="/register"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            立即注册
          </a>
        </p>
      </div>
    </div>
  );
}


"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePassword, type PasswordChangeState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "修改中..." : "修改密码"}
    </button>
  );
}

export default function PasswordChangeForm() {
  const initialState: PasswordChangeState = { ok: true };
  const [state, formAction] = useFormState(changePassword, initialState);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        安全设置
      </h2>

      {state.message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            state.ok
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            当前密码
          </label>
          <input
            type="password"
            name="currentPassword"
            required
            placeholder="请输入当前密码"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            新密码
          </label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={6}
            placeholder="请输入新密码（至少6位）"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            确认新密码
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={6}
            placeholder="请再次输入新密码"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}


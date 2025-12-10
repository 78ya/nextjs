"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateUserInfo, type UserInfoState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "保存中..." : "保存更改"}
    </button>
  );
}

interface UserProfileFormProps {
  initialName: string;
  initialEmail: string;
  initialAvatar?: string | null;
}

export default function UserProfileForm({ initialName, initialEmail, initialAvatar }: UserProfileFormProps) {
  const initialState: UserInfoState = { ok: true };
  const [state, formAction] = useActionState(updateUserInfo, initialState);
  const router = useRouter();

  // 成功后刷新页面以获取最新头像（Header 也会更新）
  useEffect(() => {
    if (state.ok && state.message) {
      router.refresh();
    }
  }, [state.ok, state.message, router]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        个人信息
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
            头像
          </label>
          <div className="flex items-center gap-4">
            {initialAvatar ? (
              <img
                src={initialAvatar}
                alt={initialName}
                className="w-14 h-14 rounded-full ring-2 ring-white dark:ring-zinc-800 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 ring-2 ring-white dark:ring-zinc-800">
                无
              </div>
            )}
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="text-sm text-zinc-700 dark:text-zinc-200"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            选择新头像后会自动上传并更新
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            昵称
          </label>
          <input
            type="text"
            name="name"
            defaultValue={initialName}
            required
            placeholder="请输入昵称"
            aria-label="昵称"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
            />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            邮箱地址
          </label>
          <input
            type="email"
            name="email"
            value={initialEmail}
            disabled
            aria-label="邮箱地址"
            title="邮箱地址不可修改"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            邮箱地址不可修改
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            手机号码
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="请输入手机号码"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}

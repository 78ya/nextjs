"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  sendCodeAction,
  verifyCodeAction,
  type RegisterState,
} from "./actions";

const initialState: RegisterState = {
  ok: true,
  step: "info",
};

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "处理中..." : text}
    </button>
  );
}

function SendCodeButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "发送中..." : "发送验证码"}
    </button>
  );
}

export default function RegisterForm() {
  const [state, formAction] = useFormState(sendCodeAction, initialState);
  const [verifyState, verifyFormAction] = useFormState(
    verifyCodeAction,
    initialState
  );

  // 当第一步成功时，切换到验证码步骤
  const currentStep = verifyState.step === "verify" ? "verify" : state.step;
  const displayState = currentStep === "verify" ? verifyState : state;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
          {currentStep === "verify" ? "验证邮箱" : "创建新账户"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {currentStep === "verify"
            ? `验证码已发送到 ${state.email || ""}，请查收`
            : "填写信息，几秒钟即可完成注册"}
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <div
          className={`h-2 w-16 rounded-full ${
            currentStep === "info"
              ? "bg-zinc-900 dark:bg-zinc-100"
              : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        />
        <div
          className={`h-2 w-16 rounded-full ${
            currentStep === "verify"
              ? "bg-zinc-900 dark:bg-zinc-100"
              : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        />
      </div>

      {/* 错误/成功提示 */}
      {displayState.message && (
        <div
          className={`mb-4 p-3 border rounded-lg text-sm ${
            displayState.ok
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          }`}
        >
          {displayState.message}
        </div>
      )}

      {/* 第一步：基本信息表单 */}
      {currentStep === "info" && (
        <form action={formAction} className="space-y-6">
          {/* 昵称 */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              昵称
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
              placeholder="你的昵称"
            />
          </div>

          {/* 邮箱 */}
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
              placeholder="you@example.com"
            />
          </div>

          {/* 密码 */}
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
              placeholder="至少 6 位字符"
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              确认密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
              placeholder="再次输入密码"
            />
          </div>

          <SendCodeButton />
        </form>
      )}

      {/* 第二步：验证码表单 */}
      {currentStep === "verify" && (
        <form action={verifyFormAction} className="space-y-6">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              验证码
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              请输入 6 位数字验证码
            </p>
          </div>

          <SubmitButton text="完成注册" />

          {/* 重新发送验证码 */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                // 重新发送验证码的逻辑可以在这里实现
                window.location.reload();
              }}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              未收到验证码？重新发送
            </button>
          </div>
        </form>
      )}

      {/* 登录链接 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          已有账户？{" "}
          <a
            href="/login"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            直接登录
          </a>
        </p>
      </div>
    </div>
  );
}



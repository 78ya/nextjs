import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4">
      <div className="w-full max-w-2xl text-center">
        {/* 404 数字 */}
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-bold text-zinc-200 dark:text-zinc-800 leading-none">
            404
          </h1>
        </div>

        {/* 简单线条装饰 */}
        <div className="mb-8 mx-auto w-64 h-32 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute inset-4 flex flex-col justify-between">
            <div className="h-2 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700 mx-auto" />
            <div className="space-y-2">
              <div className="h-[1px] w-full bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
              <div className="h-[1px] w-4/5 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700 mx-auto" />
              <div className="h-[1px] w-3/5 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700 mx-auto" />
            </div>
            <div className="flex gap-2 justify-center">
              <div className="h-6 w-16 rounded-full border border-zinc-200 dark:border-zinc-700" />
              <div className="h-6 w-16 rounded-full border border-zinc-200 dark:border-zinc-700" />
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-black dark:text-zinc-50">
            页面未找到
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            抱歉，您访问的页面不存在。可能是链接错误，或者页面已被移除。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 text-zinc-50 px-6 py-3 text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            去登录
          </Link>
        </div>

        {/* 常用链接 */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            您可能想要访问：
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              首页
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <Link
              href="/login"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              登录
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <Link
              href="/register"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


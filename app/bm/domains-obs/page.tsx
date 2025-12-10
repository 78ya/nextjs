"use client";

export default function DomainsObsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">域名观测</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            查看域名解析、证书状态与健康检查（观测页，占位）
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">已接入域名</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">—</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">DNS 记录数</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">—</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">SSL 证书</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">—</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">解析与健康概览</p>
        <div className="text-zinc-500 dark:text-zinc-400 text-sm">待接入后端数据...</div>
      </div>
    </div>
  );
}


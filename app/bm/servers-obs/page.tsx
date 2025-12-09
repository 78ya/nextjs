"use client";

export default function ServersObsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            服务器观测
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            观测服务器/节点状态与分组（占位）
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            刷新
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">服务器列表</p>
          <button className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            新建视图
          </button>
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-sm mt-3">
          待接入后端数据...
        </div>
      </div>
    </div>
  );
}


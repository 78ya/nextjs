import { headers } from "next/headers";

export default async function MaintenancePage() {
  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "未知";
  const now = new Date().toLocaleString("zh-CN", { hour12: false });

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/70 dark:border-zinc-800/70 rounded-3xl shadow-xl p-10 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
          ⚙️
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            维护模式
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            我们正在进行系统维护或初始化操作。<br />
            请稍后再试，感谢理解。
          </p>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-500">
          如果长时间无法访问，请联系管理员。
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-500 bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
          如果你是管理员，请完成初始化或维护后，关闭维护模式的环境变量（如 <code>MAINTENANCE_MODE</code>）或更新 middleware 设置，即可恢复访问。
        </div>
        <div className="text-left text-xs text-zinc-500 dark:text-zinc-500 bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 space-y-1">
          <div>当前时间：{now}</div>
          <div>请求来源 IP：{clientIp}</div>
          <div>User-Agent：{hdrs.get("user-agent") ?? "未知"}</div>
          <div>Referer：{hdrs.get("referer") ?? "无"}</div>
        </div>
      </div>
    </main>
  );
}


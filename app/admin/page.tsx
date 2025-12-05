import { get } from "@vercel/edge-config";

async function getAdminUrl(): Promise<string> {
  const cfg = await get<{ admin?: { url?: string } }>("admin");
  if (cfg && typeof cfg === "object" && "admin" in cfg) {
    const url = cfg.admin?.url;
    if (url) return url;
  }
  return "admin";
}

export default async function AdminPage() {
  const adminUrl = await getAdminUrl();

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md p-8 text-center space-y-4">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          管理后台
        </h1>
        <div className="space-y-2">
          <p className="text-zinc-600 dark:text-zinc-400">
            管理地址已配置，请点击访问：
          </p>
          <a
            href={adminUrl}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium hover:opacity-90 transition"
          >
            打开后台
          </a>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 break-words">
            {adminUrl}
          </p>
        </div>
      </div>
    </main>
  );
}


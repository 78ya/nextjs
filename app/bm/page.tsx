import {
  ChartBarIcon,
  ServerIcon,
  LockClosedIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";

export default function AdminPage() {
  const cards = [
    { name: "FRP 观测", href: "/bm/frp-obs", Icon: ChartBarIcon },
    { name: "VPN 观测", href: "/bm/vpn-obs", Icon: LockClosedIcon },
    { name: "服务器观测", href: "/bm/servers-obs", Icon: ServerIcon },
    { name: "数据统计", href: "/bm/statistics", Icon: ChartPieIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          欢迎回来
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          这是您的管理后台首页，请从左侧菜单选择功能
        </p>
      </div>

      {/* 快速访问卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ name, href, Icon }) => (
          <a
            key={href}
            href={href}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  点击访问
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

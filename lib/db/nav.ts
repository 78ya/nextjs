import { getLibsqlClient } from "./client";

export interface NavItemRecord {
  id: number;
  parent_label: string | null;
  title: string;
  href: string;
  permission: string | null;
  icon: string | null;
  sort: number;
  admin_only: number;
  created_at: string;
  updated_at: string;
}

async function ensureNavTable() {
  const client = await getLibsqlClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS nav_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_label TEXT,
      title TEXT NOT NULL,
      href TEXT NOT NULL,
      permission TEXT,
      icon TEXT,
      sort INTEGER DEFAULT 0,
      admin_only INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_nav_parent_sort ON nav_items(parent_label, sort, id);
  `);
}

export async function listNavItems(): Promise<NavItemRecord[]> {
  const client = await getLibsqlClient();
  await ensureNavTable();

  const res = await client.execute({
    sql: `
      SELECT *
      FROM nav_items
      ORDER BY
        COALESCE(parent_label, '') ASC,
        sort ASC,
        id ASC
    `,
  });

  return res.rows as any as NavItemRecord[];
}

export async function seedNavItemsIfEmpty(): Promise<void> {
  const client = await getLibsqlClient();
  await ensureNavTable();

  const countRes = await client.execute(`SELECT COUNT(*) as cnt FROM nav_items`);
  const count = Number((countRes.rows[0] as any)?.cnt ?? 0);
  if (count > 0) return;

  const seed = [
    // 仪表盘
    { parent_label: "仪表盘", title: "FRP 观测", href: "/bm/frp-obs", permission: "bm.frp.view", icon: "CpuChipIcon", sort: 1, admin_only: 0 },
    { parent_label: "仪表盘", title: "服务器观测", href: "/bm/servers-obs", permission: "bm.servers.view", icon: "ServerIcon", sort: 2, admin_only: 0 },
    { parent_label: "仪表盘", title: "域名观测", href: "/bm/domains-obs", permission: "bm.domains.view", icon: "GlobeAltIcon", sort: 3, admin_only: 0 },
    { parent_label: "仪表盘", title: "VPN 观测", href: "/bm/vpn-obs", permission: "bm.vpn.view", icon: "LockClosedIcon", sort: 4, admin_only: 0 },
    { parent_label: "仪表盘", title: "数据统计", href: "/bm/statistics", permission: "bm.stats.view", icon: "ChartPieIcon", sort: 5, admin_only: 0 },
    // 管理
    { parent_label: "管理", title: "FRP 管理", href: "/bm/frp-admin", permission: "bm.frp.manage", icon: "ShieldCheckIcon", sort: 1, admin_only: 0 },
    { parent_label: "管理", title: "VPN 管理", href: "/bm/vpn-admin", permission: "bm.vpn.manage", icon: "LockClosedIcon", sort: 2, admin_only: 0 },
    { parent_label: "管理", title: "服务器管理", href: "/bm/servers-admin", permission: "bm.servers.manage", icon: "ServerIcon", sort: 3, admin_only: 0 },
    { parent_label: "管理", title: "域名管理", href: "/bm/domains-admin", permission: "bm.domains.manage", icon: "GlobeAltIcon", sort: 4, admin_only: 0 },
    { parent_label: "管理", title: "文章管理", href: "/bm/articles", permission: "bm.articles.list", icon: "ClipboardDocumentListIcon", sort: 5, admin_only: 0 },
    { parent_label: "管理", title: "文章发布", href: "/bm/articles/new", permission: "bm.articles.publish", icon: "PencilSquareIcon", sort: 6, admin_only: 1 },
    // 设置
    { parent_label: "设置", title: "设备管理", href: "/bm/settings", permission: "bm.settings.devices", icon: "AdjustmentsHorizontalIcon", sort: 1, admin_only: 1 },
    { parent_label: "设置", title: "会话管理", href: "/bm/sessions", permission: "bm.sessions.view", icon: "ShieldCheckIcon", sort: 2, admin_only: 0 },
    { parent_label: "设置", title: "个人设置", href: "/bm/profile", permission: "bm.profile", icon: "UserCircleIcon", sort: 3, admin_only: 0 },
  ];

  const placeholders = seed
    .map(() => "(?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    .join(", ");

  await client.execute({
    sql: `
      INSERT INTO nav_items (parent_label, title, href, permission, icon, sort, admin_only, created_at, updated_at)
      VALUES ${placeholders}
    `,
    args: seed.flatMap((s) => [
      s.parent_label,
      s.title,
      s.href,
      s.permission,
      s.icon,
      s.sort,
      s.admin_only,
    ]),
  });
}


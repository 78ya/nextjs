import {
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  FolderIcon,
  HomeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  name: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  items: NavItem[];
  adminOnly?: boolean;
}

export const groups: NavGroup[] = [
  {
    label: "仪表盘",
    icon: ChartBarIcon,
    items: [
      { name: "FRP 观测", href: "/bm/frp-obs", Icon: CpuChipIcon },
      { name: "服务器观测", href: "/bm/servers-obs", Icon: ServerIcon },
      { name: "VPN 观测", href: "/bm/vpn-obs", Icon: LockClosedIcon },
      { name: "数据统计", href: "/bm/statistics", Icon: ChartPieIcon },
    ],
  },
  {
    label: "管理",
    icon: FolderIcon,
    items: [
      { name: "FRP 管理", href: "/bm/frp-admin", Icon: ShieldCheckIcon },
      { name: "VPN 管理", href: "/bm/vpn-admin", Icon: LockClosedIcon },
      { name: "服务器管理", href: "/bm/servers-admin", Icon: ServerIcon },
      { name: "文章管理", href: "/bm/articles", Icon: ClipboardDocumentListIcon },
      { name: "文章发布", href: "/bm/articles/new", Icon: PencilSquareIcon, adminOnly: true },
    ],
  },
  {
    label: "设置",
    icon: Cog6ToothIcon,
    items: [
      { name: "设备管理", href: "/bm/settings", Icon: AdjustmentsHorizontalIcon, adminOnly: true },
      { name: "会话管理", href: "/bm/sessions", Icon: ShieldCheckIcon },
      { name: "个人设置", href: "/bm/profile", Icon: UserCircleIcon },
    ],
  },
];

// 供顶部 Logo 的图标使用
export const topLogoIcon = HomeIcon;


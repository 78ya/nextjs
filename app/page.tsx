import { listArticles } from "@/lib/db/articles";
import { getEdgeConfig } from "@/lib/edge-config";
import { HomeTopBar } from "./components/home-topbar";
import { AnimatedArticles } from "./components/animated-articles";

export const revalidate = 0;

type HomeArticle = {
  id: number;
  title: string;
  slug: string;
  tags: string[];
  updated_at: string;
  published_at: string | null;
  blob_url: string;
  excerpt: string;
};

type TimelineItem = {
  title: string;
  desc: string;
  date: string; // ISO
  kind: "article";
};

async function fetchLatestArticles(limit = 4): Promise<HomeArticle[]> {
  const { items } = await listArticles({
    limit,
    offset: 0,
    status: "published",
    includeSoftDeleted: false,
  });

  const withExcerpt = await Promise.all(
    items.map(async (item) => {
      let excerpt = "";
      try {
        const res = await fetch(item.blob_url, { cache: "no-store" });
        if (res.ok) {
          const text = await res.text();
          excerpt = text.replace(/\s+/g, " ").slice(0, 160);
          if (text.length > 160) {
            excerpt = `${excerpt}...`;
          }
        }
      } catch (error) {
        console.warn("[home] fetch excerpt failed", error);
      }

      return {
        ...item,
        excerpt: excerpt || "暂无摘要，点击阅读全文",
      };
    })
  );

  return withExcerpt;
}

async function fetchTimeline(limit = 8): Promise<TimelineItem[]> {
  const articles = await listArticles({
    limit,
    offset: 0,
    status: "published",
    includeSoftDeleted: false,
  });

  return articles.items
    .map((a) => ({
      title: "文章发布",
      desc: `${a.title} · ${a.tags?.[0] || "发布"} · v${a.version}`,
      date: a.published_at || a.updated_at || "",
      kind: "article" as const,
    }))
    .filter((i) => i.date)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, limit);
}

const featureCards = [
  {
    title: "快速起步",
    desc: "基于 Next.js App Router 与 Tailwind，开箱即用的暗色 / 亮色主题。",
    icon: "⚡",
  },
  {
    title: "组件化",
    desc: "常见组件拆分完备，便于复用与扩展。",
    icon: "🧩",
  },
  {
    title: "可视化占位",
    desc: "预留统计、列表、卡片区，后续可无缝接入数据。",
    icon: "📊",
  },
  {
    title: "响应式布局",
    desc: "移动端到桌面端的栅格布局已就绪。",
    icon: "📱",
  },
];

const statCards = [
  { title: "文章", value: "即时刷新", delta: "已接入后端" },
  { title: "页面组件", value: "24", delta: "可复用" },
  { title: "样式变量", value: "20+", delta: "暗 / 亮" },
];

const timeline = [
  { title: "首页对接文章", date: "2025-12-11", desc: "主页展示真实文章列表" },
  { title: "完善编辑/发布", date: "2025-12-10", desc: "支持草稿 / 发布与回收站" },
  { title: "接入 Blob 存储", date: "2025-12-09", desc: "MD 上传到 Vercel Blob" },
];

const socialLinks = [
  { name: "GitHub", href: "https://github.com", hint: "代码与开源" },
  { name: "Twitter/X", href: "https://x.com", hint: "想法与动态" },
  { name: "Email", href: "mailto:hi@example.com", hint: "合作与交流" },
];

export default async function Home() {
  const [latestArticles, timelineItems, siteTitle] = await Promise.all([
    fetchLatestArticles(4),
    fetchTimeline(8),
    getEdgeConfig<string>("/copywriting/title"),
  ]);

  const title = siteTitle || "78ya 博客";

  return (
    <div className="flex min-h-screen justify-center overflow-x-hidden bg-zinc-50 font-sans dark:bg-black">
      <HomeTopBar siteTitle={title} />
      <main className="flex min-h-screen w-full max-w-6xl flex-col gap-12 overflow-x-hidden py-20 px-5 sm:px-8 lg:px-12 bg-white dark:bg-black">
        {/* 顶部 Hero */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4 max-w-xl">
            <p className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              {title}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
              记录与分享 · 简洁为先
            </h1>
            <p className="text-base sm:text-lg leading-7 text-zinc-600 dark:text-zinc-400">
              首页已接入真实文章，支持暗色 / 亮色切换。点击下方文章即可查看全文。
            </p>
          </div>

          {/* 右侧极简“画框” */}
          <div className="mt-6 sm:mt-0 w-full sm:w-72 lg:w-80 h-40 sm:h-44 lg:h-48 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/40 relative overflow-hidden">
            <div className="absolute inset-4 flex flex-col justify-between">
              <div className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="space-y-2">
                <div className="h-[1px] w-full bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
                <div className="h-[1px] w-4/5 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
                <div className="h-[1px] w-3/5 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
              </div>
              <div className="flex gap-2">
                <div className="h-7 flex-1 rounded-full border border-zinc-200 dark:border-zinc-700" />
                <div className="h-7 flex-1 rounded-full border border-zinc-200 dark:border-zinc-700" />
              </div>
            </div>
          </div>
        </section>

        {/* 精选文章 / 最新发布 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              最新发布
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              已发布文章 · 实时读取
            </span>
          </div>
          <AnimatedArticles articles={latestArticles} />
        </section>

        {/* 时间线 / 动态 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              时间线 / 动态
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              最新 8 条 · 文章发布
            </span>
          </div>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-5 space-y-4">
            {timelineItems.length === 0 ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">暂无动态</div>
            ) : (
              timelineItems.map((item, idx) => (
                <div
                  key={`${item.kind}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <p className="text-sm font-semibold text-black dark:text-zinc-50">
                      {item.title}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.date?.slice(0, 10)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 功能亮点 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              功能亮点
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              依旧保留的示例模块
            </span>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {featureCards.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                    {f.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">可按需替换或隐藏</div>
              </div>
            ))}
                </div>
        </section>

        {/* 社交链接 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              社交链接
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              联系方式 / 关注渠道
                  </span>
                </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="text-sm font-semibold text-black dark:text-zinc-50">{s.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{s.hint}</div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

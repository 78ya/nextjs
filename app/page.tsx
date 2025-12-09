type BlogCard = {
  id: number;
  title: string;
  summary: string;
  date: string;
  tag: string;
};

const blogCards: BlogCard[] = [
  {
    id: 1,
    title: "用 5 分钟搭好一个 Next.js 应用",
    summary: "从零到可访问首页，快速了解 Next.js App Router 的基本结构和思路。",
    date: "2025-12-04",
    tag: "Next.js",
  },
  {
    id: 2,
    title: "Tailwind + 暗色模式的优雅布局",
    summary: "一套简单但干净的页面布局，让你的首页既好看又易于扩展。",
    date: "2025-11-28",
    tag: "UI / UX",
  },
  {
    id: 3,
    title: "从登录页开始的应用状态设计",
    summary: "用 Server Actions 和 Edge Config 打通登录流程的整体思路。",
    date: "2025-11-15",
    tag: "Architecture",
  },
];

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
  { title: "示例文章", value: "12", delta: "+3 本" },
  { title: "页面组件", value: "24", delta: "可复用" },
  { title: "样式变量", value: "20+", delta: "暗 / 亮" },
];

const timeline = [
  { title: "发布首页初版", date: "2025-12-01", desc: "完成基础布局与暗色模式" },
  { title: "加入博客卡片", date: "2025-12-03", desc: "新增文章列表与标签样式" },
  { title: "完善 Hero 与 CTA", date: "2025-12-05", desc: "强化首屏说明与转化入口" },
];

const socialLinks = [
  { name: "GitHub", href: "https://github.com", hint: "代码与开源" },
  { name: "Twitter/X", href: "https://x.com", hint: "想法与动态" },
  { name: "Email", href: "mailto:hi@example.com", hint: "合作与交流" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-6xl flex-col gap-12 py-16 px-6 sm:px-10 lg:px-16 bg-white dark:bg-black">
        {/* 顶部 Hero */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4 max-w-xl">
            <p className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              78ya 的博客
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
              记录与分享 · 简洁为先
            </h1>
            <p className="text-base sm:text-lg leading-7 text-zinc-600 dark:text-zinc-400">
              这里先用占位内容演示布局，后续可接入真实文章、时间线动态与作品集。
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 text-zinc-50 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                登录
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                注册
              </a>
            </div>
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

        {/* 精选文章 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              精选文章
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              占位内容 · 后续接入真实文章
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
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  阅读更多（占位）
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 时间线 / 动态 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              时间线 / 动态
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              最近进展 · 占位
            </span>
          </div>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-5 space-y-4">
            {timeline.map((item) => (
              <div key={item.title} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="text-sm font-semibold text-black dark:text-zinc-50">{item.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 博客列表（保留占位） */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-zinc-50">
              最新博客
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              纯占位数据 · 暂无真实文章页
            </span>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {blogCards.map((post) => (
              <article
                key={post.id}
                className="group rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
              >
                {/* 简单线条封面 */}
                <div className="mb-4 h-20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 overflow-hidden relative">
                  <div className="absolute inset-3 flex flex-col justify-between">
                    <div className="h-[1px] w-full bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
                    <div className="h-[1px] w-3/4 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
                    <div className="h-[1px] w-1/2 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-900 text-zinc-50 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-100 dark:text-zinc-900">
                    {post.tag}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {post.date}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-black dark:text-zinc-50 mb-1 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>阅读更多（占位）</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </article>
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

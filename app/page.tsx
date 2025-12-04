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

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-5xl flex-col gap-12 py-16 px-6 sm:px-10 lg:px-16 bg-white dark:bg-black">
        {/* 顶部 Hero */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4 max-w-xl">
            <p className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              小博客 · Next.js 示例
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-black dark:text-zinc-50">
              打造一个干净、简单的博客首页
            </h1>
            <p className="text-base sm:text-lg leading-7 text-zinc-600 dark:text-zinc-400">
              这里展示的是几篇随机生成的占位博客数据，用来演示布局和样式。
              真正的文章内容可以以后接入数据库或 Markdown 文件。
            </p>
          </div>

          {/* 右侧简单线条“图片” */}
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

        {/* 登录 / 注册 快捷入口 */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 px-5 py-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p>想体验完整流程？可以先注册一个账户，再使用登录页进入应用。</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              登录
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 text-zinc-50 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              注册
            </a>
          </div>
        </section>

        {/* 博客列表 */}
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
      </main>
    </div>
  );
}

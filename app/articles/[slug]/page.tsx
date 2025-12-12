import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { findBySlug } from "@/lib/db/articles";

async function fetchContent(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("读取文章内容失败");
  }
  return res.text();
}

export default async function ArticleViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await findBySlug(slug);

  if (!article || article.status !== "published" || article.soft_deleted_at) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-center flex items-center justify-center">
        <div className="text-zinc-500 dark:text-zinc-400">文章不存在或未发布</div>
      </div>
    );
  }

  const content = await fetchContent(article.blob_url);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-2 mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">/articles/{article.slug}</p>
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>作者：{article.author_email}</span>
            <span>更新：{new Date(article.updated_at).toLocaleString()}</span>
            {article.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                  >
                    #{tag}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}


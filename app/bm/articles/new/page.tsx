"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUturnLeftIcon,
  CloudArrowUpIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const MAX_MD_BYTES = 1024 * 1024;
const MAX_MD_LINES = 1000;

export default function ArticleNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [content, setContent] = useState("");
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const autoSlug = useMemo(() => {
    const clean = title
      .toLowerCase()
      .trim()
      .replace(/[\s/\\]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    const suffix = Date.now().toString(36);
    return `${clean || "article"}-${suffix}`;
  }, [title]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        await handleImageUpload(file);
      } else if (file.name.toLowerCase().endsWith(".md")) {
        await handleMdFile(file);
      } else {
        setError("仅支持 .md 或图片文件");
      }
    }
  };

  const handleMdFile = async (file: File) => {
    if (file.size > MAX_MD_BYTES) {
      setError("Markdown 文件超过 1MB");
      return;
    }
    const text = await file.text();
    const lineCount = text.split(/\r?\n/).length;
    if (lineCount > MAX_MD_LINES) {
      setError("Markdown 文件超过 1000 行限制");
      return;
    }
    setMdFile(file);
    setContent(text);
    setError(null);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/articles/upload-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "图片上传失败");
      }
      setContent((prev) => `${prev}\n\n![](${data.url})`);
    } catch (err: any) {
      setError(err?.message || "图片上传失败");
    }
  };

  const handleSubmit = async (publish: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("slug", autoSlug);
      formData.append("status", publish ? "published" : "draft");
      if (tags.trim()) formData.append("tags", tags.trim());
      if (mdFile) {
        formData.append("file", mdFile);
      } else {
        formData.append("content", content);
      }

      const res = await fetch("/api/articles", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "保存失败");
      }
      router.push(`/bm/articles/${data.article.id}`);
    } catch (err: any) {
      setError(err?.message || "保存失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    dropArea.addEventListener("dragover", handleDragOver);
    return () => dropArea.removeEventListener("dragover", handleDragOver);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">文章发布</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            支持拖拽 .md / 图片，实时预览
          </p>
        </div>
        <button
          onClick={() => router.push("/bm/articles")}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
          返回列表
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                标题
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入标题"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                URL（自动生成）
              </label>
              <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 break-all">
                /articles/{autoSlug}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                标签（逗号分隔，最多 5 个）
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="draft">草稿</option>
                <option value="published">发布</option>
              </select>
            </div>
          </div>

          <div
            ref={dropRef}
            onDrop={onDrop}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
          >
            <CloudArrowUpIcon className="h-8 w-8 text-zinc-400" />
            <p>拖拽 .md 或图片到此处</p>
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <span>选择 .md</span>
                <input
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMdFile(file);
                  }}
                />
              </label>
              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <PhotoIcon className="h-4 w-4" />
                <span>上传图片</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Markdown ≤1MB / 1000 行；图片 ≤50MB
            </p>
          </div>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setMdFile(null);
            }}
            rows={14}
            placeholder="编写 Markdown 内容，支持粘贴/拖拽图片自动插入链接"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
          />

          <div className="flex justify-end gap-3">
            <button
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
            >
              保存草稿
            </button>
            <button
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-60"
            >
              发布
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">实时预览</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {content.split(/\r?\n/).length} 行 / {(new TextEncoder().encode(content).length / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "开始输入以预览..."}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useRef } from "react";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
  onUpload?: (file: File) => Promise<void>;
}

export default function AvatarUpload({
  currentAvatar,
  userName,
  onUpload,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = userName || "用户";
  const initial = displayName.charAt(0).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 上传文件
    if (onUpload) {
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (error) {
        console.error("上传失败:", error);
        alert("上传失败，请重试");
        setPreview(currentAvatar || null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          onClick={handleClick}
          className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          {preview ? (
            <img
              src={preview}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-3xl font-semibold text-zinc-600 dark:text-zinc-400">
                {initial}
              </span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/50 flex items-center justify-center transition-colors">
            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
              更换
            </span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
      >
        {isUploading ? "上传中..." : "上传头像"}
      </button>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        支持 JPG、PNG 格式，最大 5MB
      </p>
    </div>
  );
}


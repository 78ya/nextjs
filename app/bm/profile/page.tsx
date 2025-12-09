"use client";

import { useState } from "react";
import AvatarUpload from "../components/AvatarUpload";
import { useNotification } from "../components/NotificationProvider";

export default function ProfilePage() {
  const { showNotification } = useNotification();
  const [userInfo, setUserInfo] = useState({
    name: "用户",
    email: "user@example.com",
    phone: "",
    avatar: null as string | null,
  });

  const handleAvatarUpload = async (file: File) => {
    // TODO: 实现头像上传到服务器
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUserInfo({ ...userInfo, avatar: reader.result as string });
          showNotification("success", "头像上传成功");
          resolve();
        };
        reader.readAsDataURL(file);
      }, 1000);
    });
  };

  const handleSave = () => {
    // TODO: 保存用户信息到 API
    showNotification("success", "个人信息已更新");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          个人设置
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          管理您的个人信息和账号设置
        </p>
      </div>

      {/* 头像设置 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
          头像设置
        </h2>
        <AvatarUpload
          currentAvatar={userInfo.avatar || undefined}
          userName={userInfo.name}
          onUpload={handleAvatarUpload}
        />
      </div>

      {/* 个人信息 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
          个人信息
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              昵称
            </label>
            <input
              type="text"
              value={userInfo.name}
              onChange={(e) =>
                setUserInfo({ ...userInfo, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              value={userInfo.email}
              disabled
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              邮箱地址不可修改
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              手机号码
            </label>
            <input
              type="tel"
              value={userInfo.phone}
              onChange={(e) =>
                setUserInfo({ ...userInfo, phone: e.target.value })
              }
              placeholder="请输入手机号码"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              保存更改
            </button>
          </div>
        </div>
      </div>

      {/* 密码修改 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
          修改密码
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              当前密码
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              新密码
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              确认新密码
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
              修改密码
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

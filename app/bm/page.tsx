import { redirect } from "next/navigation";
import { getUserInfo } from "./actions";
import UserProfileForm from "./userProfileForm";
import PasswordChangeForm from "./passwordChangeForm";
import AccountActions from "./accountActions";

export default async function AdminPage() {
  const userInfo = await getUserInfo();

  if (!userInfo) {
    redirect("/login");
  }

  const displayName = userInfo.name || "用户";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            账号后台管理
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            管理您的账号信息、设置和安全选项
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：用户信息卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
              {/* 用户头像 */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <span className="text-3xl font-semibold text-zinc-600 dark:text-zinc-400">
                    {initial}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  {displayName}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {userInfo.email}
                </p>
              </div>

              {/* 统计信息 */}
              <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">账号状态</span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    正常
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：功能区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 个人信息 */}
            <UserProfileForm initialName={displayName} initialEmail={userInfo.email} />

            {/* 安全设置 */}
            <PasswordChangeForm />

            {/* 账号操作 */}
            <AccountActions />
          </div>
        </div>

        {/* 返回首页链接 */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </main>
  );
}


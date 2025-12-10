"use server";

import { redirect } from "next/navigation";
import { getUserInfo } from "../actions";
import UserProfileForm from "../userProfileForm";

export default async function ProfilePage() {
  const info = await getUserInfo();

  if (!info) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          个人设置
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          管理您的个人信息和账号设置
        </p>
      </div>

      <UserProfileForm
        initialName={info.name ?? "用户"}
        initialEmail={info.email}
        initialAvatar={info.avatar ?? undefined}
      />
    </div>
  );
}

import AdminLoginForm from "./AdminLoginForm";

export default function AdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <AdminLoginForm />
        
        {/* 返回首页链接 */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </main>
  );
}


import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4">
      <div className="w-full max-w-md">
        <LoginForm />
        
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
    </div>
  );
}

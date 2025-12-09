"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查系统主题或存储的主题
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initialTheme = storedTheme || systemTheme;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = theme === "light" ? "dark" : "light";

    // 优先使用 View Transition；若不支持或用户偏好减少动画，则直接切换
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // @ts-ignore
    if (!document.startViewTransition || reduceMotion) {
      setTheme(newTheme);
      applyTheme(newTheme);
      return;
    }

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
      applyTheme(newTheme);
    });

    // 计算点击位置到最远角落的距离
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    transition.ready.then(() => {
      const forward = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      const keyframes =
        newTheme === "dark" ? forward : [...forward].reverse();

      const target =
        newTheme === "dark"
          ? "::view-transition-new(root)"
          : "::view-transition-old(root)";

      document.documentElement.animate(
        { clipPath: keyframes },
        {
          duration: 420,
          easing: "ease-in-out",
          pseudoElement: target,
        }
      );
    });
  };

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        aria-label="切换主题"
      >
        <span className="text-xl">🌓</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors overflow-hidden group w-10 h-10 flex items-center justify-center"
      aria-label={`切换到${theme === "light" ? "深色" : "浅色"}模式`}
      title={`当前：${theme === "light" ? "浅色" : "深色"}模式`}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
          theme === "dark"
            ? "rotate-0 opacity-100 scale-100"
            : "-rotate-90 opacity-0 scale-0"
        }`}
      >
        <span className="text-xl">🌙</span>
      </div>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
          theme === "light"
            ? "rotate-0 opacity-100 scale-100"
            : "rotate-90 opacity-0 scale-0"
        }`}
      >
        <span className="text-xl">☀️</span>
      </div>
    </button>
  );
}

"use client";

import { useState } from "react";

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            数据统计
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            详细的系统数据分析和统计
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) =>
              setTimeRange(e.target.value as "7d" | "30d" | "90d" | "1y")
            }
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="7d">最近 7 天</option>
            <option value="30d">最近 30 天</option>
            <option value="90d">最近 90 天</option>
            <option value="1y">最近 1 年</option>
          </select>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "总访问量", value: "12,345", change: "+15%" },
          { title: "新用户", value: "234", change: "+8%" },
          { title: "活跃用户", value: "1,234", change: "+12%" },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {stat.title}
            </p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
              {stat.value}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {stat.change} 较上期
            </p>
          </div>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 用户增长趋势 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            用户增长趋势
          </h2>
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <p className="text-4xl mb-2">📈</p>
              <p>折线图占位符</p>
              <p className="text-sm mt-2">待集成数据可视化库</p>
            </div>
          </div>
        </div>

        {/* 用户活跃度 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            用户活跃度
          </h2>
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <p className="text-4xl mb-2">📊</p>
              <p>柱状图占位符</p>
              <p className="text-sm mt-2">待集成数据可视化库</p>
            </div>
          </div>
        </div>

        {/* 注册来源 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            注册来源分布
          </h2>
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <p className="text-4xl mb-2">🥧</p>
              <p>饼图占位符</p>
              <p className="text-sm mt-2">待集成数据可视化库</p>
            </div>
          </div>
        </div>

        {/* 时间段分布 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            访问时间段分布
          </h2>
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <p className="text-4xl mb-2">⏰</p>
              <p>热力图占位符</p>
              <p className="text-sm mt-2">待集成数据可视化库</p>
            </div>
          </div>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          详细数据
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  新用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  活跃用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  访问量
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {/* TODO: 从 API 获取数据 */}
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item}>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {Math.floor(Math.random() * 100)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {Math.floor(Math.random() * 500)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {Math.floor(Math.random() * 1000)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

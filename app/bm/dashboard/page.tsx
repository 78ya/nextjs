"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    todayRegistrations: 0,
    totalSessions: 0,
  });

  // TODO: 从 API 获取统计数据
  useEffect(() => {
    // 模拟数据
    setStats({
      totalUsers: 1234,
      activeUsers: 856,
      todayRegistrations: 23,
      totalSessions: 4567,
    });
  }, []);

  const statCards = [
    {
      title: "总用户数",
      value: stats.totalUsers,
      icon: "👥",
      gradient: "from-blue-500 to-blue-600",
      change: "+12%",
      trend: "up"
    },
    {
      title: "活跃用户",
      value: stats.activeUsers,
      icon: "🟢",
      gradient: "from-emerald-500 to-emerald-600",
      change: "+5%",
      trend: "up"
    },
    {
      title: "今日注册",
      value: stats.todayRegistrations,
      icon: "📈",
      gradient: "from-violet-500 to-violet-600",
      change: "+8%",
      trend: "up"
    },
    {
      title: "总会话数",
      value: stats.totalSessions,
      icon: "🔐",
      gradient: "from-orange-500 to-orange-600",
      change: "-2%",
      trend: "down"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          仪表板
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
          系统概览和关键业务指标
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-500`} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg shadow-zinc-200 dark:shadow-none`}>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${card.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <span>{card.change}</span>
                  <span>{card.trend === 'up' ? '↑' : '↓'}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 用户增长趋势图 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              用户增长趋势
            </h2>
            <select className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg text-sm px-3 py-1 text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
              <option>本周</option>
              <option>本月</option>
              <option>本年</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            {/* TODO: 集成图表库 */}
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 mx-auto mb-3 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📈</span>
              </div>
              <p className="font-medium text-zinc-900 dark:text-zinc-200">图表区域</p>
              <p className="text-sm text-zinc-500 mt-1">点击集成 Recharts 或 Chart.js</p>
            </div>
          </div>
        </div>

        {/* 用户角色分布 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              用户分布
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">查看详情</button>
          </div>
          <div className="h-64 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            {/* TODO: 集成饼图 */}
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 mx-auto mb-3 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🥧</span>
              </div>
              <p className="font-medium text-zinc-900 dark:text-zinc-200">数据分布</p>
              <p className="text-sm text-zinc-500 mt-1">待集成数据可视化组件</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          最近活动日志
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-default group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                i % 2 === 0 ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' : 'bg-orange-50 text-orange-500 dark:bg-orange-900/20'
              }`}>
                <span className="text-xl">{i % 2 === 0 ? '👤' : '🔒'}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {i % 2 === 0 ? '新用户注册' : '系统安全警告'}
                  </p>
                  <span className="text-xs text-zinc-400">2分钟前</span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {i % 2 === 0 ? '用户 user@example.com 完成了注册流程' : '检测到来自未知 IP 的异常登录尝试'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

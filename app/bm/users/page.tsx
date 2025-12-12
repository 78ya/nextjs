"use client";

import { useState, useEffect, useMemo } from "react";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPermission, setNoPermission] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchUsers = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError(null);
        setNoPermission(false);
        const params = new URLSearchParams();
        params.set("limit", String(itemsPerPage));
        params.set("offset", String((currentPage - 1) * itemsPerPage));
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setNoPermission(true);
          }
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "加载失败");
        }
        const data = await res.json();
        const list: User[] = (data.items || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          role: u.role,
          avatar: u.avatar ?? null,
          status: u.status ?? "active",
          createdAt: u.created_at || u.createdAt || "",
        }));
        setUsers(list);
        const total = Number(data.total || 0);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
      } catch (err: any) {
        setError(err?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage, roleFilter, searchTerm, statusFilter]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (id: number, role: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "更新失败");
      }
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "更新失败");
    }
  };

  const handleToggleStatus = async (id: number, current: string) => {
    const nextStatus = current === "disabled" ? "active" : "disabled";
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "更新失败");
      }
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "更新失败");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            用户管理
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
            管理系统用户、角色和权限
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          >
            刷新
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {noPermission && (
          <div className="px-6 py-4 bg-red-50 text-red-700 border-b border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800">
            当前用户/角色暂无权限
          </div>
        )}
        {/* 搜索和筛选 */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
              <input
                type="text"
                placeholder="搜索用户（邮箱或昵称）..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <option value="">所有角色</option>
              <option value="editor">编辑</option>
              <option value="admin">管理员</option>
              <option value="superadmin">超级管理员</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <option value="">所有状态</option>
              <option value="active">正常</option>
              <option value="disabled">已禁用</option>
            </select>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="overflow-x-auto">
          {error && (
            <div className="p-4 text-sm text-red-600 dark:text-red-300 border-b border-zinc-100 dark:border-zinc-800">
              {error}
            </div>
          )}
          {loading ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>
              加载中...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 text-left border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-sm">
                          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {user.name || "未设置"}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                      >
                        <option value="editor">编辑</option>
                        <option value="admin">管理员</option>
                        <option value="superadmin">超级管理员</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-200"
                          onClick={() => handleToggleStatus(user.id, user.status)}
                        >
                          {user.status === "disabled" ? "启用" : "禁用"}
                        </button>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === "disabled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          }`}
                        >
                          {user.status === "disabled" ? "已禁用" : "正常"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        {!loading && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              显示 <span className="font-medium">{users.length}</span> 条，
              共 <span className="font-medium">{totalCount}</span> 条
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              >
                上一页
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

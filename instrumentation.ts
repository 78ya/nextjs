/**
 * Next.js Instrumentation Hook
 * 
 * 此文件会在服务器启动时执行一次（在开发和生产环境都会运行）
 * 适用于：
 * - 数据库初始化
 * - 全局配置设置
 * - 启动时的检查和验证
 * 
 * 注意：
 * - 需要启用 experimental.instrumentationHook (在 next.config.ts 中)
 * - 只在服务器端运行，不会在客户端执行
 * - 每次服务器启动时只会运行一次
 */

import { tableCreate } from "@/lib/db/schema";
import { tableInDelete } from "@/lib/db/delete";

export async function register() {
    if (process.env.NODE_ENV != 'development') {
        // 开发环境
        if (process.env.TABLE_RECONSTRUCTION == "True") {
            // 重建表
            tableInDelete();
            // 删除成功后，重建表
            tableCreate();
        }
    }
}


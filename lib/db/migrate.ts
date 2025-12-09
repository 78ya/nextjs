"use server";

import { getLibsqlClient } from "./client";

/**
 * 检查并迁移 users 表结构
 * 如果表存在但缺少必要字段，尝试添加
 */
export async function migrateUsersTable(): Promise<void> {
  const client = await getLibsqlClient();
  
  try {
    // 检查表是否存在
    const tableCheck = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
    });
    
    if (tableCheck.rows.length === 0) {
      // 表不存在，不需要迁移
      return;
    }
    
    // 检查表结构
    const schemaCheck = await client.execute({
      sql: "PRAGMA table_info(users)",
    });
    
    const columns = schemaCheck.rows.map((row: any) => row.name);
    const migrations: string[] = [];
    
    // 检查并添加缺失的列
    if (!columns.includes('id')) {
      // 如果表没有 id 列，可能需要重建表
      // 但为了安全，我们先尝试添加
      console.warn('users 表缺少 id 列，建议重新创建表');
    }
    
    if (!columns.includes('role')) {
      // 添加 role 列，默认值为 'user'
      try {
        await client.execute({
          sql: "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
        });
        console.log('已添加 role 列到 users 表');
      } catch (error) {
        console.error('添加 role 列失败:', error);
      }
    }
    
  } catch (error) {
    console.error('迁移 users 表时出错:', error);
    // 不抛出错误，让调用者决定如何处理
  }
}


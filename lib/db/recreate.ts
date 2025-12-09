"use server";

import { getLibsqlClient } from "./client";
import {
  UsersTable,
  UserLogsTable,
  EmailVerificationTable,
  SessionsTable,
  AppConfigTable,
} from "./schema";

/**
 * 强制重建所有表（删除后重新创建）
 * 注意：这会删除所有数据！
 */
export async function recreateAllTables(): Promise<void> {
  const client = await getLibsqlClient();
  
  console.log('开始重建数据库表...');
  
  // 临时禁用外键约束检查
  await client.execute('PRAGMA foreign_keys = OFF');
  
  try {
    // 按照依赖关系的逆序删除表（先删除依赖表）
    const tablesToDrop = [
      'user_logs',
      'email_verifications',
      'sessions',
      'app_config',
      'users'
    ];
    
    // 删除所有表
    for (const tableName of tablesToDrop) {
      try {
        await client.execute(`DROP TABLE IF EXISTS "${tableName}"`);
        console.log(`已删除表: ${tableName}`);
      } catch (error) {
        console.warn(`删除表 ${tableName} 时出错（可能不存在）:`, error);
      }
    }
    
    // 删除所有索引
    try {
      await client.execute(`DROP INDEX IF EXISTS idx_users_email`);
      await client.execute(`DROP INDEX IF EXISTS idx_user_logs_user_id`);
      await client.execute(`DROP INDEX IF EXISTS idx_user_logs_timestamp`);
      await client.execute(`DROP INDEX IF EXISTS idx_email_verifications_user_id`);
      await client.execute(`DROP INDEX IF EXISTS idx_email_verifications_code`);
      await client.execute(`DROP INDEX IF EXISTS idx_sessions_session_id`);
      await client.execute(`DROP INDEX IF EXISTS idx_sessions_user_id`);
      await client.execute(`DROP INDEX IF EXISTS idx_sessions_expires_at`);
      await client.execute(`DROP INDEX IF EXISTS idx_app_config_key`);
      console.log('已删除所有索引');
    } catch (error) {
      console.warn('删除索引时出错:', error);
    }
    
    // 重新创建所有表
    const tableCreationFunctions = [
      { name: 'users', func: UsersTable },
      { name: 'user_logs', func: UserLogsTable },
      { name: 'email_verifications', func: EmailVerificationTable },
      { name: 'sessions', func: SessionsTable },
      { name: 'app_config', func: AppConfigTable }
    ];
    
    for (const { name, func } of tableCreationFunctions) {
      console.log(`创建表: ${name}`);
      const sql = await func();
      
      // 将SQL按分号分割并分别执行
      const statements = sql.split(';').filter(statement => statement.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await client.execute(statement.trim());
        }
      }
      
      console.log(`表 ${name} 创建完成`);
    }
    
    console.log('所有数据库表重建完成');
  } finally {
    // 重新启用外键约束检查
    await client.execute('PRAGMA foreign_keys = ON');
  }
}


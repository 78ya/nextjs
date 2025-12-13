"use server";

import { getLibsqlClient } from "./client";

// 表结构TypeScript接口定义

/**
 * 用户表接口
 */
export interface User {
  id: number;
  email: string;
  password: string;
  name?: string;
  qq?: string;
  phone?: string;
  avatar?: string;
  role: string;
  status?: string;
  created_at?: Date;
}

/**
 * 用户日志表接口
 */
export interface UserLog {
  id: number;
  ip: string;
  user_id?: number;
  timestamp: Date;
  action: string;
  allowed: number;
}

/**
 * 邮箱验证码表接口
 */
export interface EmailVerification {
  id: number;
  ip: string;
  timestamp: Date;
  code: string;
  user_id?: number;
}

/**
 * 会话表接口
 */
export interface Session {
  id: number;
  session_id: string;
  user_id?: number;
  data?: string;
  expires_at: Date;
  created_at: Date;
}

/**
 * 应用配置表接口
 */
export interface AppConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: Date;
  updated_by_id?: number;
}

/**
 * 文章表接口
 */
export interface Article {
  id: number;
  title: string;
  slug: string;
  author_email: string;
  status: "draft" | "published";
  tags: string[];
  version: number;
  current_blob_path: string;
  blob_url: string;
  line_count: number;
  size_bytes: number;
  created_at: Date;
  updated_at: Date;
  published_at?: Date | null;
  soft_deleted_at?: Date | null;
}

/**
 * 生成 users 表创建 SQL
 * 存储系统用户信息的核心表
 */
export async function UsersTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS users (
      -- 自增主键ID，唯一标识用户
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- 用户邮箱，登录凭证，必须唯一
      email TEXT NOT NULL UNIQUE,
      -- 加密后的用户密码
      password TEXT NOT NULL,
      -- 用户昵称（可选）
      name TEXT,
      -- 用户QQ号（可选）
      qq TEXT,
      -- 用户手机号（可选）
      phone TEXT,
      -- 用户头像URL（可选）
      avatar TEXT,
      -- 用户角色，如'editor'、'admin'、'superadmin' 等
      role TEXT NOT NULL DEFAULT 'editor',
      -- 用户状态，active / disabled
      status TEXT NOT NULL DEFAULT 'active',
      -- 创建时间
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 为常用查询字段添加索引
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  `;
}

/**
 * 生成 user_logs 表创建 SQL
 * 记录用户行为日志，用于安全审计和行为分析
 */
export async function UserLogsTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS user_logs (
      -- 自增主键ID
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- 用户IP地址，用于追踪来源
      ip TEXT NOT NULL,
      -- 关联用户ID，可为空（匿名访问）
      user_id INTEGER,
      -- 操作时间戳
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      -- 用户执行的操作描述
      action TEXT NOT NULL,
      -- 操作是否被允许（0否，1是）
      allowed INTEGER NOT NULL DEFAULT 0,
      -- 外键关联，用户删除时设为空
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    -- 为常用查询字段添加索引
    CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_logs_timestamp ON user_logs(timestamp);
  `;
}

/**
 * 生成 email_verifications 表创建 SQL
 * 存储邮箱验证码信息，用于用户注册和密码重置
 */
export async function EmailVerificationTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS email_verifications (
      -- 自增主键ID
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- 请求验证码的IP地址
      ip TEXT NOT NULL,
      -- 验证码生成时间戳
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      -- 验证码字符串
      code TEXT NOT NULL,
      -- 关联用户ID，可为空（新用户注册时）
      user_id INTEGER,
      -- 外键关联，用户删除时设为空
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    -- 为常用查询字段添加索引
    CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);
  `;
}

/**
 * 生成 sessions 表创建 SQL
 * 存储用户会话信息，用于身份验证和会话管理
 */
export async function SessionsTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS sessions (
      -- 自增主键ID
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- 会话唯一标识符
      session_id TEXT NOT NULL UNIQUE,
      -- 关联用户ID，可为空（匿名会话）
      user_id INTEGER,
      -- 会话数据，JSON格式存储
      data TEXT,
      -- 会话 IP（用于会话管理展示）
      ip TEXT,
      -- User-Agent（用于会话管理展示）
      user_agent TEXT,
      -- 解析后的设备/浏览器（便于 UI 展示）
      device TEXT,
      browser TEXT,
      -- 会话过期时间
      expires_at TIMESTAMP NOT NULL,
      -- 会话创建时间
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      -- 最后活动时间（用于排序与展示）
      last_active_at TIMESTAMP,
      -- 撤销时间（非空表示已撤销）
      revoked_at TIMESTAMP,
      -- 外键关联，用户删除时级联删除会话
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- 为常用查询字段添加索引
    CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_last_active_at ON sessions(last_active_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON sessions(revoked_at);
  `;
}

/**
 * 生成 articles 表创建 SQL
 * 存储文章元数据与最新版本信息
 */
export async function ArticlesTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      author_email TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft','published')),
      tags TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      current_blob_path TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      line_count INTEGER NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      published_at TIMESTAMP,
      soft_deleted_at TIMESTAMP,
      FOREIGN KEY (author_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_email);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_soft_deleted ON articles(soft_deleted_at);
  `;
}

/**
 * 角色申请表（自助升级）
 */
export async function RoleRequestsTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS role_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_role TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- pending/approved/rejected
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_by INTEGER,
      reviewed_at TIMESTAMP,
      remark TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_role_requests_user ON role_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_role_requests_status ON role_requests(status);
    CREATE INDEX IF NOT EXISTS idx_role_requests_created ON role_requests(created_at DESC);
  `;
}

/**
 * 审计日志表（角色变更、启用禁用等）
 */
export async function AuditLogsTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      target_user_id INTEGER,
      action TEXT NOT NULL, -- role_change / disable / enable
      before_role TEXT,
      after_role TEXT,
      before_status TEXT,
      after_status TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
  `;
}

/**
 * 生成 app_config 表创建 SQL
 * 存储应用程序配置项，支持动态配置和参数调整
 */
export async function AppConfigTable(): Promise<string> {
  return `
    CREATE TABLE IF NOT EXISTS app_config (
      -- 自增主键ID
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- 配置项键名，必须唯一
      key TEXT NOT NULL UNIQUE,
      -- 配置项值
      value TEXT NOT NULL,
      -- 配置项描述（可选）
      description TEXT,
      -- 配置项更新时间
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      -- 最后更新该配置的用户ID
      updated_by_id INTEGER,
      -- 外键关联，用户删除时设为空
      FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    -- 为常用查询字段添加索引
    CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);
  `;
}

/**
 * 通用的表创建确保函数
 * @param tableCreationFunction 返回表创建SQL的函数
 */
export async function ensureTable(tableCreationFunction: () => Promise<string>): Promise<void> {
  const client = await getLibsqlClient();
  const sql = await tableCreationFunction();
  
  // 将SQL按分号分割并分别执行，避免SQL_MANY_STATEMENTS错误
  const statements = sql.split(';').filter(statement => statement.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await client.execute(statement.trim());
      } catch (error) {
        console.error(`执行SQL语句失败: ${statement.substring(0, 50)}...`, error);
        throw error; // 重新抛出错误以便上层捕获
      }
    }
  }
}

/**
 * 确保 users 表存在
 */
export async function ensureUsersTable(): Promise<void> {
  await ensureTable(UsersTable);
}

/**
 * 确保 user_logs 表存在
 */
export async function ensureUserLogsTable(): Promise<void> {
  await ensureTable(UserLogsTable);
}

/**
 * 确保 email_verifications 表存在
 */
export async function ensureEmailVerificationTable(): Promise<void> {
  await ensureTable(EmailVerificationTable);
}

/**
 * 确保 sessions 表存在
 */
export async function ensureSessionsTable(): Promise<void> {
  await ensureTable(SessionsTable);
}

/**
 * 确保 app_config 表存在
 */
export async function ensureAppConfigTable(): Promise<void> {
  await ensureTable(AppConfigTable);
}

/**
 * 确保 articles 表存在
 */
export async function ensureArticlesTable(): Promise<void> {
  await ensureTable(ArticlesTable);
}

export async function ensureRoleRequestsTable(): Promise<void> {
  await ensureTable(RoleRequestsTable);
}

export async function ensureAuditLogsTable(): Promise<void> {
  await ensureTable(AuditLogsTable);
}

/**
 * 创建所有表
 */
export async function tableCreate(): Promise<void> {
  console.log('开始创建数据库表...');
  
  // 表创建函数数组，按依赖关系排序
  const tableCreationFunctions = [
    { name: 'users', func: ensureUsersTable },
    { name: 'user_logs', func: ensureUserLogsTable },
    { name: 'email_verifications', func: ensureEmailVerificationTable },
    { name: 'sessions', func: ensureSessionsTable },
    { name: 'app_config', func: ensureAppConfigTable },
    { name: 'articles', func: ensureArticlesTable },
    { name: 'role_requests', func: ensureRoleRequestsTable },
    { name: 'audit_logs', func: ensureAuditLogsTable }
  ];
  
  // 依次执行所有表创建函数
  for (const { name, func } of tableCreationFunctions) {
    console.log(`创建表: ${name}`);
    try {
      await func();
      console.log(`表 ${name} 创建完成`);
    } catch (error) {
      console.error(`创建表 ${name} 时出错:`, error);
      // 继续尝试创建其他表
    }
  }
  
  console.log('所有数据库表创建操作完成');
}
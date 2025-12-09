"use server";

import { createClient } from "@libsql/client";
import { getDatabaseConfig } from "@/lib/edge-config";
import type { Client } from "@libsql/client";

/**
 * 获取数据库客户端
 * @returns Promise<Client> LibSQL 数据库客户端实例
 */
export async function getLibsqlClient(): Promise<Client> {
  const { url, authToken } = await getDatabaseConfig();
  
  if (!url) {
    throw new Error("未配置数据库 URL，无法连接数据库");
  }

  return authToken ? createClient({ url, authToken }) : createClient({ url });
}


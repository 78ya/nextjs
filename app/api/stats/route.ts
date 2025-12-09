"use server";

import { getLibsqlClient } from "@/lib/db/client";
import { ensureUsersTable } from "@/lib/db/schema";
import { getUserSession } from "@/lib/cookies";

/**
 * 获取系统统计信息
 * GET /api/stats
 * 返回用户数量等统计信息
 */
export async function GET() {
  try {
    // 检查登录状态
    const email = await getUserSession();
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "未登录",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const client = await getLibsqlClient();
    await ensureUsersTable();
    
    // 检查表结构，确保有必要的列
    let tableStructureError: string | null = null;
    try {
      const schemaCheck = await client.execute({
        sql: "PRAGMA table_info(users)",
      });
      const columns = schemaCheck.rows.map((row: any) => row.name);
      
      console.log("当前 users 表的列:", columns);
      
      const missingColumns: string[] = [];
      if (!columns.includes('id')) {
        missingColumns.push('id');
      }
      if (!columns.includes('role')) {
        missingColumns.push('role');
      }
      
      if (missingColumns.length > 0) {
        tableStructureError = `表结构不完整，缺少以下列: ${missingColumns.join(', ')}`;
        console.error("数据库表结构检查失败:", {
          existingColumns: columns,
          missingColumns,
          timestamp: new Date().toISOString(),
        });
        
        return new Response(
          JSON.stringify({
            success: false,
            message: "数据库表结构不完整",
            error: tableStructureError,
            details: {
              existingColumns: columns,
              missingColumns,
            },
            hint: "请访问 /api/init-tables?force=true 强制重建数据库表（注意：这会删除所有数据）",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("检查表结构失败:", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "检查数据库表结构失败",
          error: errorMessage,
          hint: "请检查数据库连接是否正常，或访问 /api/init-tables?force=true 重新初始化数据库",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 获取用户总数
    const userCountResult = await client.execute({
      sql: "SELECT COUNT(*) as total FROM users",
    });
    const totalUsers = (userCountResult.rows[0] as any)?.total || 0;

    // 获取最近注册的用户数（最多100个）
    const recentUsers = Math.min(100, totalUsers);

    // 获取按角色分组的用户数
    let roleStats: Record<string, number> = {};
    try {
      const roleStatsResult = await client.execute({
        sql: "SELECT role, COUNT(*) as count FROM users GROUP BY role",
      });
      roleStats = roleStatsResult.rows.reduce((acc: Record<string, number>, row: any) => {
        acc[row.role || "user"] = row.count;
        return acc;
      }, {});
    } catch (error) {
      // 如果查询失败，记录详细错误并返回
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.code;
      
      console.error("获取角色统计失败:", {
        error: errorMessage,
        code: errorCode,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      
      // 如果是列不存在的错误，返回明确的提示
      if (errorMessage.includes('no such column: role')) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "数据库表结构不完整",
            error: "users 表缺少 'role' 列",
            details: {
              sqlError: errorMessage,
              errorCode,
            },
            hint: "请访问 /api/init-tables?force=true 强制重建数据库表（注意：这会删除所有数据）",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      // 其他错误，也返回详细信息
      return new Response(
        JSON.stringify({
          success: false,
          message: "获取角色统计失败",
          error: errorMessage,
          details: {
            errorCode,
            sqlQuery: "SELECT role, COUNT(*) as count FROM users GROUP BY role",
          },
          hint: "请检查数据库连接和表结构",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users: {
            total: totalUsers,
            recent: recentUsers,
            byRole: roleStats,
          },
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 详细记录错误信息到日志
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDetails = {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code,
      cause: (error as any)?.cause,
    };
    
    console.error("获取统计信息失败:", {
      error: errorDetails,
      timestamp: new Date().toISOString(),
    });
    
    // 返回详细的错误信息给前端
    return new Response(
      JSON.stringify({
        success: false,
        message: "获取统计信息失败",
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        hint: "请检查数据库表结构是否完整，或访问 /api/init-tables?force=true 重新初始化数据库",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}


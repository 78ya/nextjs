import { getLibsqlClient } from "@/lib/db/client";
import { ensureUsersTable } from "@/lib/db/schema";
import { getUserSession } from "@/lib/cookies";

/**
 * 获取用户列表
 * GET /api/users
 * 查询参数：
 *   - page: 页码（默认 1）
 *   - limit: 每页数量（默认 10，最大 100）
 *   - search: 搜索关键词（可选，搜索邮箱或昵称）
 */
export async function GET(request: Request) {
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
    
    // 检查表结构，确保有 id 列
    try {
      const schemaCheck = await client.execute({
        sql: "PRAGMA table_info(users)",
      });
      const columns = schemaCheck.rows.map((row: any) => row.name);
      
      if (!columns.includes('id')) {
        // 表结构不完整，返回错误提示
        return new Response(
          JSON.stringify({
            success: false,
            message: "数据库表结构不完整，请重新初始化数据库表",
            hint: "请访问 /api/init-tables 初始化数据库",
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
      console.error("检查表结构失败:", error);
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    let sql = "SELECT id, email, name, role, avatar FROM users";
    let countSql = "SELECT COUNT(*) as total FROM users";
    const args: any[] = [];

    // 如果有搜索关键词，添加 WHERE 条件
    if (search) {
      sql += " WHERE email LIKE ? OR name LIKE ?";
      countSql += " WHERE email LIKE ? OR name LIKE ?";
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern);
    }

    // 添加排序和分页
    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    args.push(limit, offset);

    // 执行查询
    const [usersResult, countResult] = await Promise.all([
      client.execute({ sql, args }),
      client.execute({ sql: countSql, args: args.slice(0, -2) }), // 移除 LIMIT 和 OFFSET 参数
    ]);

    const total = (countResult.rows[0] as any)?.total || 0;
    const users = usersResult.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      avatar: row.avatar,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
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
    console.error("获取用户列表失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "获取用户列表失败",
        error: error instanceof Error ? error.message : String(error),
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


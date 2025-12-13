import { getLibsqlClient } from "@/lib/db/client";

/**
 * 健康检查接口
 * GET /api/health
 * 检查数据库连接和应用状态
 */
export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "unhealthy";
    timestamp: string;
    uptime: number;
    database: {
      status: "connected" | "disconnected" | "error";
      responseTime?: number;
      error?: string;
    };
    version?: string;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: "disconnected",
    },
  };

  try {
    // 检查数据库连接
    const dbStartTime = Date.now();
    const client = await getLibsqlClient();
    
    // 执行简单查询测试连接
    await client.execute("SELECT 1");
    
    const dbResponseTime = Date.now() - dbStartTime;
    health.database = {
      status: "connected",
      responseTime: dbResponseTime,
    };
  } catch (error) {
    health.status = "unhealthy";
    health.database = {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const responseTime = Date.now() - startTime;

  return new Response(
    JSON.stringify({
      ...health,
      responseTime,
    }),
    {
      status: health.status === "healthy" ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "X-Response-Time": `${responseTime}ms`,
      },
    }
  );
}


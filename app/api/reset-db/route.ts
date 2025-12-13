import { tableInDelete } from '@/lib/db/delete';

/**
 * 数据库重置接口
 * 此接口仅在开发环境可用，用于清空所有数据库表数据
 * 注意：此操作不可逆，请谨慎使用
 */
export async function POST(request: Request) {
  try {
    // 环境判断 - 仅在开发环境允许执行
    if (process.env.NODE_ENV !== 'development') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '此接口仅在开发环境可用',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 获取请求体，可选添加密码验证等额外安全措施
    const body = await request.json().catch(() => ({}));
    
    // 执行数据库清空操作
    await tableInDelete();

    return new Response(
      JSON.stringify({
        success: true,
        message: '数据库表数据已成功清空',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('重置数据库时出错:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '重置数据库失败',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// 允许GET请求访问此接口
export async function GET() {
  try {
    // 环境判断 - 仅在开发环境允许执行
    if (process.env.NODE_ENV !== 'development') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '此接口仅在开发环境可用',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 执行数据库清空操作
    await tableInDelete();

    return new Response(
      JSON.stringify({
        success: true,
        message: '数据库表数据已成功清空',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('重置数据库时出错:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '重置数据库失败',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
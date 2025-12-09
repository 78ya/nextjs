"use server";

import { tableCreate } from '@/lib/db/schema';

/**
 * 数据库表初始化接口
 * 此接口仅在开发环境可用，用于创建所有必要的数据库表
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

    // 执行数据库表创建操作
    await tableCreate();

    return new Response(
      JSON.stringify({
        success: true,
        message: '数据库表初始化成功',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('初始化数据库表时出错:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '初始化数据库表失败',
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

    // 执行数据库表创建操作
    await tableCreate();

    return new Response(
      JSON.stringify({
        success: true,
        message: '数据库表初始化成功',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('初始化数据库表时出错:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '初始化数据库表失败',
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
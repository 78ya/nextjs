"use server";

import { tableCreate } from '@/lib/db/schema';
import { recreateAllTables } from '@/lib/db/recreate';

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

    // 检查是否有 force 参数，如果有则强制重建表
    const body = await request.json().catch(() => ({}));
    const force = body.force === true || body.force === 'true';
    
    if (force) {
      // 强制重建所有表（会删除所有数据）
      await recreateAllTables();
    } else {
      // 执行数据库表创建操作（如果表已存在则不会更新）
      await tableCreate();
    }

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
export async function GET(request: Request) {
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

    // 检查是否有 force 查询参数
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    if (force) {
      // 强制重建所有表（会删除所有数据）
      await recreateAllTables();
    } else {
      // 执行数据库表创建操作（如果表已存在则不会更新）
      await tableCreate();
    }

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
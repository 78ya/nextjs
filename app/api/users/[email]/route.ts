import { getUserSession } from "@/lib/cookies";
import { getUserByEmail, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

/**
 * 获取指定用户信息
 * GET /api/users/[email]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    // 检查登录状态
    const currentUserEmail = await getUserSession();
    if (!currentUserEmail) {
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

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    // 获取用户信息
    const user = await getUserByEmail(decodedEmail);
    
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "用户不存在",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 返回用户信息（不包含密码）
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          email: user.email,
          name: user.name,
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
    console.error("获取用户信息失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "获取用户信息失败",
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

/**
 * 更新用户信息
 * PATCH /api/users/[email]
 * 请求体: { name?: string, password?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    // 检查登录状态
    const currentUserEmail = await getUserSession();
    if (!currentUserEmail) {
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

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    // 只能更新自己的信息
    if (currentUserEmail !== decodedEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "无权修改其他用户信息",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 解析请求体
    const body = await request.json().catch(() => ({}));
    const updates: { name?: string; password?: string } = {};

    if (body.name !== undefined) {
      updates.name = String(body.name).trim();
    }

    if (body.password !== undefined) {
      const password = String(body.password);
      if (password.length < 6) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "密码长度不能少于 6 位",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      // 对密码进行哈希处理
      updates.password = hashPassword(password);
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "没有要更新的字段",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 更新用户信息
    await updateUser(decodedEmail, updates);

    return new Response(
      JSON.stringify({
        success: true,
        message: "用户信息更新成功",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "更新用户信息失败",
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


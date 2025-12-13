import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";

/**
 * 获取当前登录用户信息
 * GET /api/users/me
 */
export async function GET() {
  try {
    // 获取当前登录用户的邮箱
    const email = await getUserSession();
    
    if (!email) {
      console.info("[api/users/me] no session, redirect to 401");
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

    // 获取用户信息
    console.info("[api/users/me] fetching user", { email });
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.warn("[api/users/me] user not found", { email });
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

    console.info("[api/users/me] user found", {
      email: user.email,
      hasAvatar: !!user.avatar,
      name: user.name,
    });

    // 返回用户信息（不包含密码）
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          email: user.email,
          name: user.name,
          avatar: user.avatar ?? null,
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


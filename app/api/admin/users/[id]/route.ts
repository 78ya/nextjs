import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import {
  getUserByEmail,
  getUserById,
  updateUserRoleStatusById,
  logAudit,
} from "@/lib/db";

const ADMIN_ROLES = ["admin", "superadmin"];

async function getActor() {
  const email = await getUserSession();
  if (!email) return { email: null, role: null, status: null, isAdmin: false };
  const user = await getUserByEmail(email);
  const role = user?.role || null;
  return {
    email,
    role,
    status: user?.status ?? null,
    isAdmin: ADMIN_ROLES.includes(role || ""),
    id: (user as any)?.id ?? null,
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActor();
    if (!actor.isAdmin) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    if (actor.status === "disabled") {
      return NextResponse.json({ message: "账号已禁用" }, { status: 403 });
    }

    const { id } = await context.params;
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) {
      return NextResponse.json({ message: "无效的用户 ID" }, { status: 400 });
    }

    const body = await req.json();
    const nextRole = body.role as string | undefined;
    const nextStatus = body.status as string | undefined;

    if (!nextRole && !nextStatus) {
      return NextResponse.json({ message: "缺少更新字段" }, { status: 400 });
    }

    const target = await getUserById(targetId);
    if (!target) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    // 权限规则
    if (target.role === "superadmin" && actor.role !== "superadmin") {
      return NextResponse.json({ message: "无权修改超级管理员" }, { status: 403 });
    }
    if (nextRole === "superadmin" && actor.role !== "superadmin") {
      return NextResponse.json({ message: "无权提升为超级管理员" }, { status: 403 });
    }

    const allowedRoles = ["editor", "admin", "superadmin"];
    if (nextRole && !allowedRoles.includes(nextRole)) {
      return NextResponse.json({ message: "无效角色" }, { status: 400 });
    }

    const allowedStatus = ["active", "disabled"];
    if (nextStatus && !allowedStatus.includes(nextStatus)) {
      return NextResponse.json({ message: "无效状态" }, { status: 400 });
    }

    const beforeRole = target.role;
    const beforeStatus = target.status;

    await updateUserRoleStatusById(targetId, {
      role: nextRole,
      status: nextStatus,
    });

    await logAudit({
      actorId: actor.id ?? null,
      targetUserId: targetId,
      action: "role_or_status_change",
      beforeRole,
      afterRole: nextRole ?? beforeRole,
      beforeStatus,
      afterStatus: nextStatus ?? beforeStatus,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      userAgent: req.headers.get("user-agent") || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/admin/users/:id] PATCH failed", error);
    return NextResponse.json({ message: error?.message || "更新失败" }, { status: 500 });
  }
}


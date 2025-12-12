'use server';

import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import {
  getUserByEmail,
  listUsersAdmin,
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
  };
}

export async function GET(req: NextRequest) {
  try {
    const { isAdmin, status } = await getActor();
    if (!isAdmin) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }
    if (status === "disabled") {
      return NextResponse.json({ message: "账号已禁用" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const limit = Number(searchParams.get("limit") ?? 20);
    const offset = Number(searchParams.get("offset") ?? 0);

    const { items, total } = await listUsersAdmin({
      search,
      role,
      status: statusFilter,
      limit,
      offset,
    });

    return NextResponse.json({
      items,
      total,
      nextOffset: offset + items.length,
      hasMore: offset + items.length < total,
    });
  } catch (error: any) {
    console.error("[api/admin/users] GET failed", error);
    return NextResponse.json({ message: error?.message || "获取失败" }, { status: 500 });
  }
}


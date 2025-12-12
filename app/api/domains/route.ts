import { NextResponse } from "next/server";
import { createDomain, listDomains } from "@/lib/db/domains";
import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

function ensureRole(role?: string | null) {
  // 简单权限：admin/superadmin 可写，其他仅查看
  if (!role) return { canWrite: false };
  const canWrite = role === "admin" || role === "superadmin";
  return { canWrite };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";
  const providerType = (searchParams.get("provider") as any) || "all";
  const limit = Math.min(50, Number(searchParams.get("limit") || 10));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));
  const email = await getUserSession();
  const user = email ? await getUserByEmail(email) : null;
  if (!email) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }
  const { canWrite } = ensureRole(user?.role);

  try {
    const { items, total } = await listDomains({
      keyword: keyword.trim() || undefined,
      providerType,
      limit,
      offset,
    });
    return NextResponse.json({
      ok: true,
      items,
      total,
      nextOffset: offset + items.length,
      hasMore: offset + items.length < total,
      canWrite,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "获取域名失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const email = await getUserSession();
  if (!email) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }
  const user = await getUserByEmail(email);
  const { canWrite } = ensureRole(user?.role);
  if (!canWrite) {
    return NextResponse.json({ ok: false, message: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const providerType = String(body?.providerType || "").trim();
  const token = String(body?.token || "").trim();

  if (!name || !providerType || !token) {
    return NextResponse.json({ ok: false, message: "缺少参数" }, { status: 400 });
  }

  try {
    const created = await createDomain({
      name,
      providerType: providerType as any,
      token,
      createdBy: email,
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "创建失败" },
      { status: 500 }
    );
  }
}


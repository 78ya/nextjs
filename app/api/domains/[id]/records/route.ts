import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";
import { getDomainById } from "@/lib/db/domains";
import { getProviderAdapter, type DnsRecordType } from "@/lib/domains/adapters";

export const dynamic = "force-dynamic";

function ensureRole(role?: string | null) {
  const canWrite = role === "admin" || role === "superadmin";
  return { canWrite };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const email = await getUserSession();
  if (!email) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const { id } = await context.params;
  const domainId = Number(id);
  if (!Number.isFinite(domainId)) return NextResponse.json({ ok: false, message: "参数错误" }, { status: 400 });

  const domain = await getDomainById(domainId);
  if (!domain) return NextResponse.json({ ok: false, message: "域名不存在" }, { status: 404 });

  try {
    const adapter = await getProviderAdapter(domain.provider_type as any);
    const items = await adapter.listRecords(domain.name, domain.token);
    return NextResponse.json({ ok: true, items, total: items.length, hasMore: false });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "获取记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const email = await getUserSession();
  if (!email) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const user = await getUserByEmail(email);
  const { canWrite } = ensureRole(user?.role);
  if (!canWrite) return NextResponse.json({ ok: false, message: "无权限" }, { status: 403 });

  const { id } = await context.params;
  const domainId = Number(id);
  if (!Number.isFinite(domainId)) return NextResponse.json({ ok: false, message: "参数错误" }, { status: 400 });
  const domain = await getDomainById(domainId);
  if (!domain) return NextResponse.json({ ok: false, message: "域名不存在" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const record = {
    type: body?.type as DnsRecordType,
    name: String(body?.name || "").trim(),
    content: String(body?.content || "").trim(),
    ttl: Number(body?.ttl || 300),
    priority: body?.priority ?? null,
    proxied: body?.proxied ?? null,
  };
  if (!record.type || !record.name || !record.content) {
    return NextResponse.json({ ok: false, message: "缺少必填字段" }, { status: 400 });
  }

  try {
    const adapter = await getProviderAdapter(domain.provider_type as any);
    const created = await adapter.createRecord(domain.name, domain.token, {
      id: "",
      ...record,
    } as any);
    return NextResponse.json({ ok: true, item: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "创建失败" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const email = await getUserSession();
  if (!email) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const user = await getUserByEmail(email);
  const { canWrite } = ensureRole(user?.role);
  if (!canWrite) return NextResponse.json({ ok: false, message: "无权限" }, { status: 403 });

  const { id } = await context.params;
  const domainId = Number(id);
  const body = await req.json().catch(() => null);
  const recordId = String(body?.id || "").trim();
  if (!Number.isFinite(domainId) || !recordId) {
    return NextResponse.json({ ok: false, message: "参数错误" }, { status: 400 });
  }
  const domain = await getDomainById(domainId);
  if (!domain) return NextResponse.json({ ok: false, message: "域名不存在" }, { status: 404 });

  try {
    const adapter = await getProviderAdapter(domain.provider_type as any);
    const updated = await adapter.updateRecord(domain.name, domain.token, recordId, {
      type: body?.type,
      name: body?.name,
      content: body?.content,
      ttl: body?.ttl,
      priority: body?.priority,
      proxied: body?.proxied,
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const email = await getUserSession();
  if (!email) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const user = await getUserByEmail(email);
  const { canWrite } = ensureRole(user?.role);
  if (!canWrite) return NextResponse.json({ ok: false, message: "无权限" }, { status: 403 });

  const { id } = await context.params;
  const domainId = Number(id);
  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get("recordId") || "";
  if (!Number.isFinite(domainId) || !recordId) {
    return NextResponse.json({ ok: false, message: "参数错误" }, { status: 400 });
  }
  const domain = await getDomainById(domainId);
  if (!domain) return NextResponse.json({ ok: false, message: "域名不存在" }, { status: 404 });

  try {
    const adapter = await getProviderAdapter(domain.provider_type as any);
    await adapter.deleteRecord(domain.name, domain.token, recordId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "删除失败" },
      { status: 500 }
    );
  }
}


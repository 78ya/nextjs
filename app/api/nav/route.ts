import { listNavItems, seedNavItemsIfEmpty } from "@/lib/db/nav";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedNavItemsIfEmpty();
    const items = await listNavItems();
    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    console.error("[api/nav] failed", error);
    return NextResponse.json(
      { ok: false, message: error?.message || "获取导航失败" },
      { status: 500 }
    );
  }
}


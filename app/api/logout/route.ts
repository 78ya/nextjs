'use server';

import { NextResponse } from "next/server";
import { deleteUserSession } from "@/lib/cookies";

export async function POST() {
  try {
    await deleteUserSession();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/logout] POST failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "退出失败" }, { status: 500 });
  }
}


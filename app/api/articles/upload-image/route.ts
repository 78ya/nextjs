import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/cookies";
import { getUserByEmail } from "@/lib/db";
import { uploadImage } from "@/lib/image-host";

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(req: NextRequest) {
  try {
    const email = await getUserSession();
    if (!email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: "未找到用户" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "仅支持 multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const articleId = formData.get("articleId");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "请上传图片文件" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ message: "图片大小超出 50MB 限制" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: "仅支持常见图片格式" }, { status: 400 });
    }

    const filename = `images/${articleId ?? "general"}/${Date.now()}-${file.name}`;

    const uploaded = await uploadImage({
      file,
      filename,
    });

    return NextResponse.json({ ok: true, ...uploaded });
  } catch (error: any) {
    console.error("[api/articles/upload-image] POST failed", error);
    return NextResponse.json({ ok: false, message: error?.message || "上传失败" }, { status: 400 });
  }
}


import { NextResponse } from "next/server";
import { uploadToBlob } from "@/lib/blob-storage";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "仅开发环境可用 /api/blob/upload" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    console.error("[api/blob/upload] parse form error", error);
    return NextResponse.json({ success: false, error: "无法解析表单" }, { status: 400 });
  }

  const file = formData.get("file");
  const filename = (formData.get("filename") as string) || (file as File | null)?.name || undefined;
  const accessRaw = (formData.get("access") as string) || "public";
  const access = accessRaw === "private" ? "private" : "public";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ success: false, error: "请提供 file 文件字段" }, { status: 400 });
  }

  const contentType = (file as File).type || undefined;

  try {
    const result = await uploadToBlob({ file, filename, access, contentType });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[api/blob/upload] upload error", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}


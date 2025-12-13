import { uploadImage } from "@/lib/image-host";

/**
 * 图片上传开发接口
 * POST /api/images/upload
 * form-data:
 *   - file: File (必填)
 *   - strategy_id: number (可选)
 */
export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new Response(
        JSON.stringify({ success: false, message: "该接口仅限开发环境使用" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.info("[api/images/upload] incoming request");
    const form = await request.formData();
    const file = form.get("file");
    const strategyRaw = form.get("strategy_id");

    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ success: false, message: "缺少文件字段 file" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const strategyId =
      strategyRaw !== null && strategyRaw !== undefined && strategyRaw !== ""
        ? Number(strategyRaw)
        : undefined;

    if (strategyId !== undefined && Number.isNaN(strategyId)) {
      return new Response(
        JSON.stringify({ success: false, message: "strategy_id 需为数字" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fileName = (file as File).name;

    console.info("[api/images/upload] parsed fields", {
      fileName,
      strategyId,
      hasFile: true,
    });

    const result = await uploadImage({
      file: file as File,
      strategyId,
      filename: fileName,
    });

    console.info("[api/images/upload] upload success", {
      key: result.key,
      url: result.url,
      thumbnail: result.thumbnail_url,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("图片上传失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "图片上传失败",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


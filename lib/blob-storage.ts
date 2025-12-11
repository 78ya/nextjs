'use server';

import { del, list, put } from "@vercel/blob";

type UploadInput = Blob | File | Buffer | Uint8Array | ArrayBuffer;

export type BlobAccess = "public" | "private";

export interface BlobUploadResult {
  url: string;
  pathname: string;
  downloadUrl?: string;
  contentType?: string;
  size?: number;
}

function ensureBlobToken(): string {
  // 支持两种环境变量：优先 nextjs_READ_WRITE_TOKEN，其次 BLOB_READ_WRITE_TOKEN
  const token = process.env.nextjs_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("nextjs_READ_WRITE_TOKEN 未配置（可选 fallback: BLOB_READ_WRITE_TOKEN），无法上传到 Vercel Blob");
  }
  return token;
}

function inputToBlob(input: UploadInput, contentType?: string): Blob {
  if (input instanceof Blob) return input;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    const view = new Uint8Array(input.buffer as ArrayBuffer, input.byteOffset, input.byteLength);
    const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    return new Blob([buffer], { type: contentType });
  }
  if (input instanceof Uint8Array) {
    const buffer = (input.buffer as ArrayBuffer).slice(input.byteOffset, input.byteOffset + input.byteLength);
    return new Blob([buffer], { type: contentType });
  }
  if (input instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(input)], { type: contentType });
  }
  throw new Error("不支持的文件类型，期望 Blob/File/Buffer/Uint8Array/ArrayBuffer");
}

export async function uploadToBlob(params: {
  file: UploadInput;
  filename?: string;
  access?: BlobAccess;
  contentType?: string;
}): Promise<BlobUploadResult> {
  const token = ensureBlobToken();
  const blob = inputToBlob(params.file, params.contentType);
  const name = params.filename || (params.file as any)?.name || "upload.bin";
  const access: BlobAccess = params.access === "private" ? "private" : "public";
  const contentType = params.contentType || (blob as any)?.type;

  const result = await put(name, blob, {
    // @vercel/blob typings currently only accept "public"; keep runtime value for private via cast
    access: access as any,
    token,
    contentType,
    allowOverwrite: true,
  });

  return {
    url: result.url,
    pathname: result.pathname,
    downloadUrl: (result as any).downloadUrl ?? result.url,
    contentType: (result as any).contentType,
    size: (result as any).size,
  };
}

export async function listBlobs(prefix?: string) {
  const token = ensureBlobToken();
  const res = await list({ token, prefix });
  return res.blobs;
}

export async function deleteBlob(pathname: string) {
  if (!pathname) throw new Error("删除文件需要提供 pathname");
  const token = ensureBlobToken();
  await del(pathname, { token });
  return true;
}


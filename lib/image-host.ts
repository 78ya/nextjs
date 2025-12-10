'use server';

import { getEdgeConfig } from "./edge-config";

type UploadFileInput = Blob | File | Buffer | Uint8Array | ArrayBuffer;

export interface ImageHostConfig {
  baseUrl: string;
  email: string;
  password: string;
}

export interface ImageUploadData {
  key: string;
  url: string;
  thumbnail_url?: string;
  name?: string;
  origin_name?: string;
  pathname?: string;
  size?: number; // KB
  mimetype?: string;
  extension?: string;
  md5?: string;
  sha1?: string;
  width?: number;
  height?: number;
  links?: {
    url?: string;
    html?: string;
    bbcode?: string;
    markdown?: string;
    markdown_with_link?: string;
    thumbnail_url?: string;
  };
}

export interface ImageListItem {
  key: string;
  name?: string;
  origin_name?: string;
  pathname?: string;
  size?: number; // KB
  width?: number;
  height?: number;
  md5?: string;
  sha1?: string;
  human_date?: string;
  date?: string;
  links?: Record<string, string>;
}

export interface ImageListResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: ImageListItem[];
}

let cachedToken: string | null = null;

function isNodeBuffer(input: UploadFileInput): input is Buffer {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(input);
}

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = trimTrailingSlash(baseUrl);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}/${normalizedPath}`;
}

async function getImageHostConfig(): Promise<ImageHostConfig> {
  const cfg = await getEdgeConfig<{ baseUrl?: string; email?: string; password?: string }>("/image_host");

  if (!cfg?.baseUrl || !cfg?.email || !cfg?.password) {
    throw new Error("image_host 配置缺失，请在 Edge Config 中设置 baseUrl/email/password");
  }

  return {
    baseUrl: cfg.baseUrl,
    email: cfg.email,
    password: cfg.password,
  };
}

async function getImageHostToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken) {
    return cachedToken;
  }

  const { baseUrl, email, password } = await getImageHostConfig();
  const res = await fetch(buildUrl(baseUrl, "/tokens"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`获取图床 token 失败: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { status?: boolean; token?: string; data?: { token?: string }; message?: string };
  const token = data.token || data.data?.token;

  if (!token) {
    throw new Error(`获取图床 token 返回异常: ${data.message || "无 token 字段"}`);
  }

  cachedToken = token;
  return token;
}

function toBlob(input: UploadFileInput): Blob {
  if (input instanceof Blob) return input;
  if (isNodeBuffer(input)) {
    // Buffer 不直接满足 BlobPart 类型，转为 Uint8Array，并确保使用 ArrayBuffer
    const view = new Uint8Array(input.buffer as ArrayBuffer, input.byteOffset, input.byteLength);
    const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    return new Blob([buffer]);
  }
  if (input instanceof Uint8Array) {
    const buffer = (input.buffer as ArrayBuffer).slice(input.byteOffset, input.byteOffset + input.byteLength);
    return new Blob([buffer]);
  }
  if (input instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(input)]);
  }
  throw new Error("不支持的文件类型");
}

export async function uploadImage(params: {
  file: UploadFileInput;
  strategyId?: number;
  filename?: string;
}): Promise<ImageUploadData> {
  const { baseUrl } = await getImageHostConfig();
  const token = await getImageHostToken();
  const form = new FormData();
  const fileBlob = toBlob(params.file);
  form.append("file", fileBlob, params.filename || "upload.bin");
  if (params.strategyId !== undefined) {
    form.append("strategy_id", String(params.strategyId));
  }

  const res = await fetch(buildUrl(baseUrl, "/upload"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (res.status === 401) {
    // token 失效，尝试刷新一次
    const newToken = await getImageHostToken(true);
    const retry = await fetch(buildUrl(baseUrl, "/upload"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
      body: form,
    });
    return handleUploadResponse(retry);
  }

  return handleUploadResponse(res);
}

function handleUploadResponse(res: Response): Promise<ImageUploadData> {
  if (!res.ok) {
    throw new Error(`上传失败: ${res.status} ${res.statusText}`);
  }

  return res.json().then((json) => {
    const payload = json as { status?: boolean; data?: any; message?: string };
    if (!payload.status || !payload.data) {
      throw new Error(`上传返回异常: ${payload.message || "无 data 字段"}`);
    }
    const data = payload.data as ImageUploadData;
    const url =
      data.url ||
      data.links?.url ||
      data.links?.markdown_with_link ||
      data.links?.markdown ||
      data.links?.html ||
      data.links?.bbcode ||
      data.pathname ||
      "";
    const thumbnail = data.thumbnail_url || data.links?.thumbnail_url;

    if (!url) {
      console.warn("[image-host] upload response missing url", payload);
    }

    return {
      ...data,
      url,
      thumbnail_url: thumbnail,
    };
  });
}

export async function listImages(params: {
  page?: number;
  order?: "newest" | "earliest" | "utmost" | "least";
  permission?: "public" | "private";
  album_id?: number;
  keyword?: string;
} = {}): Promise<ImageListResponse> {
  const { baseUrl } = await getImageHostConfig();
  const token = await getImageHostToken();

  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.order) searchParams.set("order", params.order);
  if (params.permission) searchParams.set("permission", params.permission);
  if (params.album_id !== undefined) searchParams.set("album_id", String(params.album_id));
  if (params.keyword) searchParams.set("keyword", params.keyword);

  const res = await fetch(buildUrl(baseUrl, `/images?${searchParams.toString()}`), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`获取图片列表失败: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status?: boolean; data?: ImageListResponse; message?: string };
  if (!json.status || !json.data) {
    throw new Error(`获取图片列表返回异常: ${json.message || "无 data 字段"}`);
  }

  return json.data;
}

export async function deleteImage(key: string): Promise<boolean> {
  if (!key) throw new Error("删除图片需要提供 key");

  const { baseUrl } = await getImageHostConfig();
  const token = await getImageHostToken();

  const res = await fetch(buildUrl(baseUrl, `/images/${encodeURIComponent(key)}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`删除图片失败: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status?: boolean; message?: string };
  if (!json.status) {
    throw new Error(`删除图片返回异常: ${json.message || "status=false"}`);
  }

  return true;
}

export async function getProfile(): Promise<{
  name?: string;
  avatar?: string;
  email?: string;
  capacity?: number;
  used_capacity?: number;
  url?: string;
  image_num?: number;
  album_num?: number;
  registered_ip?: string;
}> {
  const { baseUrl } = await getImageHostConfig();
  const token = await getImageHostToken();

  const res = await fetch(buildUrl(baseUrl, "/profile"), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`获取资料失败: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status?: boolean; data?: Record<string, unknown>; message?: string };
  if (!json.status || !json.data) {
    throw new Error(`获取资料返回异常: ${json.message || "无 data 字段"}`);
  }

  return json.data as Record<string, unknown> as ReturnType<typeof getProfile> extends Promise<infer R> ? R : never;
}


import type { ProviderType } from "@/lib/db/domains";

export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "SRV"
  | "CAA"
  | "NS";

export interface DnsRecord {
  id: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  priority?: number | null;
  weight?: number | null;
  proxied?: boolean | null;
}

export interface DnsProvider {
  listRecords(domain: string, token: string): Promise<DnsRecord[]>;
  createRecord(domain: string, token: string, payload: DnsRecord): Promise<DnsRecord>;
  updateRecord(domain: string, token: string, recordId: string, payload: Partial<DnsRecord>): Promise<DnsRecord>;
  deleteRecord(domain: string, token: string, recordId: string): Promise<void>;
}

class CloudflareProvider implements DnsProvider {
  private async getZoneId(domain: string, token: string): Promise<string> {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(domain)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || !json?.success || !json?.result?.length) {
      throw new Error(json?.errors?.[0]?.message || "获取 Cloudflare Zone 失败");
    }
    return json.result[0].id;
  }

  async listRecords(domain: string, token: string): Promise<DnsRecord[]> {
    const zoneId = await this.getZoneId(domain, token);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=200`,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.errors?.[0]?.message || "获取记录失败");
    }
    return (json.result || []).map((r: any) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      priority: r.priority ?? null,
      proxied: r.proxied ?? null,
    }));
  }

  async createRecord(domain: string, token: string, payload: DnsRecord): Promise<DnsRecord> {
    const zoneId = await this.getZoneId(domain, token);
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: payload.type,
        name: payload.name,
        content: payload.content,
        ttl: payload.ttl,
        priority: payload.priority ?? undefined,
        proxied: payload.proxied ?? undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.errors?.[0]?.message || "创建失败");
    }
    const r = json.result;
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      priority: r.priority ?? null,
      proxied: r.proxied ?? null,
    };
  }

  async updateRecord(
    domain: string,
    token: string,
    recordId: string,
    payload: Partial<DnsRecord>
  ): Promise<DnsRecord> {
    const zoneId = await this.getZoneId(domain, token);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: payload.type,
          name: payload.name,
          content: payload.content,
          ttl: payload.ttl,
          priority: payload.priority ?? undefined,
          proxied: payload.proxied ?? undefined,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.errors?.[0]?.message || "更新失败");
    }
    const r = json.result;
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      priority: r.priority ?? null,
      proxied: r.proxied ?? null,
    };
  }

  async deleteRecord(domain: string, token: string, recordId: string): Promise<void> {
    const zoneId = await this.getZoneId(domain, token);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || (json && json.success === false)) {
      throw new Error(json?.errors?.[0]?.message || "删除失败");
    }
  }
}

class NotImplementedProvider implements DnsProvider {
  async listRecords(): Promise<DnsRecord[]> {
    throw new Error("该云厂商适配暂未实现");
  }
  async createRecord(): Promise<DnsRecord> {
    throw new Error("该云厂商适配暂未实现");
  }
  async updateRecord(): Promise<DnsRecord> {
    throw new Error("该云厂商适配暂未实现");
  }
  async deleteRecord(): Promise<void> {
    throw new Error("该云厂商适配暂未实现");
  }
}

export const getProviderAdapter = async (type: ProviderType): Promise<DnsProvider> => {
  if (type === "cloudflare") return new CloudflareProvider();
  if (type === "aliyun") return new NotImplementedProvider();
  if (type === "tencent") return new NotImplementedProvider();
  throw new Error("未知云厂商");
};


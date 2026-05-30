import type { Json } from "@/lib/supabase/database.types";

export function parseLeadData(data: Json): Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null) result[key] = String(value);
  }
  return result;
}

export function leadDisplayName(data: Json): string {
  const parsed = parseLeadData(data);
  return parsed.name || parsed.email || parsed.phone || "Lead sem nome";
}

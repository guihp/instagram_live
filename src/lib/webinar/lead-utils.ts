export function parseLeadData(data: unknown): Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value != null) result[key] = String(value);
  }
  return result;
}

export function leadDisplayName(data: unknown): string {
  const parsed = parseLeadData(data);
  return parsed.name || parsed.email || parsed.phone || "Lead sem nome";
}


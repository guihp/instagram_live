const STORAGE_PREFIX = "webinar_lead_";

export interface StoredLead {
  leadId: string;
  webinarId: string;
  sessionId: string;
  data: Record<string, string>;
  registeredAt: string;
}

function storageKey(webinarId: string): string {
  return `${STORAGE_PREFIX}${webinarId}`;
}

export function getStoredLead(webinarId: string): StoredLead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(webinarId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredLead;
  } catch {
    return null;
  }
}

export function saveStoredLead(lead: StoredLead): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(lead.webinarId), JSON.stringify(lead));
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = "webinar_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function openGroupLink(url: string | null | undefined): void {
  const trimmed = url?.trim();
  if (!trimmed) return;
  window.open(trimmed, "_blank", "noopener,noreferrer");
}

/** URL do dashboard Supabase derivada de VITE_SUPABASE_URL (sem IDs hardcoded). */
export function getSupabaseStorageSettingsUrl(supabaseUrl: string | undefined): string {
  if (!supabaseUrl) return "https://supabase.com/dashboard";

  try {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    if (!ref) return "https://supabase.com/dashboard";
    return `https://supabase.com/dashboard/project/${ref}/storage/settings`;
  } catch {
    return "https://supabase.com/dashboard";
  }
}

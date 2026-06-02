/** Lista de migrations — manter alinhada com `supabase/migrations/`. */
export const SETUP_MIGRATIONS = [
  { file: "20260530110000_initial_schema.sql", description: "Tabelas, RLS e buckets de storage" },
  { file: "20260530120000_webinar_videos_bucket_limit.sql", description: "Limite do bucket de vídeos" },
  { file: "20260530130000_webinar_assets_mime_types.sql", description: "Tipos MIME de assets" },
  { file: "20260530140000_landing_footer.sql", description: "Rodapé da landing" },
  { file: "20260530150000_trigger_appear_mode.sql", description: "Modo de aparição dos gatilhos" },
  { file: "20260530160000_webinar_live_messages.sql", description: "Chat ao vivo" },
  { file: "20260530170000_ai_assistant_name.sql", description: "Nome do assistente IA" },
  { file: "20260601100000_webinar_live_enhancements.sql", description: "Sessão do chat, pós-live, público simulado" },
  { file: "20260601110000_chat_moderation.sql", description: "Bloquear chat e palavras proibidas" },
  { file: "20260601120000_landing_templates.sql", description: "Templates de landing" },
  { file: "20260602130000_landing_logo.sql", description: "Logo da landing" },
  { file: "20260603100000_dojo_app_settings.sql", description: "Configuração persistida do /setup" },
] as const;

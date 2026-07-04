# Instagram Live — painel admin + worker RTMP

Painel para agendar e transmitir vídeos pré-gravados para **Instagram Live** via RTMP.

- **Admin (Lovable):** `/admin/instagram-live` — criar transmissões, upload, controle  
- **Worker (externo):** `apps/ig-live-worker` — ffmpeg para o Instagram Live Producer  
- **Backend:** Supabase (Auth, Postgres, Storage)

## Deploy no Lovable

Leia **`LOVABLE.md`** — checklist completo do que configurar (Supabase, secrets, worker).

Secrets obrigatórios no Lovable Cloud:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WORKER_API_SECRET
WORKER_URL          # URL pública do worker (para transmitir)
```

## Desenvolvimento local

```bash
cp .env.example .env   # preencher secrets
npm install
npm run dev            # admin em :5173

npm run worker:ig-live:install
npm run worker:ig-live # worker em :8787 (precisa ffmpeg)
```

Migration: `supabase/migrations/20260704120000_initial_schema.sql`

## Docs

| Arquivo | Conteúdo |
|---------|----------|
| [LOVABLE.md](./LOVABLE.md) | Checklist Lovable + o que falta para rodar |
| [SETUP.md](./SETUP.md) | Setup detalhado |
| [AGENTS.md](./AGENTS.md) | Instruções para agente IA |
| [apps/ig-live-worker/README.md](./apps/ig-live-worker/README.md) | Worker RTMP |

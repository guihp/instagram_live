# LOVABLE.md — deploy e checklist (leia primeiro)

Este app é o **painel admin** de Instagram Live. O **streaming RTMP** roda em um **worker separado** (`apps/ig-live-worker`) — o Lovable **não** executa ffmpeg.

## O que roda onde

| Parte | Onde hospeda | O que faz |
|-------|----------------|-----------|
| **Admin UI** | Lovable (este repo) | Login, CRUD, upload de vídeo, controle arm/start/stop |
| **Banco + Storage** | Supabase (seu projeto) | `ig_broadcasts`, bucket `ig-broadcasts-video` |
| **Worker RTMP** | Railway / Render / VPS / local | ffmpeg → Instagram Live Producer |

Sem Supabase + secrets → app não carrega.  
Sem worker → admin funciona, mas **não transmite** para o Instagram.

---

## Checklist (ordem recomendada)

### 1. Supabase novo

Crie projeto em [supabase.com](https://supabase.com). Anote em **Settings → API**:

- Project URL → `VITE_SUPABASE_URL`
- anon public → `VITE_SUPABASE_ANON_KEY`
- service_role → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Migration SQL

No **SQL Editor**, execute o arquivo:

`supabase/migrations/20260704120000_initial_schema.sql`

Cria tabelas `ig_broadcasts`, `ig_broadcast_events`, RLS e bucket `ig-broadcasts-video`.

### 3. Usuário admin

Supabase → **Authentication → Users → Add user** (email + senha para `/login`).

### 4. Secrets no Lovable

**Cloud → Secrets** — adicione nos ambientes **Test** e **Live**:

| Secret | Obrigatório | Descrição |
|--------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Service role (servidor) |
| `WORKER_API_SECRET` | Sim | Segredo compartilhado com o worker |
| `WORKER_URL` | Para stream | URL pública do worker (ex.: `https://seu-worker.railway.app`) |
| `VITE_APP_URL` | Não | URL publicada do Lovable |

Depois: **Publish → Update** (republicar).

> Preview (Test) e site publicado (Live) usam secrets **separados**. Copie os 4–5 secrets nos dois ambientes.

### 5. Worker RTMP (fora do Lovable)

```bash
npm run worker:ig-live:install
cd apps/ig-live-worker
# .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WORKER_API_SECRET, WORKER_PORT=8787
npm run dev   # local — precisa ffmpeg no PATH
```

Produção: deploy `apps/ig-live-worker` em Railway/Render/VPS com ffmpeg.  
Health: `GET https://SEU-WORKER/health`

No Lovable Live, defina `WORKER_URL=https://SEU-WORKER` (mesmo `WORKER_API_SECRET` nos dois lados).

### 6. Testar

1. `/login` → credenciais do passo 3  
2. `/admin/instagram-live` → checklist verde no topo  
3. Criar transmissão → upload vídeo vertical → RTMP do Instagram → Armar → Iniciar  

---

## O que o app mostra quando falta algo

- **Banner amarelo** no admin (`SetupChecklist`) — lista passo a passo o que falta  
- **Erro "Ambiente não configurado"** — secrets ausentes no Lovable  
- **Toast ao iniciar stream** — worker offline ou `WORKER_URL` errado  

Não crie tela `/setup` no frontend. Secrets só via **Lovable Cloud → Secrets**.

---

## Prompt para colar no chat Lovable

```
Acabei de importar este projeto Instagram Live. Me guie pelo LOVABLE.md e SETUP.md
SEM criar /setup no app. Checklist:

1) Supabase novo + migration 20260704120000_initial_schema.sql
2) Secrets: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, WORKER_API_SECRET
3) Usuário admin em Authentication → Users
4) Worker em apps/ig-live-worker (ffmpeg) + WORKER_URL no Lovable Live
5) Publish → Update e testar /login → /admin/instagram-live
```

---

## Troubleshooting

| Sintoma | Causa | Ação |
|---------|-------|------|
| Página em branco / 500 setup | Secrets faltando | Cloud → Secrets (Test **e** Live) + republicar |
| Login não funciona | Sem usuário Auth | Add user no Supabase |
| "relation ig_broadcasts does not exist" | Migration não rodou | Rodar SQL da migration |
| Upload falha | Bucket inexistente | Migration cria `ig-broadcasts-video` |
| Stream não inicia | Worker offline | Deploy worker + `WORKER_URL` público |
| Preview ok, Live quebra | Secrets só no Test | Copiar secrets para Live + Publish |

---

## Arquivos de referência

- `SETUP.md` — guia humano completo  
- `AGENTS.md` — instruções para o agente Lovable  
- `.env.example` — lista de variáveis  
- `apps/ig-live-worker/README.md` — worker RTMP  

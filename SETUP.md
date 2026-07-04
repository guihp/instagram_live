# Setup — remixar este projeto

Use este guia ao **remixar no Lovable** ou **clonar do GitHub**. Você precisa do **seu** Supabase — os dados do autor **não** vêm junto.

## Checklist rápido

- [ ] Criar projeto Supabase novo
- [ ] Rodar migration SQL
- [ ] Configurar secrets (4 variáveis obrigatórias)
- [ ] Criar usuário admin no Supabase Auth
- [ ] Configurar e rodar o worker RTMP (`apps/ig-live-worker`)

---

## 1. Supabase — novo projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto **novo**.
2. Anote em **Settings → API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo)

---

## 2. Banco de dados — migration

O schema está em `supabase/migrations/20260704120000_initial_schema.sql`.

Cria as tabelas `ig_broadcasts` e `ig_broadcast_events`, RLS e o bucket `ig-broadcasts-video`.

### Opção A — SQL Editor (mais simples)

1. Supabase → **SQL Editor**
2. Abra o arquivo `.sql`, copie, cole e **Run**

### Opção B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

---

## 3. Secrets / variáveis de ambiente

### No Lovable

**Cloud → Secrets** — adicione:

```
VITE_SUPABASE_URL=https://SEU_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WORKER_API_SECRET=seu_segredo_forte
```

### Localmente

```bash
cp .env.example .env
# Edite .env com seus valores
npm run dev
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anon (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Service role (servidor) |
| `WORKER_API_SECRET` | Sim | Segredo compartilhado admin ↔ worker |
| `WORKER_URL` | Não | URL do worker (padrão `http://localhost:8787`) |
| `VITE_APP_URL` | Não | URL pública do app |

---

## 4. Usuário admin

1. Supabase → **Authentication → Users**
2. **Add user** com email e senha
3. Use essas credenciais em `/login`

---

## 5. Worker RTMP (Instagram Live)

O streaming para Instagram é feito pelo worker em `apps/ig-live-worker/`.

Guia completo: **`apps/ig-live-worker/README.md`**

Resumo:

```bash
# Instalar dependências do worker
npm run worker:ig-live:install

# ffmpeg no PATH (macOS: brew install ffmpeg)
# Configurar .env do worker com SUPABASE_* e WORKER_API_SECRET

npm run worker:ig-live
```

No admin (`/admin/instagram-live`), crie uma transmissão, envie o vídeo vertical, cole a URL RTMP do Instagram Live Producer e inicie o stream.

---

## 6. Testar

1. `npm run dev` (admin)
2. `npm run worker:ig-live` (worker, em outro terminal)
3. Acesse `/login` → `/admin/instagram-live`
4. Crie transmissão, faça upload, configure RTMP e teste

---

## Troubleshooting

| Erro | Causa provável |
|------|----------------|
| "Ambiente não configurado" | Secrets faltando no Lovable ou `.env` |
| Tabela `ig_broadcasts` não existe | Migration não rodou |
| Worker não responde | `WORKER_URL` errado ou worker parado |
| Upload falha | Bucket `ig-broadcasts-video` não criado (rode migration) |
| Login falha | Usuário não criado em Authentication → Users |

---

## Estrutura do código

```
src/routes/admin/instagram-live/  ← painel admin
src/lib/api/ig-live.functions.ts  ← server functions
apps/ig-live-worker/              ← worker ffmpeg RTMP
supabase/migrations/              ← schema IG
```

# AGENTS.md — instruções para o agente Lovable

Este repositório é um **template remixável**. Quem remixar deve usar **credenciais próprias** — nunca as do autor original.

## Regra principal

Se o usuário remixou ou importou este projeto e pediu para "deixar funcionando", **siga SETUP.md passo a passo** antes de alterar código. Não invente URLs, chaves ou project refs do Supabase.

## Variáveis obrigatórias

Configure em **Lovable → Cloud → Secrets** (produção/preview) ou em `.env` (local):

| Variável | Onde obter |
|----------|------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (**secret**) |
| `WORKER_API_SECRET` | Defina um segredo forte — mesmo valor no worker e no admin |

Opcionais: `VITE_APP_URL`, `WORKER_URL` (padrão `http://localhost:8787`).

**Nunca** commite secrets. **Nunca** hardcode project ref do Supabase no código — derive de `VITE_SUPABASE_URL`.

## Banco de dados

1. Criar **novo** projeto Supabase (não reutilizar o do autor).
2. Rodar a migration em `supabase/migrations/`:
   - SQL Editor: colar e executar, ou
   - CLI: `supabase link` + `supabase db push`
3. Criar usuário admin: Supabase → Authentication → Users → Add user (email/senha para `/login`).

## Arquitetura (não alterar sem pedido)

- **Stack:** TanStack Start + Vite + Nitro + Supabase
- **Admin:** server functions em `src/lib/api/ig-live.functions.ts` usam `createServiceClient()` (service role)
- **Worker:** `apps/ig-live-worker/` — ffmpeg RTMP para Instagram Live Producer
- **Auth admin:** Supabase Auth no client (`/login`); guard em `AdminAuthGuard`
- **Bucket:** `ig-broadcasts-video` (vídeos verticais para transmissão)

## Quando o usuário pedir setup

**Não** crie tela `/setup` nem formulário de secrets no frontend. Secrets vão só em **Lovable → Cloud → Secrets** (ou `.env` local).

Responda com checklist curto e ofereça executar cada passo:

1. Criou projeto Supabase novo?
2. Rodou a migration (`supabase/migrations/`)?
3. Configurou os 4 secrets no Lovable Cloud?
4. Criou usuário admin em Authentication → Users?
5. Worker RTMP configurado e rodando (`apps/ig-live-worker`)?

O prompt pronto para colar no chat Lovable está em **`.env.example`** (final do arquivo). Guia completo: **SETUP.md**.

Se faltar migration ou secret, o app falha com mensagens em português nos handlers — use-as para diagnosticar.

## O que NÃO fazer

- Não conectar ao Supabase do autor
- Não remover RLS ou expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Não pular a migration — schema em `supabase/migrations/20260704120000_initial_schema.sql`
- Não substituir server functions por Edge Functions sem pedido explícito

## Referências no repo

- `SETUP.md` — guia completo para humanos
- `.env.example` — lista de variáveis (placeholders)
- `apps/ig-live-worker/README.md` — worker RTMP
- `PRODUCT.md` / `DESIGN.md` — produto e design system

# AGENTS.md — instruções para o agente Lovable

Este repositório é um **template remixável** de **Instagram Live admin**. Quem remixar usa **credenciais próprias**.

## Leia primeiro

**`LOVABLE.md`** — checklist completo, o que roda no Lovable vs fora, troubleshooting.

## Regra principal

Se pedirem "deixar funcionando", **siga LOVABLE.md e SETUP.md** antes de alterar código. Não invente project refs do Supabase.

## Arquitetura Lovable

| Componente | Onde | Notas |
|------------|------|-------|
| Admin UI | Lovable | TanStack Start, `/admin/instagram-live` |
| Supabase | Externo | Auth, DB, Storage |
| Worker RTMP | **Fora do Lovable** | `apps/ig-live-worker` — ffmpeg não roda no Lovable |

O painel **funciona sem worker** (login, CRUD, upload). **Transmitir** exige worker online + `WORKER_URL`.

## Variáveis obrigatórias (Lovable Cloud → Secrets)

| Variável | Onde obter |
|----------|------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (**secret**) |
| `WORKER_API_SECRET` | Segredo forte — **mesmo valor** no worker |
| `WORKER_URL` | URL pública do worker deployado (obrigatório para stream em produção) |

Opcional: `VITE_APP_URL`.

**Nunca** commite secrets. **Nunca** hardcode project ref — derive de `VITE_SUPABASE_URL`.

## Banco de dados

1. Projeto Supabase **novo**
2. Rodar `supabase/migrations/20260704120000_initial_schema.sql`
3. Usuário admin: Authentication → Users → Add user

## Diagnóstico no app

- `SetupChecklist` no layout `/admin` — mostra o que falta (secrets, migration, admin, worker)
- Server function `fetchSetupStatus` em `src/lib/api/setup.functions.ts`
- Erros de config → `getConfigErrorHint()` em `src/lib/env-check.server.ts`

Use essas mensagens para orientar o usuário — **não** crie `/setup` no frontend.

## Quando o usuário pedir setup

Checklist curto:

1. Supabase novo criado?
2. Migration rodou?
3. 4–5 secrets no Lovable (Test **e** Live)?
4. Usuário admin criado?
5. Worker deployado + `WORKER_URL`?
6. Publish → Update feito?

Prompt pronto em **`.env.example`** e **`LOVABLE.md`**.

## O que NÃO fazer

- Não conectar ao Supabase do autor
- Não expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Não tentar rodar ffmpeg/worker dentro do Lovable
- Não criar formulário de secrets no app
- Não pular migration

## Stack

TanStack Start + Vite + Nitro + Supabase. Server functions: `src/lib/api/ig-live.functions.ts`. Bucket: `ig-broadcasts-video`.

## Referências

- `LOVABLE.md` — deploy Lovable (prioridade)
- `SETUP.md` — guia humano
- `.env.example` — variáveis
- `apps/ig-live-worker/README.md` — worker

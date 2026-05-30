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
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) (**secret**) |

Opcionais: `VITE_APP_URL`, `SUPABASE_STORAGE_MAX_BYTES`.

**Nunca** commite secrets. **Nunca** hardcode project ref do Supabase no código — derive de `VITE_SUPABASE_URL`.

## Banco de dados

1. Criar **novo** projeto Supabase (não reutilizar o do autor).
2. Rodar **todas** as migrations em `supabase/migrations/` em ordem cronológica:
   - SQL Editor: colar cada arquivo e executar, ou
   - CLI: `supabase link` + `supabase db push`
3. Criar usuário admin: Supabase → Authentication → Users → Add user (email/senha para `/login`).

## Arquitetura (não alterar sem pedido)

- **Stack:** TanStack Start + Vite + Nitro + Supabase + OpenRouter
- **Dados:** server functions em `src/lib/api/*.functions.ts` usam `createServiceClient()` (service role)
- **Auth admin:** Supabase Auth no client (`/login`); guard em `AdminAuthGuard`
- **Buckets:** `webinar-videos` (vídeos longos), `webinar-assets` (imagens da landing)
- **IA:** transcrição e chat ao vivo via OpenRouter (`src/lib/webinar/openrouter.server.ts`)

## Quando o usuário pedir setup

Responda com checklist curto e ofereça executar cada passo:

1. Criou projeto Supabase novo?
2. Rodou migrations?
3. Configurou os 4 secrets?
4. Criou usuário admin?
5. (Opcional) Conta OpenRouter com créditos?

Se faltar migration ou secret, o app falha com mensagens em português nos handlers — use-as para diagnosticar.

## O que NÃO fazer

- Não conectar ao Supabase/OpenRouter do autor
- Não remover RLS ou expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Não pular migrations — schema completo está em `supabase/migrations/20260530110000_initial_schema.sql` + incrementais
- Não substituir server functions por Edge Functions sem pedido explícito

## Referências no repo

- `SETUP.md` — guia completo para humanos
- `.env.example` — lista de variáveis (placeholders)
- `PRODUCT.md` / `DESIGN.md` — produto e design system

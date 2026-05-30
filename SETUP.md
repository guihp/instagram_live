# Setup — remixar este projeto

Use este guia ao **remixar no Lovable** ou **clonar do GitHub**. Você precisa do **seu** Supabase e **sua** chave OpenRouter — os dados do autor **não** vêm junto.

## Checklist rápido

- [ ] Criar projeto Supabase novo
- [ ] Rodar migrations SQL
- [ ] Configurar secrets (4 variáveis obrigatórias)
- [ ] Criar usuário admin no Supabase Auth
- [ ] (Opcional) Conta OpenRouter com créditos
- [ ] (Opcional) Supabase Pro + limite de upload para vídeos grandes

---

## 1. Supabase — novo projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto **novo**.
2. Anote em **Settings → API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo)

---

## 2. Banco de dados — migrations

O schema está em `supabase/migrations/`. Rode **todos** os arquivos, **na ordem do nome**:

| Arquivo | O que faz |
|---------|-----------|
| `20260530110000_initial_schema.sql` | Tabelas, RLS, buckets de storage |
| `20260530120000_webinar_videos_bucket_limit.sql` | Limite do bucket de vídeos |
| `20260530130000_webinar_assets_mime_types.sql` | Tipos MIME de assets |
| `20260530140000_landing_footer.sql` | Coluna `landing_footer` |
| `20260530150000_trigger_appear_mode.sql` | Modo de aparição dos gatilhos |
| `20260530160000_webinar_live_messages.sql` | Chat ao vivo |
| `20260530170000_ai_assistant_name.sql` | Nome do assistente IA |

### Opção A — SQL Editor (mais simples)

1. Supabase → **SQL Editor**
2. Para cada arquivo acima: abra o `.sql`, copie, cole e **Run**

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
OPENROUTER_API_KEY=sk-or-...
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
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anon (pública no client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Service role — **só servidor** |
| `OPENROUTER_API_KEY` | Sim | IA (transcrição + chat ao vivo) |
| `VITE_APP_URL` | Não | URL pública do app (referer OpenRouter) |
| `SUPABASE_STORAGE_MAX_BYTES` | Não | Limite de upload (padrão 48 MB) |

---

## 4. Usuário admin

1. Supabase → **Authentication → Users**
2. **Add user** → email + senha
3. Acesse `/login` no app e entre com essas credenciais
4. Painel admin em `/admin`

> Qualquer usuário autenticado no Supabase Auth tem acesso ao admin. Para produção, restrinja criação de usuários no dashboard.

---

## 5. OpenRouter

1. Crie conta em [openrouter.ai](https://openrouter.ai)
2. Gere API key em [openrouter.ai/keys](https://openrouter.ai/keys)
3. Adicione créditos (transcrição de vídeo e respostas do chat consomem tokens)
4. Coloque a key em `OPENROUTER_API_KEY`

Sem essa key: upload e admin funcionam; transcrição automática e respostas IA no chat **não**.

---

## 6. Upload de vídeos (opcional)

No plano **Free**, o Supabase limita uploads globais a ~50 MB. Vídeos longos de webinar podem exigir:

1. Upgrade para **Supabase Pro**
2. **Storage → Settings → Global file size limit** — aumente (ex.: 500 MB)
3. Defina `SUPABASE_STORAGE_MAX_BYTES=524288000` nos secrets
4. Reinicie o dev server / republique no Lovable

O admin mostra o link correto do **seu** dashboard (derivado de `VITE_SUPABASE_URL`).

---

## 7. Remix no Lovable

1. **Remix** o projeto ou conecte o repo GitHub
2. Siga os passos 1–4 deste guia
3. Cole no chat do Lovable:

   > Configure meu ambiente seguindo SETUP.md. Já tenho [Supabase URL / keys / OpenRouter]. Me guie no que falta.

4. Habilite **Enable public remixing** em Project settings se quiser que outros remixem a partir do seu fork

O agente Lovable lê `AGENTS.md` e este arquivo automaticamente.

---

## Solução de problemas

| Sintoma | Provável causa |
|---------|----------------|
| "VITE_SUPABASE_URL é obrigatório" | Secrets não configurados ou dev server não reiniciado |
| "Webinar não encontrado" | Migration não rodou ou webinar não publicado |
| Erro 42P01 (tabela inexistente) | Migrations incompletas |
| Upload falha com 413 | Limite global do Storage — veja passo 6 |
| IA não responde no chat | `OPENROUTER_API_KEY` ausente ou sem créditos |
| Login falha | Usuário não criado em Authentication → Users |

---

## Estrutura relevante

```
supabase/migrations/     ← schema do banco
src/lib/api/             ← server functions (Supabase service role)
src/lib/webinar/         ← lógica de webinar, IA, playback
src/routes/login.tsx     ← login admin
src/routes/admin/        ← painel
src/routes/webinar/      ← landing + live (público)
.env.example             ← template de variáveis
AGENTS.md                ← instruções para o agente Lovable
```

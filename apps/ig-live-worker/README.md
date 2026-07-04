# IG Live Worker — streaming RTMP para Instagram Live

Serviço Node.js de longa duração que orquestra **ffmpeg** e envia vídeo pré-gravado para o RTMP do Instagram Live Producer.

> O painel admin fica integrado ao app principal em `/admin/instagram-live` (reutiliza auth Supabase, design system Product e server functions). Este diretório é **somente o worker** — ffmpeg não roda no browser nem em Edge Functions.

---

## Pré-requisitos

### 1. ffmpeg

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install -y ffmpeg
```

**Verificar:**
```bash
ffmpeg -version
```

Se o binário não estiver no PATH, defina `FFMPEG_PATH=/caminho/para/ffmpeg` no `.env`.

### 2. Migration Supabase

Rode a migration `supabase/migrations/20260704120000_initial_schema.sql` no seu projeto Supabase (SQL Editor ou `supabase db push`).

### 3. Variáveis de ambiente

Na raiz do monorepo (`.env`) ou em `apps/ig-live-worker/.env`:

```env
VITE_SUPABASE_URL=https://SEU_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WORKER_API_SECRET=um-segredo-forte-compartilhado-com-o-admin
WORKER_PORT=8787
```

No app admin (mesmo `.env` na raiz):

```env
WORKER_URL=http://localhost:8787
WORKER_API_SECRET=um-segredo-forte-compartilhado-com-o-admin
```

**A stream key do Instagram nunca vai aqui** — o operador cola na UI por sessão.

---

## Instalação e execução

```bash
cd apps/ig-live-worker
npm install
npm run dev
```

Produção:
```bash
npm run build
npm start
```

Health check: `GET http://localhost:8787/health` (sem autenticação).

Demais rotas exigem header `X-Worker-Secret: <WORKER_API_SECRET>`.

---

## API interna

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/streams/arm` | Guarda RTMP URL + stream key **em memória**, status → `armed` |
| POST | `/streams/start` | Inicia ffmpeg (usa credenciais do body ou da memória) |
| POST | `/streams/stop` | Mata ffmpeg, status → `stopped` |
| GET | `/streams/:broadcastId/status` | Status DB + processo vivo |

---

## Passo a passo de operação

1. **Admin** → `/admin/instagram-live` → criar transmissão → enviar vídeo vertical (9:16 recomendado).
2. No Instagram (conta **Business/Creator**), desktop: **+ → Live**.
3. Escolha **Practice** (teste) ou **Public** (ao vivo de verdade).
4. Copie **RTMP URL** e **stream key** do Live Producer.
5. No painel: cole a RTMP URL (persistida) e a stream key (campo mascarado, **não salva**).
6. Clique **Armar transmissão** (guarda chave na memória do worker).
7. Clique **Iniciar transmissão** → worker dispara ffmpeg.
8. No Instagram, clique **Go Live** — o preview deve mostrar o vídeo.
9. Para encerrar: **Parar** no painel (mata ffmpeg).

### Agendamento (MVP)

- Defina `scheduled_at` e **Arme** a transmissão perto do horário (a chave expira por sessão).
- O scheduler (`node-cron`, a cada minuto) inicia broadcasts `armed` cujo horário já passou.
- Se não houver chave em memória no horário → status `error`.

### Limitações conhecidas

- **Chave temporária:** não existe API oficial do Instagram; automação de login (Playwright) é Fase 2.
- **Música comercial** no vídeo pode fazer o Instagram silenciar/derrubar a live.
- **Primeiras lives** em dispositivo novo: limite ~1h; aumenta com o tempo.
- **Uma transmissão ffmpeg por broadcast** por vez; reiniciar o worker limpa chaves em memória.

---

## Formato de saída (ffmpeg)

720×1280 (9:16), 30 fps, H.264 + AAC — conforme exigências do Instagram Live Producer.

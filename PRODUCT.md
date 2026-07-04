# PRODUCT.md — Instagram Live

## Quem usa

**Admin:** equipe que agenda transmissões, envia vídeos verticais pré-gravados e conecta ao Instagram Live Producer via RTMP.

**Público:** assiste no Instagram — não há página pública neste app.

## O que é

Painel admin para **Instagram Live RTMP**: upload de vídeo vertical, agendamento, controle de stream (armar/iniciar/parar) e log de eventos. Um worker separado (`apps/ig-live-worker`) faz o push ffmpeg para o endpoint RTMP do Instagram.

Sucesso = transmissão iniciada no horário, vídeo em loop (se configurado), status atualizado no painel e stream visível no Instagram.

## Tom

Claro, confiável, operacional. Português (Brasil), direto. Foco em quem opera a live, não em marketing.

## Princípios

1. **Operação simples** — criar transmissão, upload, RTMP, iniciar.
2. **Feedback claro** — status e log de eventos em tempo real.
3. **Worker desacoplado** — admin e streaming separados; falha no worker não quebra o painel.
4. **Tokens antes de one-offs** — usar design system em `DESIGN.md` e `src/styles.css`.

## Superfícies

| Superfície | Tipo | Rotas |
|------------|------|-------|
| Admin Instagram Live | **product** | `/admin/instagram-live/*` |
| Login | **product** | `/login` |

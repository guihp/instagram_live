# DESIGN.md — Instagram Live Admin

Design system para o painel admin de transmissões Instagram Live.

## Stack UI

- shadcn/ui em `src/components/ui/`
- Tokens OKLCH em `src/styles.css`
- Tailwind v4 utilitários
- Tema escuro Dojo (admin shell)

## Superfícies

| Superfície | Estilo |
|------------|--------|
| Admin (`/admin/*`) | Product — fundo `#0F1114`, sidebar `#1A1C22`, accent teal `#73a5b6` |
| Login (`/login`) | Product — split panel, glass cards, decor animado |

## Tokens principais

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#73a5b6` | Botões, links, accent |
| `--background` | `#000000` | Fundo base |
| `--card` | `#1f2127` | Cards |
| `--muted-foreground` | `#b0b3bd` | Texto secundário |
| `--border` | `rgba(255,255,255,0.06)` | Bordas sutis |

## Componentes

- Status badges: `IgBroadcastStatusBadge`
- Listagem: `IgBroadcastList`
- Editor: `IgBroadcastEditor`
- Feed de eventos: `IgBroadcastActivityFeed`

## Referências

| Arquivo | Conteúdo |
|---------|----------|
| `src/styles.css` | Tokens, animações Dojo, glass cards |
| `src/components/admin/AdminSidebar.tsx` | Navegação admin |
| `src/routes/login.tsx` | Layout login |

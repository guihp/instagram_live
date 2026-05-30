---
name: Webinar Platform (Our Inner Empathy)
description: Plataforma de webinars — shadcn/ui, Tailwind v4, tokens OKLCH, superfícies admin (product) + landing por evento (brand)
registers:
  product: Admin, login, sala ao vivo
  brand: Landing e sala de espera do webinar
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.129 0.042 264.695)"
  primary: "oklch(0.208 0.042 265.755)"
  webinar-ink: "oklch(0.14 0.045 265)"
  webinar-accent: "oklch(0.62 0.19 250)"
  webinar-surface: "oklch(0.985 0.006 265)"
typography:
  product:
    family: "ui-sans-serif, system-ui, sans-serif"
  brand-display:
    family: "Bricolage Grotesque"
  brand-body:
    family: "Manrope"
rounded:
  base: "0.625rem"
spacing:
  landing-max-width: "48rem"
  section-gap: "4rem"
---

# Design System

Documento canônico do sistema visual. Tokens globais em `src/styles.css`; padrões de superfície em `PRODUCT.md`.

---

## 1. Arquitetura visual

| Camada | Onde | Objetivo |
|--------|------|----------|
| **Tokens globais** | `:root`, `.dark` em `styles.css` | Admin, login, live room — register **product** |
| **Tokens webinar** | `--webinar-*` em `styles.css` | Landing `/webinar/:slug` — register **brand** |
| **Componentes** | `src/components/ui/*` (shadcn) | Primitivos reutilizáveis |
| **Superfícies** | `WebinarLandingPage`, `WebinarEditor`, admin routes | Composição e copy por contexto |

**Stack:** React 19 · TanStack Router/Start · Tailwind CSS v4 · Radix · Lucide · OKLCH · Sonner

---

## 2. Registers

### Product (admin · login · live)

- Densidade funcional, hierarquia clara, ações visíveis
- Paleta fria neutra (matiz ~265°), fundo branco
- System UI sans — sem fonte customizada
- Flat + border; sombra só em botões primários/destructive

### Brand (landing · waiting)

- **Conversão:** coluna única, CTA no rodapé, sticky bar no mobile (register)
- **Confiança:** horários Brasília, countdown legível, estados register/waiting explícitos
- **Identidade por evento:** hero image, vídeo promo, copy e host vêm do admin — shell visual é fixo
- **Estratégia de cor:** *Committed* — hero drenched (`webinar-ink`) + accent elétrico (`webinar-accent`)
- **Tipografia:** Bricolage Grotesque (display) + Manrope (body), carregadas no `__root.tsx`

---

## 3. Cores (OKLCH)

### Globais (`:root`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `oklch(1 0 0)` | App, live room |
| `--foreground` | `oklch(0.129 0.042 264.695)` | Texto principal |
| `--primary` | `oklch(0.208 0.042 265.755)` | CTAs admin, links |
| `--muted-foreground` | `oklch(0.554 0.046 257.417)` | Secundário (≥4.5:1 no fundo claro) |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Erros |
| `--border` | `oklch(0.929 0.013 255.508)` | Divisores |

Dark mode: classe `.dark` no ancestral.

### Landing webinar (`--webinar-*`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--webinar-ink` | `oklch(0.14 0.045 265)` | Hero, footer CTA |
| `--webinar-ink-muted` | `oklch(0.72 0.03 265)` | Texto secundário no hero |
| `--webinar-surface` | `oklch(0.985 0.006 265)` | Fundo corpo da landing |
| `--webinar-surface-alt` | `oklch(0.96 0.012 265)` | Faixas alternadas, listas |
| `--webinar-accent` | `oklch(0.62 0.19 250)` | CTAs, destaques, live dot |
| `--webinar-accent-soft` | `oklch(0.92 0.06 250)` | Ícones, badges suaves |

Utilitários Tailwind: `bg-webinar-ink`, `text-webinar-accent`, etc. (via `@theme inline`).

**Contraste no hero:** texto secundário usa `white/75` ou mais claro; evitar `slate-400` em parágrafos longos.

---

## 4. Tipografia

### Product

- Família: system UI stack
- Corpo: `text-sm` (admin), `text-base` onde há formulários longos
- Títulos: `font-semibold` / `font-bold`

### Brand (`.webinar-landing`)

| Papel | Família | Escala |
|-------|---------|--------|
| Display (h1–h3) | Bricolage Grotesque | h1: `clamp(1.875rem, 5.5vw, 3.25rem)`, tracking `-0.03em` |
| Body | Manrope | `text-base`, `leading-relaxed` |
| Countdown | Manrope mono tabular | `font-mono tabular-nums` |

- `text-wrap: balance` em headings; `text-wrap: pretty` em prosa
- Largura de leitura: `max-w-prose` / `max-w-2xl` na landing

---

## 5. Landing webinar — layout

Fluxo vertical **mobile-first**, coluna única (`max-w-2xl` → `lg:max-w-3xl`).

```
┌─────────────────────────────┐
│ HERO (webinar-ink)          │
│  · badge live               │
│  · título + subtítulo       │
│  · vídeo promo (ou capa)    │
│  · tiles: data + countdown  │
│  · CTA primário + grupo →   │
│    scroll suave ao rodapé   │
├─────────────────────────────┤
│ MAIN (webinar-surface)      │
│  · benefícios (lista)       │
│  · tópicos (timeline)       │
│  · para quem é              │
│  · host: nome, cargo, bio   │
├─────────────────────────────┤
│ FOOTER CTA (webinar-ink)    │
│  register: formulário       │
│  waiting: grupo + status    │
└─────────────────────────────┘
     [sticky CTA mobile]
```

### Modos

| Modo | Hero CTA | Rodapé |
|------|----------|--------|
| **register** | Scroll → `#webinar-cta` (form) | `LeadCaptureForm` em card branco |
| **waiting** | Scroll → rodapé | Confirmação + botão abrir grupo |

### Padrões proibidos na landing

- Grid de cards idênticos (ícone + título + texto repetido)
- Eyebrows em caps em toda seção
- `border-left` grosso como destaque
- Fundo cream/sand (`#fafafa`) — usar `webinar-surface`
- Formulário no hero (conversão fica no rodapé)

### Motion

- Entrada hero: `.webinar-reveal` (fade-up, ease-out expo)
- `@media (prefers-reduced-motion: reduce)` desliga animações
- Scroll: `behavior: smooth` para CTAs

### Z-index (landing)

| Camada | Valor |
|--------|-------|
| Sticky CTA mobile | `z-40` |
| Modais (grupo) | dialog shadcn (portal) |

---

## 6. Componentes

| Componente | Path | Notas |
|------------|------|-------|
| Button | `ui/button.tsx` | Landing: `bg-webinar-accent`; admin: `bg-primary` |
| Input / Form | `ui/input`, `LeadCaptureForm` | Campos dinâmicos; telefone BR/US |
| Card | `ui/card.tsx` | Admin; landing evita cards aninhados |
| Avatar | `ui/avatar.tsx` | Host na landing |
| Dialog | `ui/dialog.tsx` | Grupo WhatsApp embed |
| Toaster | `sonner` | `top-center`, `richColors` |

**Radius:** `--radius: 0.625rem` · landing usa `rounded-2xl` em blocos principais

---

## 7. Admin

- Sidebar `w-56`, `bg-muted/30`
- Tabs no `WebinarEditor`: Geral · Landing · Formulário · Vídeo · Chat · Gatilhos
- Upload de assets → bucket `webinar-assets`
- Horários sempre interpretados/exibidos em **Brasília (UTC−3)**

---

## 8. Acessibilidade

- WCAG 2.1 AA em fluxos públicos
- Alvos de toque ≥ 44px (`min-h-11`, `h-12` em CTAs)
- Labels em formulários; foco visível (`ring`)
- Landmarks: `header`, `main`, `section` + `aria-labelledby`
- Vídeo: `playsInline`; imagem hero com `aria-label` quando sem texto

---

## 9. Do · Don't

**Do**

- Usar tokens `--webinar-*` na landing; `--primary` no admin
- Manter copy em pt-BR; verbos nos botões ("Garantir minha vaga", "Entrar no grupo")
- Testar register + waiting em 375px e desktop
- Reprocessar transcrição para `ai_context` XML quando conteúdo mudar

**Don't**

- Inter / gradiente roxo genérico / cards dentro de cards
- Inscrição no chat ao vivo (participante já está na sala)
- Sobrescrever tokens globais por um webinar — usar assets por evento
- Motion bounce/elastic; hero que esconde conteúdo até animar

---

## 10. Arquivos de referência

| Arquivo | Conteúdo |
|---------|----------|
| `src/styles.css` | Tokens OKLCH, `@theme`, `.webinar-landing` base |
| `src/components/webinar/WebinarLandingPage.tsx` | Layout landing |
| `src/components/admin/WebinarEditor.tsx` | Configuração por evento |
| `PRODUCT.md` | Usuários, princípios, anti-references |
| `.cursor/skills/impeccable/` | Auditoria e iteração visual |

---

## Changelog recente

- **2026-05:** Landing redesenhada — coluna única, tokens `--webinar-*`, Bricolage + Manrope, CTA no rodapé, sticky mobile
- **2026-05:** `ai_context` em XML para chat ao vivo; telefone BR/US; uploads Supabase na landing

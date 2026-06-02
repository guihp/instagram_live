# DOJO Design System

Documento de referencia para todas as telas e componentes do DojoDesk.

---

## 1. Identidade Visual

**Produto**: DojoDesk — CRM com atendimento automatizado por agentes IA  
**Estetica**: Minimalist Dark Glass  
**Tom**: Profissional, tech-forward, premium, dark-first  
**Motivo visual**: Hexagono (logo DOJO)

---

## 2. Paleta de Cores

### Brand tokens (Tailwind: `brand-*`)

| Token       | Hex       | Uso                                          |
|-------------|-----------|----------------------------------------------|
| `black`     | `#000000` | Fundo principal, backgrounds profundos       |
| `dark`      | `#1F2127` | Paineis, cards, superficies elevadas         |
| `steel`     | `#606270` | Texto terciario, placeholders                |
| `teal`      | `#73A5B6` | Cor de acento principal, botoes, links, focus |
| `ice`       | `#DDF7F9` | Highlights, glows de alta intensidade        |
| `silver`    | `#B0B3BD` | Texto secundario, labels                     |
| `white`     | `#FFFFFF` | Texto principal, headings                    |

### Regras de uso
- **Backgrounds**: preto puro (`#000000`) ou `#050708` para paineis com glow
- **Texto principal**: `white` com opacidades (`white/90`, `white/80`)
- **Texto secundario**: `#555` ou `white/25` para hints discretos
- **Labels de form**: `#444`, uppercase, tracking wide, `0.65rem`
- **Acento/CTA**: `brand-teal` solido para botoes primarios, com opacidade para bordas e glows
- **Erros**: `red-400/80` para texto, `red-500/10` para backgrounds
- **Glass borders**: `white` com opacidades de `0.06` (default) a `0.12` (focus/hover)

---

## 3. Tipografia

### Fonte principal: Matter
- **Familia**: `Matter` (sans-serif)
- **Pesos disponiveis**: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), Heavy (800)
- **Formato**: WOFF2 em `public/fonts/`
- **Fallback**: `system-ui, sans-serif`

### Fonte mono: Matter SemiMono
- **Pesos**: Regular (400), Medium (500)
- **Uso**: Dados numericos, metricas, badges de feature cards

### Escala tipografica
| Elemento            | Tamanho     | Peso      | Tracking        | Cor           |
|---------------------|-------------|-----------|-----------------|---------------|
| Page heading        | `2rem`      | Light     | `-0.04em`       | `white`       |
| Subtitulo           | `0.85rem`   | Regular   | normal          | `#555`        |
| Label de campo      | `0.65rem`   | Medium    | `0.12em`        | `#444`        |
| Input text          | `0.85rem`   | Light     | normal          | `white/90`    |
| Placeholder         | `0.85rem`   | Light     | normal          | `white/15`    |
| Botao primario      | `0.85rem`   | SemiBold  | wide            | `brand-dark`  |
| Texto auxiliar      | `0.7rem`    | Regular   | normal          | `white/25`    |
| Feature card label  | `0.65rem`   | Medium    | normal          | `white/50`    |
| Feature card detail | `0.55rem`   | Mono      | normal          | `white/20`    |

---

## 4. Efeitos Glass

### Glass Input
```
background: white/[0.02]
border: white/[0.06]
border-radius: 10px
transition: 500ms

focus:
  border: white/[0.12]
  background: white/[0.03]
  box-shadow: 0 0 0 1px rgba(115,165,182,0.06), 0 0 30px -10px rgba(115,165,182,0.08)
```

### Glass Card (feature cards flutuantes)
```
background: linear-gradient(135deg, white/5% 0%, white/1.5% 100%)
border: 1px solid white/8%
box-shadow: 0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 white/4%
backdrop-filter: blur(12px)
```

### Glass Card Central (hero/branding)
```
background: linear-gradient(160deg, teal/8% 0%, white/2% 40%, black/10% 100%)
border: 1px solid white/10%
box-shadow:
  0 0 0 0.5px white/5%,
  inset 0 1px 0 0 white/8%,
  inset 0 -20px 40px -20px black/30%,
  0 25px 70px -15px black/70%,
  0 0 100px -20px teal/12%
backdrop-filter: blur(20px)
```

### Checkbox custom
```
container: w-4 h-4, relative
input: opacity-0, absolute, inset-0, z-10
visual: rounded, border white/10%, bg white/2%
checked: border teal/50%, bg teal/15%
checkmark: svg 2.5x2.5, teal, opacity toggle
```

---

## 5. Animacoes

### Keyframes definidos (styles.css)

| Nome            | Descricao                                        | Duracao   | Easing         |
|-----------------|--------------------------------------------------|-----------|----------------|
| `fade-up`       | Entrada com slide de baixo                       | 0.7s      | ease-out       |
| `fade-in`       | Fade simples                                     | 0.5s      | ease-out       |
| `hex-float`     | Flutuacao suave com rotacao leve (cards)          | 8s        | ease-in-out    |
| `hex-pulse`     | Pulsacao de opacidade                            | 6s        | ease-in-out    |
| `glow-breathe`  | Respiracao de glow (scale + opacity)             | 4s        | ease-in-out    |
| `shine-sweep`   | Reflexo de luz diagonal atravessando superficie   | 6s        | ease-in-out    |
| `star-rotate`   | Rotacao lenta dos bracos da estrela              | 120s      | linear         |
| `shimmer`       | Brilho horizontal nos feature cards              | 3s        | ease-in-out    |
| `border-rotate` | Luz percorrendo borda (conic-gradient animado)   | 4s        | linear         |

### Padroes de entrada (staggered)
- Delay base: `0.1s`, incremento de `0.05s` por elemento
- Todos os elementos comecam com `opacity-0` e usam `animate-fade-up`
- Feature cards na direita comecam com delay `0.6s+`

### RotatingText (motion/react)
- Spring animation: `damping: 28, stiffness: 360, mass: 0.8`
- Letter stagger: `0.02s` por caractere
- Intervalo de rotacao: `2200ms`
- Usado na subtitulo do login para ciclar entre termos do produto

---

## 6. Efeitos de Luz

### Star Glow (painel decorativo)
```
Radial cross:
  - Vertical: ellipse 160x700px, teal/14%
  - Horizontal: ellipse 700x160px, teal/14%
  - Core: circle 300px, teal/8%

Diagonal arms (rotating):
  - ellipse 500x60px, teal/5%, rotate(±45deg)
  - Rotacao completa em 120s

Bright core point:
  - circle 40px, ice/12%

Vignette:
  - radial transparent 25% -> black/60%
```

### Glow sutil (painel do form)
```
radial-gradient(circle at 0% 0%, teal/0.6 opacity -> transparent 60%)
opacity geral: 3%
```

---

## 7. Botoes

### Botao Primario (CTA)
```
background: linear-gradient(135deg, #73A5B6, #5a8fa0)
color: brand-dark (texto escuro)
font-weight: 600 (SemiBold)
border-radius: 10px
padding: 14px vertical
box-shadow: 0 0 24px -4px teal/35%, 0 4px 12px -2px black/30%

hover: gradiente clareia para #84b3c3 -> #6a9dac
       shine sweep da esquerda para direita
active: scale(0.97)

Border light (wrapper):
  conic-gradient animado (border-rotate 4s)
  p-[1px] wrapper com overflow-hidden
```

### Links / Botoes secundarios
```
color: white/25
hover: white/50
transition: 300ms
font-size: 0.7rem
```

---

## 8. Layout

### Paginas de Auth (login, setup)
- Full viewport: `h-[100dvh] w-[100dvw]`
- Split horizontal: `flex-row` em `lg:+`
- Painel esquerdo: formulario, max `520-560px`
- Painel direito: decorativo/branding, escondido abaixo de `lg`
- Background: `bg-black`

### Espacamento padrao
- Logo para heading: `mb-16`
- Heading para subtitulo: `mb-2`
- Subtitulo para separator: `mb-6`
- Separator para form: `mb-10`
- Entre campos: `space-y-5`
- Form para footer: `mt-10`
- Label para input: `mb-2`

---

## 9. Assets

### Logos (src/assets/)
| Arquivo               | Uso                           |
|-----------------------|-------------------------------|
| `dojo-logo-branca.png` | Logo completa, fundo escuro   |

### Fontes (public/fonts/)
```
Matter-Light.woff2
Matter-Regular.woff2
Matter-Medium.woff2
Matter-SemiBold.woff2
Matter-Bold.woff2
Matter-Black.woff2
```

---

## 10. Componentes Reutilizaveis

### RotatingText (`src/components/ui/rotating-text.tsx`)
Texto que cicla entre palavras com animacao spring letter-by-letter.

```tsx
<RotatingText
  texts={['leads', 'atendimentos', 'agentes']}
  interval={2200}
  className="text-brand-teal/80 font-medium"
/>
```

Props:
- `texts`: string[] — palavras para ciclar
- `interval`: number — ms entre trocas (default 2500)
- `className`: string — classes para o wrapper

Dependencia: `motion` (framer-motion v12+)

---

## 11. Dependencias de UI

| Pacote                | Versao   | Uso                        |
|-----------------------|----------|----------------------------|
| `tailwindcss`         | 4.x      | Framework CSS              |
| `tw-animate-css`      | -        | Plugin de animacoes        |
| `motion`              | 12.x     | Animacoes spring (React)   |
| `lucide-react`        | -        | Icones                     |
| `@radix-ui/*`         | -        | Primitivos (shadcn/ui)     |
| `class-variance-authority` | -   | Variantes de componentes   |
| `clsx` + `tailwind-merge` | -    | Merge de classes           |

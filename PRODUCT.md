# Product

## Register

product

## Users

**Organizers (admin):** equipe DojoProjetos que cria webinars, configura landing, agenda sessões, acompanha leads e opera a transmissão ao vivo.

**Participantes (público):** pessoas que chegam por link (`/webinar/:slug`), preenchem o formulário de captura, entram na sala de espera e assistem à aula ao vivo com chat sincronizado. Contexto: conversão em evento agendado, muitas vezes no celular, com pouca paciência para fricção.

## Product Purpose

Plataforma de webinars ao vivo com landing configurável por evento, captura de leads, sala de espera com countdown, sala ao vivo (vídeo sincronizado + chat + gatilhos) e painel admin para gestão. Sucesso = lead registrado, presença na live, experiência estável em mobile e desktop, e operação simples para quem configura o webinar.

## Brand Personality

Claro, confiável, orientado a ação. Tom em português (Brasil), direto, sem hype vazio. Para superfícies públicas de webinar, cada evento pode trazer identidade própria (hero, imagens, copy) sem perder legibilidade e sensação de evento profissional ao vivo.

## Anti-references

- Visual genérico de “SaaS com IA”: Inter/system-ui como única personalidade, gradiente roxo–azul, cards empilhados em cards, texto cinza fraco sobre fundo colorido.
- Landing de webinar que parece template de marketing genérico (badges vazias, “transforme seu negócio”, contadores falsos).
- Admin denso demais: tabelas sem hierarquia, ações escondidas, estados vazios sem orientação.
- Motion exagerado (bounce, elastic) ou hero que oculta conteúdo até animar.

## Design Principles

1. **Conversão antes de decoração** — na jornada pública, cada bloco deve empurrar registro ou entrada na live; remover ruído que não serve ao CTA.
2. **Confiança em evento ao vivo** — horários em Brasília, countdown legível, estados de espera/live explícitos; evitar ambiguidade.
3. **Operação sem atrito** — admin e editores devem conseguir configurar webinar e ver preview sem adivinhar o que falta.
4. **Tokens antes de one-offs** — preferir variáveis em `src/styles.css` e componentes shadcn; exceções visuais por webinar devem ser conscientes (hero/imagem), não padrão global.
5. **Acessível por padrão** — contraste, foco visível, alvos de toque ≥44px, `prefers-reduced-motion` respeitado.

## Accessibility & Inclusion

- Alvo WCAG 2.1 AA em fluxos públicos e admin.
- Formulários com labels, erros claros, foco visível (`ring`).
- Suporte a `prefers-reduced-motion` em animações futuras.
- Interface em `pt-BR`; datas/horários com fuso de Brasília onde aplicável.

## Register overrides (por superfície)

| Superfície | Register | Rotas / área |
|------------|----------|----------------|
| Landing e espera do webinar | **brand** | `/webinar/:slug` (modos register / waiting) |
| Sala ao vivo, admin, login | **product** | `/webinar/:slug` (live), `/admin/*`, `/login` |

Ao trabalhar em landing de webinar, carregar `reference/brand.md` da skill Impeccable. No restante, `reference/product.md`.

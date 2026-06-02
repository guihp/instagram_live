import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Sparkles,
  Users,
} from "lucide-react";

import { LeadCaptureForm } from "@/components/webinar/LeadCaptureForm";
import { Button } from "@/components/ui/button";
import type { Webinar, WebinarFormField } from "@/lib/supabase/database.types";
import {
  getAssetImageUrl,
  getAssetPublicUrl,
  getPromoVideoUrl,
  parseLandingBenefits,
  parseLandingFooter,
  parseLandingTopics,
} from "@/lib/webinar/landing";
import { formatBrasiliaDateTimeLong } from "@/lib/webinar/datetime";
import {
  describeSchedule,
  formatCountdown,
  getTimeUntilLiveFromWebinar,
  toScheduleConfig,
} from "@/lib/webinar/playback";
import { getSessionState } from "@/lib/webinar/schedule";
import { cn } from "@/lib/utils";

interface WebinarLandingPageProps {
  webinar: Webinar;
  formFields: WebinarFormField[];
  mode: "register" | "waiting";
  onRegister?: (data: Record<string, string>) => Promise<void>;
  registerLoading?: boolean;
}

const CTA_SECTION_ID = "webinar-cta";

function useCountdown(webinar: Webinar) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilLiveFromWebinar(webinar));

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeUntilLiveFromWebinar(webinar));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [webinar]);

  return timeLeft;
}

function scrollToCta() {
  document.getElementById(CTA_SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function WebinarLandingPage({
  webinar,
  formFields,
  mode,
  onRegister,
  registerLoading,
}: WebinarLandingPageProps) {
  const timeLeft = useCountdown(webinar);
  const config = toScheduleConfig(webinar);
  const { nextSessionStart } = getSessionState(config);
  const ctaRef = useRef<HTMLElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  const benefits = parseLandingBenefits(webinar.landing_benefits);
  const topics = parseLandingTopics(webinar.landing_topics);
  const heroImage = getAssetPublicUrl(webinar.landing_hero_image);
  const hostImageFallback = getAssetPublicUrl(webinar.host_image_url);
  const hostImage = getAssetImageUrl(webinar.host_image_url, {
    width: 400,
    height: 400,
    quality: 90,
  });
  const hostImageRetina = getAssetImageUrl(webinar.host_image_url, {
    width: 800,
    height: 800,
    quality: 85,
  });
  const promoVideoUrl = getPromoVideoUrl(webinar.landing_promo_video_url);
  const hasPromoVideo = Boolean(promoVideoUrl);
  const ctaText = webinar.landing_cta_text ?? "Garantir minha vaga grátis";
  const footer = parseLandingFooter(webinar.landing_footer);
  const showFooter = footer.enabled && (footer.text.trim() || footer.links.length > 0);
  const hasGroup = Boolean(webinar.group_link?.trim());
  const isLive = timeLeft <= 0;

  const heroTitle = mode === "waiting" ? (webinar.waiting_title ?? webinar.title) : webinar.title;
  const heroSubtitle =
    mode === "waiting"
      ? (webinar.waiting_description ??
        webinar.description ??
        "Prepare-se: em instantes você terá acesso à aula ao vivo.")
      : (webinar.description ?? "Aula ao vivo gratuita, 100% online. Vagas limitadas.");

  useEffect(() => {
    if (mode !== "register") return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry?.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -72px 0px" },
    );

    const el = ctaRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const primaryHeroAction = useCallback(() => scrollToCta(), []);

  return (
    <div className="webinar-landing min-h-screen bg-webinar-surface text-foreground">
      {/* Hero vendedor — mobile-first */}
      <header className="relative overflow-hidden bg-webinar-ink text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,oklch(0.55_0.2_250/0.45),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,oklch(0.45_0.15_160/0.2),transparent_45%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-webinar-ink/40 via-webinar-ink to-webinar-ink" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:px-10 lg:pb-20 lg:pt-16 xl:max-w-[84rem]">
          <div
            className={cn(
              "grid items-center gap-8 sm:gap-10 lg:gap-16 xl:gap-20",
              hasPromoVideo || heroImage
                ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,520px)] xl:grid-cols-[minmax(0,1fr)_minmax(400px,580px)]"
                : "max-w-4xl",
            )}
          >
            <div className="flex flex-col lg:py-4">
              <div className="webinar-reveal flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/95 sm:text-sm">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:animate-none" />
                    <span
                      className={cn(
                        "relative inline-flex size-2 rounded-full",
                        isLive ? "bg-emerald-400" : "bg-webinar-accent",
                      )}
                    />
                  </span>
                  {isLive ? "Ao vivo agora" : "Aula gratuita · ao vivo"}
                </span>
                {!isLive && timeLeft > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-webinar-accent/20 px-3 py-1 text-xs font-medium text-white sm:text-sm">
                    <Clock3 className="size-3.5 shrink-0 opacity-90" aria-hidden />
                    Começa em{" "}
                    <strong className="font-mono font-bold tabular-nums">{formatCountdown(timeLeft)}</strong>
                  </span>
                )}
              </div>

              <h1 className="webinar-reveal webinar-reveal-delay-1 mt-5 text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-balance sm:mt-6 lg:text-[clamp(2.5rem,4.5vw,4rem)]">
                {heroTitle}
              </h1>

              <p className="webinar-reveal webinar-reveal-delay-2 mt-4 max-w-2xl text-base leading-relaxed text-white/78 sm:mt-5 sm:text-lg lg:text-xl lg:leading-relaxed">
                {heroSubtitle}
              </p>

              <EventScheduleStrip
                config={config}
                nextSessionStart={nextSessionStart}
                className="webinar-reveal webinar-reveal-delay-2 mt-5 sm:mt-6 lg:text-base"
              />

              <div className="webinar-reveal webinar-reveal-delay-2 mt-8 flex w-full flex-col gap-3 sm:mt-10 lg:max-w-lg">
                {mode === "register" ? (
                  <Button
                    size="lg"
                    onClick={primaryHeroAction}
                    className="h-14 min-h-[3.25rem] w-full gap-2 rounded-xl bg-webinar-accent text-base font-bold shadow-[0_12px_40px_-8px_oklch(0.62_0.19_250/0.65)] transition-transform hover:scale-[1.02] hover:bg-webinar-accent/92 active:scale-[0.98] sm:text-lg lg:h-16 lg:text-xl"
                  >
                    {ctaText}
                    <ArrowRight className="size-5 lg:size-6" />
                  </Button>
                ) : null}

                {hasGroup && !(hasPromoVideo || heroImage) && (
                  <GroupJoinButton href={webinar.group_link!} prominent={mode === "waiting"} />
                )}

                {hasGroup && (hasPromoVideo || heroImage) && (
                  <div className="hidden lg:block">
                    <GroupJoinButton href={webinar.group_link!} prominent={mode === "waiting"} />
                  </div>
                )}

                {mode === "register" && (
                  <p className="text-center text-xs text-white/45 sm:text-left lg:text-sm">
                    100% gratuito · sem cartão · confirmação imediata
                  </p>
                )}
              </div>
            </div>

            {(hasPromoVideo || heroImage) && (
              <div className="webinar-reveal webinar-reveal-delay-2 flex w-full flex-col lg:justify-self-end">
                {hasPromoVideo ? (
                  <div className="overflow-hidden rounded-2xl bg-black shadow-[0_32px_80px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/15 lg:rounded-3xl">
                    <video
                      src={promoVideoUrl ?? undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full bg-black object-contain lg:min-h-[280px] xl:min-h-[320px]"
                    />
                  </div>
                ) : heroImage ? (
                  <div className="aspect-[4/5] max-h-[480px] overflow-hidden rounded-2xl shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/15 sm:aspect-video sm:max-h-none lg:max-h-[520px] lg:rounded-3xl">
                    <img src={heroImage} alt="" className="size-full object-cover object-center" />
                  </div>
                ) : null}

                <p className="mt-3 text-center text-xs text-white/40 sm:text-sm lg:text-left">
                  Assista ao preview e veja o que te espera na aula
                </p>

                {hasGroup && (
                  <div className="mt-4 lg:hidden">
                    <GroupJoinButton href={webinar.group_link!} prominent={mode === "waiting"} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Faixa de prova social / urgência */}
      <div className="border-y border-border/60 bg-webinar-surface-alt px-4 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-sm text-muted-foreground sm:justify-start sm:text-left lg:text-base xl:max-w-[84rem]">
          <span className="inline-flex items-center gap-2 font-medium text-foreground/85">
            <Sparkles className="size-4 text-webinar-accent" />
            Conteúdo prático e direto ao ponto
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <Users className="size-4 text-webinar-accent" />
            Comunidade ativa de participantes
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 text-webinar-accent" />
            {formatBrasiliaDateTimeLong(nextSessionStart)} · Brasília
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:max-w-[84rem]">
        {benefits.length > 0 && (
          <section className="space-y-8" aria-labelledby="benefits-heading">
            <SectionHeading
              id="benefits-heading"
              title="O que você vai aprender"
              lead="Resultados reais que você pode aplicar ainda hoje — sem enrolação."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
              {benefits.map((b, i) => (
                <li
                  key={i}
                  className="group flex gap-4 rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-webinar-accent/30 hover:shadow-md sm:p-6"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-webinar-accent-soft text-webinar-accent transition-colors group-hover:bg-webinar-accent group-hover:text-white">
                    <Check className="size-5" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h3 className="font-bold leading-snug">{b.title}</h3>
                    {b.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {topics.length > 0 && (
          <section
            className={cn("space-y-8", benefits.length > 0 && "mt-16 sm:mt-20")}
            aria-labelledby="topics-heading"
          >
            <SectionHeading
              id="topics-heading"
              title="Roteiro da aula"
              lead="Cada minuto foi pensado para entregar valor e clareza."
            />
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic, i) => (
                <li
                  key={i}
                  className="relative rounded-xl border border-border/60 bg-webinar-surface-alt/60 p-4 pl-12 sm:p-5 sm:pl-14"
                >
                  <span
                    className="absolute left-4 top-4 flex size-7 items-center justify-center rounded-lg bg-webinar-ink text-xs font-bold text-white sm:left-5 sm:top-5"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">{topic}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {webinar.landing_audience && (
          <section
            className={cn(
              "mt-16 sm:mt-20",
              (benefits.length > 0 || topics.length > 0) &&
                "rounded-3xl border border-webinar-accent/15 bg-gradient-to-br from-webinar-accent-soft/80 to-white px-6 py-8 sm:px-10 sm:py-10",
            )}
            aria-labelledby="audience-heading"
          >
            <SectionHeading
              id="audience-heading"
              title="Feito para você se…"
              lead="Se bate com o seu momento, não perca esta aula."
            />
            <p className="mt-6 text-base leading-[1.75] text-foreground/88 whitespace-pre-line">
              {webinar.landing_audience}
            </p>
          </section>
        )}

        {(webinar.host_name || webinar.host_bio) && (
          <section className="mt-16 sm:mt-20" aria-labelledby="host-heading">
            <SectionHeading id="host-heading" title="Quem conduz a aula" />
            <article className="mt-8 flex flex-col items-center gap-6 rounded-3xl border border-border/60 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:p-8">
              {hostImage || hostImageFallback ? (
                <div className="relative shrink-0">
                  <div className="size-32 overflow-hidden rounded-2xl bg-webinar-accent-soft shadow-lg ring-2 ring-webinar-accent/20 sm:size-36">
                    <img
                      src={hostImage ?? hostImageFallback ?? undefined}
                      srcSet={
                        hostImageRetina && hostImage
                          ? `${hostImage} 1x, ${hostImageRetina} 2x`
                          : undefined
                      }
                      alt={webinar.host_name ?? "Apresentador"}
                      width={144}
                      height={144}
                      decoding="async"
                      className="size-full object-cover object-center"
                      onError={(e) => {
                        if (hostImageFallback && e.currentTarget.src !== hostImageFallback) {
                          e.currentTarget.src = hostImageFallback;
                          e.currentTarget.removeAttribute("srcset");
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="flex size-32 shrink-0 items-center justify-center rounded-2xl bg-webinar-accent-soft text-2xl font-bold text-webinar-accent sm:size-36"
                  aria-hidden
                >
                  {(webinar.host_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 text-center sm:text-left">
                {webinar.host_name && (
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{webinar.host_name}</h3>
                )}
                {webinar.host_title && (
                  <p className="mt-1 text-sm font-semibold text-webinar-accent">{webinar.host_title}</p>
                )}
                {webinar.host_bio && (
                  <p className="mt-4 text-base leading-[1.7] text-muted-foreground whitespace-pre-line">
                    {webinar.host_bio}
                  </p>
                )}
              </div>
            </article>
          </section>
        )}

        {hasGroup && mode === "waiting" && (
          <section className="mt-16 sm:mt-20" aria-labelledby="group-mid-heading">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-xl sm:p-10">
              <div className="mx-auto max-w-xl text-center">
                <h2 id="group-mid-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Não fique de fora da comunidade
                </h2>
                <p className="mt-3 text-base leading-relaxed text-emerald-50/90">
                  Entre no grupo para receber lembretes, materiais extras e tirar dúvidas com outros
                  participantes antes da aula começar.
                </p>
                <GroupJoinButton href={webinar.group_link!} prominent className="mt-8" />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* CTA final */}
      <section
        id={CTA_SECTION_ID}
        ref={ctaRef}
        className="scroll-mt-6 border-t border-white/10 bg-webinar-ink px-4 py-16 text-white sm:py-20"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-lg">
          {mode === "register" && onRegister ? (
            <>
              <div className="text-center">
                <h2 id="cta-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {ctaText}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-white/65">
                  Preencha abaixo e receba o link da transmissão na hora.
                </p>
                {!isLive && timeLeft > 0 && (
                  <p className="mt-2 text-sm font-medium text-webinar-accent">
                    Próxima sessão em {formatCountdown(timeLeft)}
                  </p>
                )}
              </div>

              <div className="mt-8 rounded-2xl bg-white p-6 text-foreground shadow-2xl shadow-black/30 sm:p-8">
                <LeadCaptureForm
                  fields={formFields}
                  onSubmit={onRegister}
                  loading={registerLoading}
                  embedded
                />
              </div>

              {hasGroup && (
                <div className="mt-8 space-y-3">
                  <p className="text-center text-sm text-white/50">Ou entre no grupo enquanto isso</p>
                  <GroupJoinButton href={webinar.group_link!} variant="on-dark" />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
                <Check className="size-8 text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <h2 id="cta-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Inscrição confirmada!
                </h2>
                <p className="mt-3 text-base leading-relaxed text-white/70">
                  {isLive
                    ? "A transmissão já está no ar. Entre no grupo para não perder nenhum aviso."
                    : "Fique de olho no horário e entre no grupo para receber lembretes e materiais exclusivos."}
                </p>
                <p className="mt-4 text-sm text-white/50">{describeSchedule(config)}</p>
              </div>

              {hasGroup && <GroupJoinButton href={webinar.group_link!} prominent />}
            </div>
          )}
        </div>
      </section>

      {showFooter && (
        <footer className="border-t border-border/60 bg-webinar-surface-alt px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
            {footer.text.trim() && (
              <p className="max-w-prose leading-relaxed whitespace-pre-line">{footer.text.trim()}</p>
            )}
            {footer.links.length > 0 && (
              <nav
                aria-label="Links do rodapé"
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
              >
                {footer.links.map((link, i) => (
                  <a
                    key={`${link.label}-${i}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground/75 underline-offset-4 transition-colors hover:text-webinar-accent hover:underline"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </footer>
      )}

      {/* Sticky mobile — uma ação clara */}
      {((mode === "register" && showStickyCta) || (mode === "waiting" && hasGroup)) && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-webinar-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_oklch(0_0_0/0.12)] backdrop-blur-lg sm:hidden"
          role="region"
          aria-label="Ação rápida"
        >
          {mode === "register" ? (
            <Button
              className="h-13 min-h-[3.25rem] w-full gap-2 rounded-xl bg-webinar-accent text-base font-bold hover:bg-webinar-accent/90"
              onClick={scrollToCta}
            >
              {ctaText}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            hasGroup && <GroupJoinButton href={webinar.group_link!} prominent compact />
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {lead && <p className="mt-2 text-base leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

function EventScheduleStrip({
  config,
  nextSessionStart,
  className,
}: {
  config: ReturnType<typeof toScheduleConfig>;
  nextSessionStart: Date;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/65", className)}>
      <span className="inline-flex items-center gap-2">
        <CalendarDays className="size-4 shrink-0 text-webinar-accent" aria-hidden />
        <span>
          <span className="font-medium text-white/90">{describeSchedule(config)}</span>
          <span className="mx-2 hidden text-white/30 sm:inline" aria-hidden>
            ·
          </span>
          <span className="mt-0.5 block sm:mt-0 sm:inline">
            {formatBrasiliaDateTimeLong(nextSessionStart)} · Brasília
          </span>
        </span>
      </span>
    </div>
  );
}

function GroupJoinButton({
  href,
  prominent = false,
  variant = "default",
  compact = false,
  className,
}: {
  href: string;
  prominent?: boolean;
  variant?: "default" | "on-dark";
  compact?: boolean;
  className?: string;
}) {
  const isOnDark = variant === "on-dark";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl text-left no-underline transition-transform active:scale-[0.98]",
        compact ? "p-3.5" : prominent ? "p-5 sm:p-6" : "p-4",
        isOnDark
          ? "bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
          : "bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 shadow-[0_16px_48px_-12px_rgba(16,185,129,0.55)] hover:shadow-[0_20px_56px_-12px_rgba(16,185,129,0.65)]",
        className,
      )}
    >
      {!isOnDark && (
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      )}
      <span className="relative flex items-center gap-4">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            compact ? "size-11" : prominent ? "size-14" : "size-12",
            isOnDark ? "bg-emerald-500/20 text-emerald-300" : "bg-white/20 text-white shadow-inner",
          )}
        >
          <Users className={cn(compact ? "size-5" : prominent ? "size-7" : "size-6")} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-bold leading-tight",
              compact ? "text-sm" : prominent ? "text-lg sm:text-xl" : "text-base",
              isOnDark ? "text-white" : "text-white",
            )}
          >
            Entrar no grupo exclusivo
          </span>
          <span
            className={cn(
              "mt-0.5 block leading-snug",
              compact ? "text-xs" : "text-sm",
              isOnDark ? "text-white/55" : "text-emerald-50/90",
            )}
          >
            Lembretes, materiais e comunidade antes da aula
          </span>
        </span>
        <ExternalLink
          className={cn(
            "shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            compact ? "size-4" : "size-5",
            isOnDark ? "text-white/70" : "text-white",
          )}
          aria-hidden
        />
      </span>
    </a>
  );
}

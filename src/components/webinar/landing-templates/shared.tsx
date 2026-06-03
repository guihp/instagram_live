import { useCallback, useEffect, useState, type ReactNode } from "react";

import { RegistrationModal } from "@/components/webinar/RegistrationModal";
import type { WebinarFormField } from "@/lib/supabase/database.types";
import { formatCountdown } from "@/lib/webinar/playback";

import type { LandingViewModel } from "./types";
import type { LandingTemplateProps } from "./types";

export function useLandingRegistration(
  props: LandingTemplateProps,
  model: LandingViewModel,
) {
  const { mode, onRegister } = props;
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    if (props.isPreview || mode !== "register" || !onRegister) return;
    const timer = window.setTimeout(() => setRegisterOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [props.isPreview, mode, onRegister]);

  const openRegistration = useCallback(() => setRegisterOpen(true), []);

  const registrationModal =
    mode === "register" && onRegister && !props.isPreview ? (
      <RegistrationModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        title={model.ctaText}
        webinarTitle={props.webinar.title}
        ctaText={model.ctaText}
        fields={props.formFields}
        onSubmit={onRegister}
        loading={props.registerLoading}
        timeLeft={model.timeLeft}
        scheduleLabel={model.scheduleSummary}
      />
    ) : null;

  return { registerOpen, openRegistration, registrationModal };
}

export function LandingTopBar({
  logoUrl,
  logoAlt = "Logo",
  ctaLabel,
  onCta,
}: {
  logoUrl: string;
  logoAlt?: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <header className="topbar">
      <div className="wrap">
        <a className="brand" href="#top">
          <img className="logo" src={logoUrl} alt={logoAlt} width={160} height={30} decoding="async" />
        </a>
        <button type="button" className="btn btn-ghost" onClick={onCta}>
          {ctaLabel}
        </button>
      </div>
    </header>
  );
}

export function LandingPill({ children }: { children: ReactNode }) {
  return (
    <span className="pill">
      <span className="dot" />
      {children}
    </span>
  );
}

export function LandingHeroMedia({ model }: { model: LandingViewModel }) {
  if (model.heroMedia === "none") return null;

  return (
    <div className="hero-media">
      <div className="media-frame">
        {model.heroMedia === "video" && model.promoVideoUrl ? (
          <video src={model.promoVideoUrl} controls playsInline preload="metadata" className="ph" />
        ) : model.heroMedia === "image" && model.heroImage ? (
          <img src={model.heroImage} alt="" className="ph" />
        ) : (
          <div className="ph" />
        )}
        {model.heroMedia === "video" && model.promoVideoUrl && (
          <div className="play" aria-hidden>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4l14 8-14 8z" />
            </svg>
          </div>
        )}
        <span className="ph-label">Preview da aula</span>
      </div>
      <p className="media-cap">Assista ao preview e veja o que te espera na aula.</p>
    </div>
  );
}

export function LandingCtaCard({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" className="cta-card" onClick={onClick}>
      <span className="ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
        </svg>
      </span>
      <span className="tx">
        <b>{compact ? "Entrar no grupo" : "Entrar no grupo exclusivo"}</b>
        <span>Lembretes, materiais e comunidade antes da aula</span>
      </span>
      <span className="go">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </button>
  );
}

export function GroupCtaLink({ href }: { href: string }) {
  return (
    <a className="cta-card" href={href} target="_blank" rel="noopener noreferrer">
      <span className="ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
        </svg>
      </span>
      <span className="tx">
        <b>Entrar no grupo exclusivo</b>
        <span>Lembretes, materiais e comunidade antes da aula</span>
      </span>
      <span className="go">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </a>
  );
}

export function LandingMeta({ model }: { model: LandingViewModel }) {
  return (
    <div className="meta">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <div className="meta-tx">
        <strong>{model.scheduleSummary}</strong>
        <span className="det">{model.nextSessionLabel}</span>
      </div>
    </div>
  );
}

export function benefitText(b: { title: string; description?: string }) {
  return b.description?.trim() || b.title;
}

export function LandingBenefitsGrid({ model }: { model: LandingViewModel }) {
  if (model.benefits.length === 0) return null;
  return (
    <section className="learn">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">O que você vai levar</span>
          <h2 className="section-title" style={{ marginTop: 14 }}>
            O que você vai aprender
          </h2>
          <p className="section-sub">Resultados reais que você pode aplicar ainda hoje — sem enrolação.</p>
        </div>
        <div className="grid-2">
          {model.benefits.map((b, i) => (
            <div className="card" key={i}>
              <span className="check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <p>{benefitText(b)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingBenefitsList({ model }: { model: LandingViewModel }) {
  if (model.benefits.length === 0) return null;
  return (
    <section className="learn">
      <span className="eyebrow">O que você vai levar</span>
      <h2 className="section-title">O que você vai aprender</h2>
      <p className="section-sub">Resultados reais que você pode aplicar ainda hoje — sem enrolação.</p>
      <ul className="check-list">
        {model.benefits.map((b, i) => (
          <li key={i}>
            <span className="check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <div>
              <p>{benefitText(b)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingTopicsGrid({ model }: { model: LandingViewModel }) {
  if (model.topics.length === 0) return null;
  return (
    <section className="steps">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Passo a passo</span>
          <h2 className="section-title" style={{ marginTop: 14 }}>
            Roteiro da aula
          </h2>
          <p className="section-sub">Cada minuto foi pensado para entregar valor e clareza.</p>
        </div>
        <div className="grid-3">
          {model.topics.map((topic, i) => (
            <div className="card" key={i}>
              <span className="num">{i + 1}</span>
              <div>
                <p>{topic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingTopicsTimeline({ model }: { model: LandingViewModel }) {
  if (model.topics.length === 0) return null;
  return (
    <section className="steps">
      <span className="eyebrow">Passo a passo</span>
      <h2 className="section-title">Roteiro da aula</h2>
      <p className="section-sub">Cada minuto foi pensado para entregar valor e clareza.</p>
      <ol className="timeline">
        {model.topics.map((topic, i) => (
          <li key={i}>
            <span className="node">{i + 1}</span>
            <div className="step-t">{topic}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function LandingTopicsRoteiro({ model }: { model: LandingViewModel }) {
  if (model.topics.length === 0) return null;
  return (
    <section id="roteiro">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Passo a passo</span>
          <h2 className="section-title">Roteiro da aula</h2>
          <p className="section-sub">Cada minuto foi pensado para entregar valor e clareza.</p>
        </div>
        <div className="roteiro-panel">
          <div className="roteiro-list">
            {model.topics.map((topic, i) => (
              <div className="row" key={i}>
                <span className="num">{i + 1}</span>
                <span className="t">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingAudience({ model, variant }: { model: LandingViewModel; variant?: "card" | "panel" }) {
  if (model.audience.length === 0) return null;
  const inner = (
    <>
      <span className="eyebrow">Esta aula é pra quem?</span>
      <h2 className="section-title" style={{ marginTop: variant === "card" ? 14 : undefined }}>
        Feito para você se…
      </h2>
      <p className="section-sub">Se bate com o seu momento, não perca esta aula.</p>
      <ul className="audience-list">
        {model.audience.map((line, i) => (
          <li key={i}>
            <span className="b" />
            {line}
          </li>
        ))}
      </ul>
    </>
  );

  if (variant === "panel") {
    return (
      <section>
        <div className="wrap">
          <div className="section-head">{inner}</div>
          <div className="audience-panel">{inner}</div>
        </div>
      </section>
    );
  }

  if (variant === "card") {
    return (
      <section>
        <div className="wrap">
          <div className="audience-card">{inner}</div>
        </div>
      </section>
    );
  }

  return <section>{inner}</section>;
}

export function LandingHostClassic({ model }: { model: LandingViewModel }) {
  if (!model.hostName && !model.hostBio) return null;
  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <h2 className="section-title">Quem conduz a aula</h2>
        </div>
        <div className="card host-card">
          <HostAvatar model={model} />
          <div>
            {model.hostTitle && <span className="role">{model.hostTitle}</span>}
            {model.hostBio && <p className="bio">{model.hostBio}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingHostCentered({ model }: { model: LandingViewModel }) {
  if (!model.hostName && !model.hostBio) return null;
  return (
    <section>
      <div className="wrap">
        <div className="host">
          <HostAvatar model={model} large />
          <span className="role">
            {model.hostTitle ? `${model.hostTitle} · Quem conduz a aula` : "Quem conduz a aula"}
          </span>
          {model.hostName && <div className="name">{model.hostName}</div>}
          {model.hostBio && <p className="bio">{model.hostBio}</p>}
        </div>
      </div>
    </section>
  );
}

function HostAvatar({ model, large }: { model: LandingViewModel; large?: boolean }) {
  const src = model.hostImage ?? model.hostImageFallback;
  return (
    <div className={large ? "avatar" : "avatar"}>
      {src ? (
        <img src={src} alt={model.hostName || "Apresentador"} />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
        </svg>
      )}
    </div>
  );
}

export function LandingCommunity({ model, onCta }: { model: LandingViewModel; onCta: () => void }) {
  if (!model.hasGroup) return null;
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="community">
          <h2>Não fique de fora da comunidade</h2>
          <p>
            Entre no grupo para receber lembretes, materiais extras e tirar dúvidas com outros participantes
            antes da aula começar.
          </p>
          {model.groupLink ? (
            <GroupCtaLink href={model.groupLink} />
          ) : (
            <LandingCtaCard onClick={onCta} />
          )}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({ model }: { model: LandingViewModel }) {
  if (!model.showFooter) return null;
  const yt = model.footer.links.find((l) => /youtube/i.test(l.label + l.url));
  return (
    <footer className="footer">
      <div className="wrap">
        {model.footer.text.trim() && <span className="copy">{model.footer.text.trim()}</span>}
        {yt && (
          <a className="yt" href={yt.url} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1C5 19 12 19 12 19s7 0 8.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.4 12 31 31 0 0 0 23 7.5ZM9.8 15.3V8.7l5.7 3.3z" />
            </svg>
            {yt.label.toUpperCase()}
          </a>
        )}
        {model.footer.links
          .filter((l) => l !== yt)
          .map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="yt">
              {link.label}
            </a>
          ))}
      </div>
    </footer>
  );
}

export function LandingConfirmScreen({
  model,
  mode,
  onBack,
}: {
  model: LandingViewModel;
  mode: "register" | "waiting";
  onBack?: () => void;
}) {
  if (mode !== "waiting") return null;

  return (
    <div className="confirm" style={{ display: "grid" }}>
      <div className="confirm-inner">
        <div className="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2>Inscrição confirmada!</h2>
        <p>
          {model.isLive
            ? "A transmissão já está no ar. Entre no grupo para não perder nenhum aviso."
            : "Fique de olho no horário e entre no grupo para receber lembretes e materiais exclusivos."}
        </p>
        <div className="sched">{model.scheduleSummary.toUpperCase()}</div>
        {model.hasGroup && model.groupLink && <GroupCtaLink href={model.groupLink} />}
        {onBack && (
          <div>
            <button type="button" className="back" onClick={onBack}>
              ← Voltar para a página
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LandingCountdownBadge({ model }: { model: LandingViewModel }) {
  if (model.isLive || model.timeLeft <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)]">
      Começa em <strong className="font-mono tabular-nums">{formatCountdown(model.timeLeft)}</strong>
    </span>
  );
}

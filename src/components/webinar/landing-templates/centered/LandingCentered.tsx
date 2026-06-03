import { LandingShell } from "../LandingShell";
import {
  LandingConfirmScreen,
  LandingFooter,
  LandingHostCentered,
  LandingPill,
  LandingTopBar,
  LandingTopicsRoteiro,
  useLandingRegistration,
} from "../shared";
import { useLandingModel } from "../use-landing-model";
import type { LandingTemplateProps } from "../types";

import "../styles/centered.css";

const BENE_ICONS = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="12" r="3" />
    <path d="M9 6h3a3 3 0 0 1 3 3M9 18h3a3 3 0 0 0 3-3" />
  </svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 3v18M5 3l14 7-9 3-2 7z" />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 7V4h6v3M9 17v3h6v-3M7 9H4v6h3M17 9h3v6h-3M9 12h6" />
  </svg>,
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>,
  <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m12 3 1.9 4.8L19 9.5l-4.1 3.2L16 18l-4-2.8L8 18l1.1-5.3L5 9.5l5.1-1.7z" />
  </svg>,
];

export function LandingCentered(props: LandingTemplateProps) {
  const model = useLandingModel(props.webinar, props.mode);
  const { openRegistration, registrationModal } = useLandingRegistration(props, model);

  if (props.mode === "waiting") {
    return (
      <LandingShell templateClass="tpl-centered" theme={model.theme}>
        <LandingConfirmScreen model={model} mode={props.mode} />
        {registrationModal}
      </LandingShell>
    );
  }

  return (
    <LandingShell templateClass="tpl-centered" theme={model.theme}>
      <LandingTopBar logoUrl={model.logoUrl} ctaLabel="Quero participar" onCta={openRegistration} />

      <main id="top">
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-grid-tex" />
          <div className="wrap">
            <LandingPill>AULA GRATUITA · AO VIVO</LandingPill>
            <h1>{model.heroTitle}</h1>
            <p className="lead">{model.heroSubtitle}</p>
            <div className="hero-actions">
              <button type="button" className="btn btn-cta" onClick={openRegistration}>
                {model.ctaText}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <a className="btn btn-ghost" href="#roteiro">
                Ver o roteiro
              </a>
            </div>
            <div className="hero-meta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {model.nextSessionLabel} — {model.scheduleSummary}
            </div>
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
          </div>
        </section>

        {model.stats.length > 0 && (
          <div className="stats">
            <div className="wrap">
              {model.stats.map((stat, i) => (
                <div className="item" key={i}>
                  <div className="n">{stat.value}</div>
                  <div className="l">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {model.benefits.length > 0 && (
          <section>
            <div className="wrap">
              <div className="section-head">
                <span className="eyebrow">O que você vai levar</span>
                <h2 className="section-title">O que você vai aprender</h2>
                <p className="section-sub">Resultados reais que você pode aplicar ainda hoje — sem enrolação.</p>
              </div>
              <div className="bene-grid">
                {model.benefits.map((b, i) => (
                  <div className="bene" key={i}>
                    <span className="ic">{BENE_ICONS[i % BENE_ICONS.length]}</span>
                    <p>{b.description?.trim() || b.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <LandingTopicsRoteiro model={model} />

        <section>
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Esta aula é pra quem?</span>
              <h2 className="section-title">Feito para você se…</h2>
              <p className="section-sub">Se bate com o seu momento, não perca esta aula.</p>
            </div>
            {model.audience.length > 0 && (
              <div className="audience-panel">
                <ul className="audience-list">
                  {model.audience.map((line, i) => (
                    <li key={i}>
                      <span className="b" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <LandingHostCentered model={model} />

        <section>
          <div className="wrap">
            <div className="final">
              <h2>Não fique de fora da comunidade</h2>
              <p>
                Garanta sua vaga gratuita, entre no grupo e receba lembretes, materiais extras e tire dúvidas
                com outros participantes antes da aula começar.
              </p>
              <button type="button" className="btn btn-cta" onClick={openRegistration}>
                {model.ctaText}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <div className="sub2">
                Vagas limitadas · 100% gratuito · {model.scheduleSummary}
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter model={model} />
      {registrationModal}
    </LandingShell>
  );
}

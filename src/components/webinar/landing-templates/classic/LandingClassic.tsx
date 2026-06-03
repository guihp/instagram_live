import { LandingShell } from "../LandingShell";
import {
  GroupCtaLink,
  LandingAudience,
  LandingBenefitsGrid,
  LandingCommunity,
  LandingConfirmScreen,
  LandingCtaCard,
  LandingFooter,
  LandingHeroMedia,
  LandingHostClassic,
  LandingMeta,
  LandingPill,
  LandingTopBar,
  LandingTopicsGrid,
  useLandingRegistration,
} from "../shared";
import { useLandingModel } from "../use-landing-model";
import type { LandingTemplateProps } from "../types";

import "../styles/classic.css";

export function LandingClassic(props: LandingTemplateProps) {
  const model = useLandingModel(props.webinar, props.mode);
  const { openRegistration, registrationModal } = useLandingRegistration(props, model);

  const handleCta = () => {
    if (props.mode === "register") openRegistration();
    else if (model.hasGroup && model.groupLink) window.open(model.groupLink, "_blank", "noopener,noreferrer");
  };

  if (props.mode === "waiting") {
    return (
      <LandingShell templateClass="tpl-classic" theme={model.theme}>
        <LandingConfirmScreen model={model} mode={props.mode} />
        {registrationModal}
      </LandingShell>
    );
  }

  return (
    <LandingShell templateClass="tpl-classic" theme={model.theme}>
      <LandingTopBar
        logoUrl={model.logoUrl}
        ctaLabel={model.hasGroup ? "Entrar no grupo" : model.ctaText}
        onCta={handleCta}
      />

      <main id="top">
        <section className="hero">
          <div className="hero-glow" />
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-content">
                <LandingPill>AULA GRATUITA · AO VIVO</LandingPill>
                <h1 className="h-display">{model.heroTitle}</h1>
                <p className="lead">{model.heroSubtitle}</p>
                <LandingMeta model={model} />
                {model.hasGroup && model.groupLink ? (
                  <GroupCtaLink href={model.groupLink} />
                ) : (
                  <LandingCtaCard onClick={openRegistration} />
                )}
              </div>
              <LandingHeroMedia model={model} />
            </div>
          </div>
        </section>

        <div className="strip">
          <div className="wrap">
            <div className="item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m12 3 1.9 4.8L19 9.5l-4.1 3.2L16 18l-4-2.8L8 18l1.1-5.3L5 9.5l5.1-1.7z" />
              </svg>
              Conteúdo prático e direto ao ponto
            </div>
            <div className="item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
              Comunidade ativa de participantes
            </div>
            <div className="item dim">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {model.nextSessionLabel}
            </div>
          </div>
        </div>

        <LandingBenefitsGrid model={model} />
        <LandingTopicsGrid model={model} />
        <LandingAudience model={model} variant="card" />
        <LandingHostClassic model={model} />
        <LandingCommunity model={model} onCta={handleCta} />
      </main>

      <LandingFooter model={model} />
      {registrationModal}
    </LandingShell>
  );
}

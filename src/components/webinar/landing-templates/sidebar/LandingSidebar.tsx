import { LandingShell } from "../LandingShell";
import {
  GroupCtaLink,
  LandingBenefitsList,
  LandingCommunity,
  LandingConfirmScreen,
  LandingCtaCard,
  LandingFooter,
  LandingHeroMedia,
  LandingHostClassic,
  LandingPill,
  LandingTopBar,
  LandingTopicsTimeline,
  useLandingRegistration,
} from "../shared";
import { useLandingModel } from "../use-landing-model";
import type { LandingTemplateProps } from "../types";

import "../styles/sidebar.css";

export function LandingSidebar(props: LandingTemplateProps) {
  const model = useLandingModel(props.webinar, props.mode);
  const { openRegistration, registrationModal } = useLandingRegistration(props, model);

  const handleCta = () => {
    if (props.mode === "register") openRegistration();
    else if (model.hasGroup && model.groupLink) window.open(model.groupLink, "_blank", "noopener,noreferrer");
  };

  if (props.mode === "waiting") {
    return (
      <LandingShell templateClass="tpl-sidebar" theme={model.theme}>
        <LandingConfirmScreen model={model} mode={props.mode} />
        {registrationModal}
      </LandingShell>
    );
  }

  return (
    <LandingShell templateClass="tpl-sidebar" theme={model.theme}>
      <LandingTopBar logoUrl={model.logoUrl} ctaLabel={model.ctaText} onCta={handleCta} />

      <main id="top">
        <section className="hero">
          <div className="hero-glow" />
          <div className="wrap">
            <div className="hero-top">
              <LandingPill>AULA GRATUITA · AO VIVO</LandingPill>
              <h1>{model.heroTitle}</h1>
              <p className="lead">{model.heroSubtitle}</p>
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
            <p className="media-cap">Assista ao preview e veja o que te espera na aula.</p>
          </div>
        </section>

        <div className="wrap">
          <div className="reg-grid">
            <aside className="reg-aside">
              <div className="reg-card">
                <LandingPill>AO VIVO · GRATUITO</LandingPill>
                <div className="when">
                  <div className="lbl">Próxima aula</div>
                  <div className="big">{model.nextSessionLabel.split(" · ")[0]}</div>
                  <div className="det">
                    {model.nextSessionLabel} — {model.scheduleSummary}
                  </div>
                </div>
                {model.hasGroup && model.groupLink ? (
                  <GroupCtaLink href={model.groupLink} />
                ) : (
                  <LandingCtaCard onClick={openRegistration} />
                )}
                <ul className="trust">
                  <li>Conteúdo prático e direto ao ponto</li>
                  <li>Comunidade ativa de participantes</li>
                  <li>Vaga gratuita — entre antes de começar</li>
                </ul>
              </div>
            </aside>

            <div className="reg-main">
              <LandingBenefitsList model={model} />
              <LandingTopicsTimeline model={model} />
              <section>
                <span className="eyebrow">Esta aula é pra quem?</span>
                <h2 className="section-title">Feito para você se…</h2>
                <p className="section-sub">Se bate com o seu momento, não perca esta aula.</p>
                {model.audience.length > 0 && (
                  <ul className="audience-list">
                    {model.audience.map((line, i) => (
                      <li key={i}>
                        <span className="b" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <span className="eyebrow">Quem conduz</span>
                <h2 className="section-title">Quem conduz a aula</h2>
                <div className="host-card">
                  {model.hostImage || model.hostImageFallback ? (
                    <div className="avatar">
                      <img
                        src={model.hostImage ?? model.hostImageFallback ?? undefined}
                        alt={model.hostName}
                      />
                    </div>
                  ) : (
                    <div className="avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
                      </svg>
                    </div>
                  )}
                  <div>
                    {model.hostTitle && <span className="role">{model.hostTitle}</span>}
                    {model.hostBio && <p className="bio">{model.hostBio}</p>}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="wrap community-wrap">
          <LandingCommunity model={model} onCta={handleCta} />
        </div>
      </main>

      <LandingFooter model={model} />
      {registrationModal}
    </LandingShell>
  );
}

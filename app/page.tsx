'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminHoldLogin from '@/components/AdminHoldLogin';

type Lang = 'en' | 'es';

type InfoCard = {
  title: string;
  text: string;
};

type StepCard = {
  title: string;
  text: string;
};

const OWNER_LANG_KEY = 'orda_owner_language';

const content = {
  en: {
    navHow: 'How it works',
    navPricing: 'Pricing',
    navCreate: 'Create Account',
    pill: 'Built for real food businesses',
    heroTitle: 'ORDA builds and turns your menu into a website in minutes',
    heroText:
      'Made for restaurants, food trucks, pop-ups, and caterers that want a cleaner direct-ordering experience without building everything themselves.',
    startFree: 'Start Free',
    builtTitle: 'Built for real food businesses',
    builtText:
      'A direct-ordering platform that feels premium, alive, and made for restaurants, food trucks, pop-ups, and caterers that want customers ordering directly.',
    systemTitle: 'Your system, fully built for you.',
    systemText:
      'Everything you need to take orders, present your brand, and run your business — already built, clean, mobile-first, and ready to go.',
    pricingEyebrow: 'Pricing',
    pricingTitle: 'Simple pricing that grows with you',
    starter: 'Starter',
    starterTop: 'First month free',
    starterPrice: 'Then $19/month',
    starterFee: '10% platform fee',
    growth: 'Growth',
    growthTop: '$49/month',
    growthFee: '5% platform fee',
    premium: 'Premium',
    premiumTop: '$99/month',
    premiumFee: '3% platform fee',
    mostPopular: 'Most Popular',
    getStarted: 'Get Started',
    chooseGrowth: 'Choose Growth',
    goPremium: 'Go Premium',
    showcaseEyebrow: 'Made to feel real',
    showcaseTitle: 'A storefront that feels like a real business, not a basic page.',
    showcaseText:
      'ORDA gives restaurants, food trucks, pop-ups, and caterers a cleaner, stronger online presence with direct ordering built in.',
    cards: [
      {
        title: 'Restaurant-ready presentation',
        text: 'Clean visuals, strong branding, and a more premium first impression for dine-in, pickup, and direct-order customers.',
      },
      {
        title: 'Perfect for food trucks and pop-ups',
        text: 'Give customers one clean link to order fast, find you, and trust the brand from their phone.',
      },
      {
        title: 'Built for catering and repeat business',
        text: 'Present your menu, booking flow, and ordering experience in a way that feels professional and ready to scale.',
      },
    ] as InfoCard[],
    howEyebrow: 'How it works',
    howTitle: 'You enter the info. ORDA generates the rest.',
    steps: [
      {
        title: 'Enter your business information',
        text: 'Add your business name, menu, photos, phone number, location, and brand details.',
      },
      {
        title: 'ORDA generates your storefront',
        text: 'Your menu, presentation, checkout, and direct-ordering flow are created for you automatically.',
      },
      {
        title: 'Start taking direct orders',
        text: 'Share your link and start accepting orders through your own branded system.',
      },
    ] as StepCard[],
    finalTitle: 'Launch your ordering system without building it yourself.',
    finalText:
      'ORDA turns your menu into a clean, premium ordering experience in minutes for restaurants, food trucks, pop-ups, and caterers.',
  },
  es: {
    navHow: 'Cómo funciona',
    navPricing: 'Precios',
    navCreate: 'Crear Cuenta',
    pill: 'Hecho para negocios reales de comida',
    heroTitle: 'ORDA crea y convierte tu menú en un sitio web en minutos',
    heroText:
      'Hecho para restaurantes, food trucks, pop-ups y catering que quieren una experiencia de pedidos directos más limpia sin tener que construir todo por su cuenta.',
    startFree: 'Empieza Gratis',
    builtTitle: 'Hecho para negocios reales de comida',
    builtText:
      'Una plataforma de pedidos directos que se siente premium, viva y hecha para restaurantes, food trucks, pop-ups y catering que quieren que sus clientes ordenen directamente.',
    systemTitle: 'Tu sistema, completamente hecho para ti.',
    systemText:
      'Todo lo que necesitas para tomar pedidos, presentar tu marca y operar tu negocio — ya construido, limpio, mobile-first y listo para usar.',
    pricingEyebrow: 'Precios',
    pricingTitle: 'Precios simples que crecen contigo',
    starter: 'Starter',
    starterTop: 'Primer mes gratis',
    starterPrice: 'Después $19/mes',
    starterFee: 'Tarifa de plataforma de 10%',
    growth: 'Growth',
    growthTop: '$49/mes',
    growthFee: 'Tarifa de plataforma de 5%',
    premium: 'Premium',
    premiumTop: '$99/mes',
    premiumFee: 'Tarifa de plataforma de 3%',
    mostPopular: 'Más Popular',
    getStarted: 'Comenzar',
    chooseGrowth: 'Elegir Growth',
    goPremium: 'Ir Premium',
    showcaseEyebrow: 'Hecho para sentirse real',
    showcaseTitle: 'Una tienda que se siente como un negocio real, no una página básica.',
    showcaseText:
      'ORDA les da a restaurantes, food trucks, pop-ups y catering una presencia online más limpia y fuerte con pedidos directos integrados.',
    cards: [
      {
        title: 'Presentación lista para restaurante',
        text: 'Visuales limpios, marca fuerte y una primera impresión más premium para clientes de mesa, pickup y pedidos directos.',
      },
      {
        title: 'Perfecto para food trucks y pop-ups',
        text: 'Dales a los clientes un solo enlace limpio para ordenar rápido, encontrarte y confiar en la marca desde su teléfono.',
      },
      {
        title: 'Hecho para catering y ventas repetidas',
        text: 'Presenta tu menú, tu flujo de reserva y tu experiencia de pedidos de una manera que se sienta profesional y lista para crecer.',
      },
    ] as InfoCard[],
    howEyebrow: 'Cómo funciona',
    howTitle: 'Tú ingresas la información. ORDA genera lo demás.',
    steps: [
      {
        title: 'Ingresa la información de tu negocio',
        text: 'Agrega el nombre de tu negocio, menú, fotos, número de teléfono, ubicación y detalles de tu marca.',
      },
      {
        title: 'ORDA genera tu tienda',
        text: 'Tu menú, presentación, checkout y flujo de pedidos directos se crean automáticamente.',
      },
      {
        title: 'Empieza a recibir pedidos directos',
        text: 'Comparte tu enlace y empieza a aceptar pedidos a través de tu propio sistema de marca.',
      },
    ] as StepCard[],
    finalTitle: 'Lanza tu sistema de pedidos sin tener que construirlo tú mismo.',
    finalText:
      'ORDA convierte tu menú en una experiencia de pedidos limpia y premium en minutos para restaurantes, food trucks, pop-ups y catering.',
  },
} as const;

const heroImage = '/orda-hero-kitchen.png';

const showcaseImages = [
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=90',
];

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'es';
}

function saveOwnerLanguage(nextLang: Lang) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(OWNER_LANG_KEY, nextLang);
  window.localStorage.setItem('orda_language', nextLang);
  window.localStorage.setItem('orda_order_language', nextLang);

  document.cookie = `orda_owner_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `orda_order_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
}

function getSavedOwnerLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';

  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');

  if (isLang(queryLang)) {
    saveOwnerLanguage(queryLang);
    return queryLang;
  }

  const saved = window.localStorage.getItem(OWNER_LANG_KEY);

  if (isLang(saved)) return saved;

  return 'en';
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = getSavedOwnerLanguage();
    setLang(saved);
    saveOwnerLanguage(saved);
  }, []);

  const t = content[lang];

  const links = useMemo(() => {
    const query = `lang=${lang}&owner_language=${lang}&order_language=${lang}`;

    return {
      signupStarter: `/auth/signup?plan=starter&${query}`,
      signupBase: `/auth/signup?${query}`,
      checkoutGrowth: `/auth/checkout?plan=growth&${query}`,
      checkoutPremium: `/auth/checkout?plan=premium&${query}`,
    };
  }, [lang]);

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    saveOwnerLanguage(nextLang);
  }

  return (
    <main className="page">
      <header className="header">
        <div className="headerInner">
          <div className="logoArea">
            <AdminHoldLogin>
              <Link href="/" className="logoWrap" aria-label="ORDA home">
                <img src="/orda-logo-new.png" alt="ORDA" className="logoImage" />
              </Link>
            </AdminHoldLogin>
          </div>

          <nav className="headerRight" aria-label="Main navigation">
            <a href="#how" className="navLink">
              {t.navHow}
            </a>

            <a href="#pricing" className="navLink">
              {t.navPricing}
            </a>

            <div className="langWrap" aria-label="Language switcher">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={lang === 'en' ? 'langButton active' : 'langButton'}
              >
                EN
              </button>

              <button
                type="button"
                onClick={() => changeLanguage('es')}
                className={lang === 'es' ? 'langButton active' : 'langButton'}
              >
                ES
              </button>
            </div>

            <Link href={links.signupBase} className="navButton" onClick={() => saveOwnerLanguage(lang)}>
              {t.navCreate}
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <img src={heroImage} alt="Chef cooking in a premium restaurant kitchen" className="heroImage" />
        <div className="heroOverlay" />
        <div className="heroShadow" />

        <div className="heroContent">
          <div className="pill">{t.pill}</div>
          <h1 className="heroTitle">{t.heroTitle}</h1>
          <p className="heroText">{t.heroText}</p>

          <div className="heroButtons">
            <Link href={links.signupStarter} className="primaryBtn" onClick={() => saveOwnerLanguage(lang)}>
              <span>{t.startFree}</span>
              <span className="arrow">›</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="introBand">
        <div className="container introGrid">
          <article className="introItem">
            <div className="introIcon">▤</div>
            <div>
              <h2 className="introTitle">{t.builtTitle}</h2>
              <p className="introText">{t.builtText}</p>
            </div>
          </article>

          <article className="introItem bordered">
            <div className="introIcon">⌁</div>
            <div>
              <h2 className="introTitle">{t.systemTitle}</h2>
              <p className="introText">{t.systemText}</p>
            </div>
          </article>
        </div>
      </section>

      <section id="pricing" className="pricingSection">
        <div className="container">
          <div className="smallCenter">
            <div className="eyebrow">{t.pricingEyebrow}</div>
            <h2 className="sectionTitle">{t.pricingTitle}</h2>
          </div>

          <div className="pricingGrid">
            <article className="priceCard">
              <div className="priceBody">
                <h3 className="priceName">{t.starter}</h3>
                <div className="priceTop">{t.starterTop}</div>
                <div className="priceSub">{t.starterPrice}</div>
                <div className="priceDivider" />
                <div className="priceFee">{t.starterFee}</div>
              </div>

              <Link href={links.signupStarter} className="cardBtn" onClick={() => saveOwnerLanguage(lang)}>
                {t.getStarted}
              </Link>
            </article>

            <article className="priceCard featured silverGrowthCard">
              <div className="priceBody">
                <div className="badge">{t.mostPopular}</div>
                <h3 className="priceName featuredText">{t.growth}</h3>
                <div className="priceTop featuredText">{t.growthTop}</div>
                <div className="priceDivider silverLine" />
                <div className="priceFee featuredText mutedSilver">{t.growthFee}</div>
              </div>

              <Link href={links.checkoutGrowth} className="cardBtnGrowth" onClick={() => saveOwnerLanguage(lang)}>
                {t.chooseGrowth}
              </Link>
            </article>

            <article className="priceCard">
              <div className="priceBody">
                <h3 className="priceName">{t.premium}</h3>
                <div className="priceTop">{t.premiumTop}</div>
                <div className="priceDivider" />
                <div className="priceFee">{t.premiumFee}</div>
              </div>

              <Link href={links.checkoutPremium} className="cardBtn" onClick={() => saveOwnerLanguage(lang)}>
                {t.goPremium}
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="showcaseSection">
        <div className="container">
          <div className="smallCenter">
            <div className="eyebrow">{t.showcaseEyebrow}</div>
            <h2 className="sectionTitle">{t.showcaseTitle}</h2>
            <p className="sectionText">{t.showcaseText}</p>
          </div>

          <div className="imageGrid">
            {showcaseImages.map((src, index) => (
              <article key={src} className="imageCard">
                <img src={src} alt={t.cards[index].title} className="imageCardImg" />

                <div className="imageCardBody">
                  <h3 className="imageCardTitle">{t.cards[index].title}</h3>
                  <p className="imageCardText">{t.cards[index].text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="howSection">
        <div className="container">
          <div className="smallCenter">
            <div className="eyebrow">{t.howEyebrow}</div>
            <h2 className="sectionTitle">{t.howTitle}</h2>
          </div>

          <div className="stepGrid">
            {t.steps.map((step, index) => (
              <article key={step.title} className="stepCard">
                <div className="stepNumber">{index + 1}</div>
                <div className="stepContent">
                  <h3 className="stepTitle">{step.title}</h3>
                  <p className="stepText">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="finalSection">
        <div className="container">
          <div className="finalCard">
            <div>
              <h2 className="finalTitle">{t.finalTitle}</h2>
              <p className="finalText">{t.finalText}</p>
            </div>

            <Link href={links.signupStarter} className="finalBtn" onClick={() => saveOwnerLanguage(lang)}>
              <span>{t.startFree}</span>
              <span className="arrow">›</span>
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page {
          background: #f8f8f5;
          color: #111827;
          min-height: 100vh;
          overflow-x: hidden;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(248, 248, 245, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
        }

        .headerInner {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 15px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .logoArea {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .logoWrap {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          cursor: pointer;
        }

        .logoImage {
          width: 176px;
          height: auto;
          display: block;
          object-fit: contain;
        }

        .headerRight {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 22px;
          flex-wrap: wrap;
        }

        .navLink {
          text-decoration: none;
          color: #1f2937;
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -0.01em;
        }

        .navLink:hover {
          color: #000000;
        }

        .langWrap {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(17, 24, 39, 0.12);
          border-radius: 14px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }

        .langButton {
          appearance: none;
          border: none;
          min-width: 44px;
          height: 38px;
          border-radius: 10px;
          background: transparent;
          color: #1f2937;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
        }

        .langButton.active {
          background: #101820;
          color: #ffffff;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
        }

        .navButton,
        .primaryBtn,
        .cardBtn,
        .cardBtnGrowth,
        .finalBtn {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 850;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .navButton {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 12px;
          background: #ffffff;
          color: #111827;
          border: 1px solid rgba(17, 24, 39, 0.12);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
        }

        .navButton:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
        }

        .hero {
          min-height: 82svh;
          position: relative;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: #05070a;
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          transform: scale(1.02);
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 76% 40%, rgba(255, 255, 255, 0.06), transparent 26%),
            linear-gradient(90deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.48) 46%, rgba(0, 0, 0, 0.16) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.62) 100%);
        }

        .heroShadow {
          position: absolute;
          inset: auto 0 0;
          height: 36%;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.78) 100%);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 118px 18px 72px;
          color: #ffffff;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-height: 38px;
          padding: 0 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .heroTitle {
          margin: 22px 0 0;
          max-width: 760px;
          font-size: clamp(44px, 7vw, 78px);
          line-height: 0.96;
          font-weight: 950;
          letter-spacing: -0.06em;
          text-wrap: balance;
          text-shadow: 0 2px 22px rgba(0, 0, 0, 0.28);
        }

        .heroText {
          margin: 22px 0 0;
          max-width: 620px;
          font-size: clamp(17px, 1.8vw, 21px);
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.92);
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.24);
        }

        .heroButtons {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .primaryBtn {
          min-height: 56px;
          padding: 0 28px;
          border-radius: 12px;
          background: #ffffff;
          color: #111827;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
        }

        .primaryBtn:hover,
        .finalBtn:hover,
        .cardBtn:hover,
        .cardBtnGrowth:hover {
          transform: translateY(-2px);
        }

        .arrow {
          font-size: 28px;
          line-height: 1;
          transform: translateY(-1px);
        }

        .container {
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 18px;
        }

        .introBand {
          background: #f8f8f5;
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
        }

        .introGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }

        .introItem {
          min-height: 180px;
          display: grid;
          grid-template-columns: 84px 1fr;
          gap: 26px;
          align-items: center;
          padding: 34px 34px 34px 0;
        }

        .introItem.bordered {
          border-left: 1px solid rgba(17, 24, 39, 0.14);
          padding-left: 34px;
          padding-right: 0;
        }

        .introIcon {
          width: 72px;
          height: 72px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #0f1720;
          color: #d8b177;
          font-size: 30px;
          font-weight: 900;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.14);
        }

        .introTitle {
          margin: 0;
          color: #111827;
          font-size: 24px;
          line-height: 1.16;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .introText {
          margin: 10px 0 0;
          color: #374151;
          font-size: 16px;
          line-height: 1.65;
        }

        .pricingSection,
        .showcaseSection,
        .howSection,
        .finalSection {
          padding: 64px 0;
          background: #f8f8f5;
        }

        .showcaseSection,
        .finalSection {
          background: #f1f2ef;
        }

        .smallCenter {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }

        .eyebrow {
          color: #bd8b50;
          font-size: 13px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: 0.19em;
          text-transform: uppercase;
        }

        .sectionTitle {
          margin: 12px 0 0;
          color: #111827;
          font-size: clamp(32px, 5vw, 50px);
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .sectionText {
          margin: 16px auto 0;
          max-width: 820px;
          color: #374151;
          font-size: 17px;
          line-height: 1.75;
        }

        .pricingGrid {
          margin-top: 34px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px;
          align-items: stretch;
        }

        .priceCard {
          min-height: 298px;
          padding: 28px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(17, 24, 39, 0.1);
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
        }

        .priceBody {
          display: flex;
          flex-direction: column;
        }

        .priceName {
          margin: 0;
          color: #111827;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.035em;
        }

        .priceTop {
          margin-top: 14px;
          color: #111827;
          font-size: clamp(31px, 4vw, 42px);
          line-height: 1.03;
          font-weight: 950;
          letter-spacing: -0.055em;
        }

        .priceSub {
          margin-top: 8px;
          color: #374151;
          font-size: 17px;
          font-weight: 650;
        }

        .priceDivider {
          width: 100%;
          height: 1px;
          background: rgba(17, 24, 39, 0.1);
          margin: 22px 0 0;
        }

        .priceFee {
          margin-top: 18px;
          color: #374151;
          font-size: 16px;
          line-height: 1.5;
          font-weight: 700;
        }

        .cardBtn,
        .cardBtnGrowth {
          width: 100%;
          min-height: 48px;
          border-radius: 8px;
          padding: 0 16px;
          font-size: 15px;
        }

        .cardBtn {
          background: #0f1720;
          color: #ffffff;
        }

        .cardBtnGrowth {
          background: linear-gradient(145deg, #ffffff 0%, #f3f4f6 45%, #e5e7eb 100%);
          color: #111827;
          border: 1px solid rgba(17, 24, 39, 0.12);
          box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.84),
            0 8px 18px rgba(15, 23, 42, 0.1);
        }

        .featured {
          transform: translateY(-10px);
        }

        .silverGrowthCard {
          background:
            radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.9), transparent 24%),
            linear-gradient(
              145deg,
              #ffffff 0%,
              #eef0f2 18%,
              #c9ced4 35%,
              #8f98a3 52%,
              #d7dbe0 72%,
              #ffffff 100%
            );
          border: 1px solid rgba(115, 125, 137, 0.65);
          color: #111827;
          box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.92),
            inset 0 -4px 10px rgba(0, 0, 0, 0.16),
            0 24px 54px rgba(15, 23, 42, 0.15);
        }

        .badge {
          width: fit-content;
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: #111827;
          border: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.86),
            0 6px 14px rgba(15, 23, 42, 0.08);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .featuredText {
          color: #111827;
        }

        .mutedSilver {
          color: #1f2937;
        }

        .silverLine {
          background: rgba(17, 24, 39, 0.18);
        }

        .imageGrid {
          margin-top: 34px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 26px;
        }

        .imageCard {
          overflow: hidden;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid rgba(17, 24, 39, 0.1);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
        }

        .imageCardImg {
          width: 100%;
          height: 188px;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .imageCardBody {
          padding: 18px;
        }

        .imageCardTitle {
          margin: 0;
          color: #111827;
          font-size: 18px;
          line-height: 1.25;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .imageCardText {
          margin: 10px 0 0;
          color: #374151;
          font-size: 15px;
          line-height: 1.62;
        }

        .stepGrid {
          margin-top: 38px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          align-items: start;
        }

        .stepCard {
          position: relative;
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 16px;
          align-items: start;
        }

        .stepCard:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 28px;
          right: -16px;
          width: 28px;
          height: 1px;
          background: rgba(17, 24, 39, 0.22);
        }

        .stepNumber {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #0f1720;
          color: #ffffff;
          font-size: 19px;
          font-weight: 950;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.14);
        }

        .stepTitle {
          margin: 0;
          color: #111827;
          font-size: 17px;
          line-height: 1.24;
          font-weight: 950;
          letter-spacing: -0.025em;
        }

        .stepText {
          margin: 8px 0 0;
          color: #374151;
          font-size: 14px;
          line-height: 1.65;
        }

        .finalCard {
          min-height: 188px;
          border-radius: 20px;
          padding: 34px 54px;
          background:
            radial-gradient(circle at 82% 20%, rgba(255, 255, 255, 0.08), transparent 24%),
            linear-gradient(135deg, #0a0f14 0%, #111827 50%, #06080b 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 34px;
          box-shadow: 0 24px 56px rgba(15, 23, 42, 0.18);
        }

        .finalTitle {
          margin: 0;
          max-width: 580px;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.045em;
        }

        .finalText {
          margin: 12px 0 0;
          max-width: 590px;
          color: rgba(255, 255, 255, 0.86);
          font-size: 16px;
          line-height: 1.6;
        }

        .finalBtn {
          flex-shrink: 0;
          min-width: 196px;
          min-height: 58px;
          padding: 0 26px;
          border-radius: 10px;
          background: #ffffff;
          color: #111827;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.24);
        }

        @media (max-width: 980px) {
          .headerInner {
            align-items: flex-start;
            flex-direction: column;
          }

          .headerRight {
            width: 100%;
            justify-content: space-between;
            gap: 10px;
          }

          .heroContent {
            padding-top: 80px;
          }

          .introGrid {
            grid-template-columns: 1fr;
          }

          .introItem,
          .introItem.bordered {
            border-left: none;
            padding: 30px 0;
          }

          .introItem.bordered {
            border-top: 1px solid rgba(17, 24, 39, 0.1);
          }

          .pricingGrid,
          .imageGrid,
          .stepGrid {
            grid-template-columns: 1fr;
          }

          .featured {
            transform: none;
          }

          .stepCard:not(:last-child)::after {
            display: none;
          }

          .finalCard {
            flex-direction: column;
            align-items: flex-start;
            padding: 30px;
          }

          .finalBtn {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .header {
            position: static;
          }

          .logoImage {
            width: 148px;
          }

          .headerRight {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }

          .navLink {
            min-height: 42px;
            display: inline-flex;
            align-items: center;
          }

          .langWrap {
            grid-column: 1 / -1;
            width: 100%;
          }

          .langButton {
            flex: 1;
          }

          .navButton {
            grid-column: 1 / -1;
            width: 100%;
          }

          .hero {
            min-height: 74svh;
          }

          .heroImage {
            object-position: center center;
          }

          .heroOverlay {
            background:
              linear-gradient(90deg, rgba(0, 0, 0, 0.78), rgba(0, 0, 0, 0.4)),
              linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.68));
          }

          .heroContent {
            padding: 64px 18px 50px;
          }

          .pill {
            min-height: 34px;
            font-size: 13px;
          }

          .heroTitle {
            font-size: clamp(38px, 12vw, 52px);
          }

          .heroText {
            font-size: 16px;
          }

          .primaryBtn {
            width: 100%;
            max-width: 260px;
          }

          .introItem {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .pricingSection,
          .showcaseSection,
          .howSection,
          .finalSection {
            padding: 52px 0;
          }

          .priceCard {
            padding: 24px;
          }

          .finalCard {
            padding: 26px 20px;
          }
        }
      `}</style>
    </main>
  );
}
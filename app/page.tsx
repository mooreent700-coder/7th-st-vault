
'use client';
import Link from 'next/link';
import { useState } from 'react';
import AdminHoldLogin from '@/components/AdminHoldLogin';
type Lang = 'en' | 'es';

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
    ],

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
    ],

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
    ],

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
    ],

    finalTitle: 'Lanza tu sistema de pedidos sin tener que construirlo tú mismo.',
    finalText:
      'ORDA convierte tu menú en una experiencia de pedidos limpia y premium en minutos para restaurantes, food trucks, pop-ups y catering.',
  },
} as const;

const heroImage =
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1800&q=80';

const peopleImages = [
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=80',
];

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('en');
  const t = content[lang];

  return (
    <main className="page">
      <header className="header">
        <div className="headerInner">
       <div className="logoWrap">
  <AdminHoldLogin>
  <div
    className="logoWrap"
    onClick={() => window.location.href = '/'}
    style={{ cursor: 'pointer' }}
  >
   <img src="/orda-logo-new.png" style={{ width: '200px' }} />
  </div>
</AdminHoldLogin>

  <AdminHoldLogin>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        background: 'transparent'
      }}
    />
  </AdminHoldLogin>
</div>

          <div className="headerRight">
            <a href="#how" className="navLink">
              {t.navHow}
            </a>
            <a href="#pricing" className="navLink">
              {t.navPricing}
            </a>

            <div className="langWrap">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={lang === 'en' ? 'langButton active' : 'langButton'}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={lang === 'es' ? 'langButton active' : 'langButton'}
              >
                ES
              </button>
            </div>

            <Link href="/auth/signup" className="navButton">
              {t.navCreate}
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <img src={heroImage} alt="Chef cooking in a busy kitchen" className="heroImage" />
        <div className="heroOverlay" />
        <div className="heroContent">
          <div className="pill">{t.pill}</div>
          <h1 className="heroTitle">{t.heroTitle}</h1>
          <p className="heroText">{t.heroText}</p>
          <div className="heroButtons">
            <Link href="/auth/signup?plan=starter" className="primaryBtn">
              {t.startFree}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container smallCenter">
          <h2 className="sectionTitle">{t.builtTitle}</h2>
          <p className="sectionText">{t.builtText}</p>
        </div>
      </section>

      <section className="section soft">
        <div className="container smallCenter">
          <h2 className="sectionTitle">{t.systemTitle}</h2>
          <p className="sectionText">{t.systemText}</p>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="container">
          <div className="smallCenter">
            <div className="eyebrow">{t.pricingEyebrow}</div>
            <h2 className="sectionTitle">{t.pricingTitle}</h2>
          </div>

          <div className="pricingGrid">
            <div className="priceCard">
              <div className="priceBody">
                <h3 className="priceName">{t.starter}</h3>
                <div className="priceTop">{t.starterTop}</div>
                <div className="priceSub">{t.starterPrice}</div>
                <div className="priceFee">{t.starterFee}</div>
              </div>
              <Link href="/auth/signup?plan=starter" className="cardBtn">
                {t.getStarted}
              </Link>
            </div>

            <div className="priceCard featured">
              <div className="priceBody">
                <div className="badge">{t.mostPopular}</div>
                <h3 className="priceName light">{t.growth}</h3>
                <div className="priceTop light">{t.growthTop}</div>
                <div className="priceFee light">{t.growthFee}</div>
              </div>
              <Link href="/auth/checkout?plan=growth" className="cardBtnLight">
                {t.chooseGrowth}
              </Link>
            </div>

            <div className="priceCard">
              <div className="priceBody">
                <h3 className="priceName">{t.premium}</h3>
                <div className="priceTop">{t.premiumTop}</div>
                <div className="priceFee">{t.premiumFee}</div>
              </div>
              <Link href="/auth/checkout?plan=premium" className="cardBtn">
                {t.goPremium}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="smallCenter">
            <div className="eyebrow">{t.showcaseEyebrow}</div>
            <h2 className="sectionTitle">{t.showcaseTitle}</h2>
            <p className="sectionText">{t.showcaseText}</p>
          </div>

          <div className="imageGrid">
            {peopleImages.map((src, index) => (
              <div key={src} className="imageCard">
                <img src={src} alt={`Food business showcase ${index + 1}`} className="imageCardImg" />
                <div className="imageCardBody">
                  <h3 className="imageCardTitle">{t.cards[index].title}</h3>
                  <p className="imageCardText">{t.cards[index].text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="section">
        <div className="container">
          <div className="smallCenter">
            <div className="eyebrow">{t.howEyebrow}</div>
            <h2 className="sectionTitle">{t.howTitle}</h2>
          </div>

          <div className="stepGrid">
            {t.steps.map((step, index) => (
              <div key={step.title} className="stepCard">
                <div className="stepNumber">{index + 1}</div>
                <h3 className="stepTitle">{step.title}</h3>
                <p className="stepText">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container smallCenter">
          <h2 className="sectionTitle">{t.finalTitle}</h2>
          <p className="sectionText">{t.finalText}</p>
          <Link href="/auth/signup?plan=starter" className="primaryBtn linea">
            {t.startFree}
          </Link>
        </div>
      </section>

      <style jsx>{`
        .page {
          background: #f8f8f5;
          color: #142132;
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
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(20, 33, 50, 0.08);
        }

        .headerInner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .logoWrap {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #142132;
        }

        .logoMark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, linear-gradient(180deg, #f8fafc 0%, #cbd5e1 45%, #64748b 100%) 0%, #2b3f5f 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
        }

        .logoText {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .headerRight {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .navLink {
          text-decoration: none;
          color: #324154;
          font-weight: 600;
          font-size: 15px;
        }

        .langWrap {
          display: flex;
          border: 1px solid rgba(20, 33, 50, 0.1);
          background: rgba(255, 255, 255, 0.9);
          padding: 4px;
          border-radius: 14px;
        }

        .langButton {
          border: none;
          background: transparent;
          color: #5c6b7d;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .langButton.active {
          background: #142132;
          color: #fff;
        }

        .navButton,
        .primaryBtn,
        .cardBtn,
        .cardBtnLight {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          border-radius: 14px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .navButton {
          background: #142132;
          color: #fff;
          padding: 10px 16px;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
        }

        .hero {
          position: relative;
          min-height: 78svh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(13, 21, 33, 0.14) 0%,
            rgba(13, 21, 33, 0.28) 40%,
            rgba(13, 21, 33, 0.52) 100%
          );
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 920px;
          padding: 146px 20px 44px;
          text-align: center;
          color: #fff;
        }

        .pill {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }

        .heroTitle {
          margin: 18px auto 0;
          max-width: 880px;
          font-size: clamp(40px, 8vw, 76px);
          line-height: 0.98;
          font-weight: 900;
          letter-spacing: -0.055em;
          text-wrap: balance;
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.18);
        }

        .heroText {
          margin: 18px auto 0;
          max-width: 760px;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.94);
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.18);
        }

        .heroButtons {
          margin-top: 28px;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primaryBtn {
          background: #ffffff;
          color: #142132;
          padding: 14px 22px;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.18);
        }

        .linea {
          background: #142132;
          color: #fff;
          margin-top: 22px;
        }

        .section {
          padding: 58px 0;
        }

        .soft {
          background: #eef1ee;
        }

        .container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .smallCenter {
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
        }

        .eyebrow {
          color: #8a744f;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .sectionTitle {
          margin: 10px 0 0;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -0.045em;
          color: #142132;
          text-wrap: balance;
        }

        .sectionText {
          margin-top: 14px;
          font-size: 17px;
          line-height: 1.8;
          color: #506073;
        }

        .pricingGrid,
        .imageGrid,
        .stepGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          margin-top: 34px;
        }

        .priceCard,
        .imageCard,
        .stepCard {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 24px;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
        }

        .priceCard {
          padding: 24px;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 22px;
        }

        .priceBody {
          display: flex;
          flex-direction: column;
        }

        .priceCard.featured {
          background: #142132;
          color: #fff;
          box-shadow: 0 24px 52px rgba(15, 23, 42, 0.18);
        }

        .badge {
          display: inline-flex;
          width: fit-content;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }

        .priceName {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #142132;
        }

        .light {
          color: #fff;
        }

        .priceTop {
          margin-top: 10px;
          font-size: clamp(34px, 7vw, 44px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #142132;
        }

        .priceSub {
          margin-top: 8px;
          font-size: 16px;
          font-weight: 700;
          color: #5b6a7b;
        }

        .priceFee {
          margin-top: 14px;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.6;
          color: #506073;
        }

        .cardBtn {
          width: 100%;
          min-height: 52px;
          background: #142132;
          color: #fff;
          padding: 13px 16px;
        }

        .cardBtnLight {
          width: 100%;
          min-height: 52px;
          background: #fff;
          color: #142132;
          padding: 13px 16px;
        }

        .imageCard {
          overflow: hidden;
        }

        .imageCardImg {
          width: 100%;
          height: 240px;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .imageCardBody {
          padding: 22px;
        }

        .imageCardTitle {
          margin: 0;
          font-size: 22px;
          line-height: 1.2;
          font-weight: 800;
          color: #142132;
        }

        .imageCardText {
          margin-top: 10px;
          color: #506073;
          line-height: 1.75;
          font-size: 15px;
        }

        .stepCard {
          padding: 22px;
        }

        .stepNumber {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #142132;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 18px;
          box-shadow: 0 14px 24px rgba(15, 23, 42, 0.12);
        }

        .stepTitle {
          margin: 16px 0 0;
          font-size: 22px;
          font-weight: 800;
          color: #142132;
        }

        .stepText {
          margin-top: 10px;
          color: #506073;
          line-height: 1.75;
          font-size: 15px;
        }

        @media (max-width: 767px) {
          .header {
            position: static;
          }

          .headerInner {
            align-items: flex-start;
          }

          .headerRight {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .navLink {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }

          .langWrap {
            grid-column: 1 / -1;
            width: 100%;
            justify-content: stretch;
          }

          .langButton {
            flex: 1;
          }

          .navButton {
            grid-column: 1 / -1;
            width: 100%;
            min-height: 46px;
          }

          .section {
            padding: 48px 0;
          }

          .hero {
            min-height: 76svh;
          }

          .heroImage {
            object-position: center 26%;
          }

          .heroContent {
            padding: 178px 16px 40px;
            max-width: 680px;
          }

          .pill {
            top: 14px;
            font-size: 13px;
            padding: 10px 14px;
          }

          .heroTitle {
            max-width: 360px;
            font-size: clamp(26px, 8.2vw, 40px);
            line-height: 1.03;
            letter-spacing: -0.04em;
            margin-top: 0;
          }

          .heroText {
            max-width: 345px;
            font-size: 16px;
            line-height: 1.66;
            margin-top: 16px;
          }

          .heroButtons {
            margin-top: 22px;
            flex-direction: column;
            align-items: center;
          }

          .heroButtons a {
            width: 100%;
            max-width: 260px;
          }

          .sectionText {
            font-size: 16px;
            line-height: 1.72;
          }

          .priceCard {
            min-height: 0;
          }
        }

        @media (min-width: 768px) {
          .pricingGrid,
          .stepGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .imageGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1100px) {
          .pricingGrid,
          .imageGrid,
          .stepGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hero {
            min-height: 86svh;
          }
        }
      `}</style>
    </main>
  );
}
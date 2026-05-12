'use client';

import { useEffect, useMemo, useState } from 'react';

export type OrdaLang = 'en' | 'es';

export const ORDA_COPY = {
  en: {
    menu: 'Menu',
    about: 'About',
    reviews: 'Reviews',
    contact: 'Contact',
    orderDirect: 'ORDER DIRECT. NO FEES.',
    tagline: 'Order direct from this business. Fresh food, direct checkout, no third-party app fees.',
    pickup: 'PICKUP',
    delivery: 'DELIVERY',
    allItems: 'ALL ITEMS',
    customize: 'Customize',
    location: 'YOUR LOCATION',
    directions: 'GET DIRECTIONS',
    storeDetails: 'STORE DETAILS',
    pickupAvailable: 'Pickup Available',
    deliveryAvailable: 'Delivery Available',
    deliveryFee: 'Delivery Fee',
    deliveryRadius: 'Delivery Radius',
    minimumOrder: 'Minimum Order',
    hours: 'HOURS',
    why: 'WHY ORDER DIRECT?',
    noFees: 'No Third-Party Fees',
    fresh: 'Fresh & Fast',
    support: 'Support Local',
    chooseOptions: 'Customize Your Item',
    required: 'Required',
    optional: 'Optional',
    quantity: 'Quantity',
    addToCart: 'ADD TO CART',
    cart: 'View Cart',
    checkout: 'CHECKOUT',
    subtotal: 'SUBTOTAL',
    empty: 'Your cart is empty.',
    close: 'Close',
    startingAt: 'Starting at',
    soldOut: 'Sold Out',
    openNow: 'Open Now',
    closedNow: 'Closed Now',
    opens: 'Opens',
    remove: 'Remove',
  },
  es: {
    menu: 'Menú',
    about: 'Acerca',
    reviews: 'Reseñas',
    contact: 'Contacto',
    orderDirect: 'ORDENA DIRECTO. SIN FEES.',
    tagline: 'Ordena directo de este negocio. Comida fresca, pago directo, sin cargos de apps.',
    pickup: 'RECOGER',
    delivery: 'ENTREGA',
    allItems: 'TODO',
    customize: 'Personalizar',
    location: 'TU UBICACIÓN',
    directions: 'CÓMO LLEGAR',
    storeDetails: 'DETALLES',
    pickupAvailable: 'Pickup Disponible',
    deliveryAvailable: 'Entrega Disponible',
    deliveryFee: 'Costo de Entrega',
    deliveryRadius: 'Radio de Entrega',
    minimumOrder: 'Orden Mínima',
    hours: 'HORARIO',
    why: '¿POR QUÉ ORDENAR DIRECTO?',
    noFees: 'Sin Cargos de Apps',
    fresh: 'Fresco y Rápido',
    support: 'Apoya Local',
    chooseOptions: 'Personaliza Tu Orden',
    required: 'Requerido',
    optional: 'Opcional',
    quantity: 'Cantidad',
    addToCart: 'AGREGAR',
    cart: 'Ver Carrito',
    checkout: 'PAGAR',
    subtotal: 'SUBTOTAL',
    empty: 'Tu carrito está vacío.',
    close: 'Cerrar',
    startingAt: 'Desde',
    soldOut: 'Agotado',
    openNow: 'Abierto',
    closedNow: 'Cerrado',
    opens: 'Abre',
    remove: 'Quitar',
  },
} as const;

type OrdaLanguageToggleProps = {
  initialLanguage?: string | null;
  onChange?: (lang: OrdaLang) => void;
};

export function getOrdaLang(value?: string | null): OrdaLang {
  return value === 'es' ? 'es' : 'en';
}

export function useOrdaLanguage(initialLanguage?: string | null) {
  const [lang, setLang] = useState<OrdaLang>(() => getOrdaLang(initialLanguage));

  useEffect(() => {
    const incoming = getOrdaLang(initialLanguage);
    setLang(incoming);
  }, [initialLanguage]);

  const copy = useMemo(() => ORDA_COPY[lang], [lang]);

  return { lang, setLang, copy };
}

export default function OrdaLanguageToggle({ initialLanguage, onChange }: OrdaLanguageToggleProps) {
  const [lang, setLang] = useState<OrdaLang>(() => getOrdaLang(initialLanguage));

  useEffect(() => {
    setLang(getOrdaLang(initialLanguage));
  }, [initialLanguage]);

  function changeLang(next: OrdaLang) {
    setLang(next);
    onChange?.(next);

    try {
      window.localStorage.setItem('orda_storefront_language', next);
    } catch {}
  }

  return (
    <div className="ordaLangToggle" aria-label="Storefront language">
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        aria-pressed={lang === 'en'}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          changeLang('en');
        }}
      >
        EN
      </button>

      <button
        type="button"
        className={lang === 'es' ? 'active' : ''}
        aria-pressed={lang === 'es'}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          changeLang('es');
        }}
      >
        ES
      </button>

      <style jsx>{`
        .ordaLangToggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 200;
          pointer-events: auto;
        }

        .ordaLangToggle button {
          height: 42px;
          min-width: 52px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: #10131a;
          color: #fff;
          font-weight: 950;
          font-size: 14px;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.24);
        }

        .ordaLangToggle button.active {
          background: #f5b91e;
          color: #050607;
          border-color: #f5b91e;
        }

        .ordaLangToggle button:focus-visible {
          outline: 3px solid rgba(245, 185, 30, 0.45);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}

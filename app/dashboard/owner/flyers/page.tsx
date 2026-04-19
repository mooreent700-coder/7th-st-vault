'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

/* =========================
   TYPES
========================= */
type FlyerCategoryKey =
  | 'seafood'
  | 'soul_food'
  | 'bbq'
  | 'mexican'
  | 'burgers'
  | 'wings'
  | 'caribbean'
  | 'asian'
  | 'coffee_drinks'
  | 'ice_cream'
  | 'smoothies'
  | 'desserts';

type FlyerTab = 'custom' | 'free';
type FlyerPackKey = '100' | '250' | '500';

type StoreRecord = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  address?: string | null;
  owner_id?: string | null;
  user_id?: string | null;
};

type FlyerOrderPayload = {
  restaurant_id: string;
  flyer_type: 'custom_qr' | 'free_white';
  flyer_design_id: string;
  flyer_preview_url: string;
  quantity: number;
  status: string;
  package_key: FlyerPackKey | null;
  category_key: FlyerCategoryKey | null;
  store_slug: string;
  store_name: string;
  store_phone: string;
  store_address: string;
  qr_url: string;
  checkout_url: string | null;
};

/* =========================
   CONSTANTS
========================= */
const FALLBACK_STORE: StoreRecord = {
  name: 'MenuFlow Kitchen',
  slug: 'menuflow-kitchen',
  phone: '',
  address: '',
};

const PACKS: Record<FlyerPackKey, { qty: number; price: number; url: string }> = {
  '100': { qty: 100, price: 120, url: 'https://buy.stripe.com/aFacN4dydgbdarf6Pw2wU0c' },
  '250': { qty: 250, price: 250, url: 'https://buy.stripe.com/00w6oG8dTf798j77TA2wU0d' },
  '500': { qty: 500, price: 450, url: 'https://buy.stripe.com/eVqaEWcu95wz6aZb5M2wU0e' },
};

const CATEGORIES: { key: FlyerCategoryKey; label: string; emoji: string; folder: string }[] = [
  { key: 'seafood', label: 'Seafood', emoji: '🦀', folder: 'seafood' },
  { key: 'soul_food', label: 'Soul Food', emoji: '🍲', folder: 'soul_food' },
  { key: 'bbq', label: 'BBQ', emoji: '🔥', folder: 'bbq' },
  { key: 'mexican', label: 'Mexican', emoji: '🌮', folder: 'mexican' },
  { key: 'burgers', label: 'Burgers', emoji: '🍔', folder: 'burgers' },
  { key: 'wings', label: 'Wings', emoji: '🍗', folder: 'wings' },
  { key: 'caribbean', label: 'Caribbean', emoji: '🏝️', folder: 'caribbean' },
  { key: 'asian', label: 'Asian / Hibachi', emoji: '🍜', folder: 'asian' },
  { key: 'coffee_drinks', label: 'Coffee', emoji: '☕', folder: 'coffee_drinks' },
  { key: 'ice_cream', label: 'Ice Cream', emoji: '🍨', folder: 'ice_cream' },
  { key: 'smoothies', label: 'Smoothies', emoji: '🥤', folder: 'smoothies' },
  { key: 'desserts', label: 'Desserts', emoji: '🍰', folder: 'desserts' },
];

/* =========================
   HELPERS
========================= */
function getName(s: StoreRecord | null) {
  return s?.name?.trim() || 'MenuFlow Kitchen';
}

function getSlug(s: StoreRecord | null) {
  return (s?.slug?.trim() || 'menuflow-kitchen').toLowerCase();
}

function getPhone(s: StoreRecord | null) {
  return s?.phone?.trim() || '';
}

function getAddress(s: StoreRecord | null) {
  return s?.address?.trim() || '';
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').trim();
}

function getCategoryMeta(category: FlyerCategoryKey) {
  return CATEGORIES.find((item) => item.key === category) || CATEGORIES[0];
}

/* =========================
   FLYER PATHS
   IMPORTANT:
   Put your images here:
   /public/flyers/<folder>/<folder>_1.png
   /public/flyers/<folder>/<folder>_2.png
   /public/flyers/<folder>/<folder>_3.png
========================= */
function getFlyerPaths(category: FlyerCategoryKey) {
  const meta = getCategoryMeta(category);
  const folder = meta.folder;

  return [
    {
      id: `${folder}_1`,
      title: 'Style 1',
      src: `/flyers/${folder}/${folder}_1.png`,
    },
    {
      id: `${folder}_2`,
      title: 'Style 2',
      src: `/flyers/${folder}/${folder}_2.png`,
    },
    {
      id: `${folder}_3`,
      title: 'Style 3',
      src: `/flyers/${folder}/${folder}_3.png`,
    },
  ];
}

/* =========================
   IMAGE CARD
========================= */
function FlyerCard({
  src,
  title,
  selected,
  onSelect,
  broken,
  onError,
}: {
  src: string;
  title: string;
  selected: boolean;
  onSelect: () => void;
  broken: boolean;
  onError: () => void;
}) {
  return (
    <button
      type="button"
      className={`flyerCard ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      aria-label={title}
    >
      <div className="styleBadge">{title.toUpperCase()}</div>

      {!broken ? (
        <img src={src} alt={title} className="flyerImage" onError={onError} />
      ) : (
        <div className="flyerMissing">
          <div className="missingTitle">Missing flyer image</div>
          <div className="missingPath">{src}</div>
        </div>
      )}
    </button>
  );
}

/* =========================
   PREVIEW MODAL
========================= */
function PreviewModal({
  open,
  imageSrc,
  title,
  onClose,
}: {
  open: boolean;
  imageSrc: string;
  title: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modalWrap" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <strong>{title}</strong>
          <button type="button" className="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>
        <img src={imageSrc} alt={title} className="modalImage" />
      </div>
    </div>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function Page() {
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<FlyerTab>('custom');
  const [pack, setPack] = useState<FlyerPackKey>('250');
  const [category, setCategory] = useState<FlyerCategoryKey>('seafood');
  const [selectedFlyerIndex, setSelectedFlyerIndex] = useState(0);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (!authData?.user) {
          setStore(FALLBACK_STORE);
          setLoading(false);
          return;
        }

        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('*')
          .or(`owner_id.eq.${authData.user.id},user_id.eq.${authData.user.id}`)
          .limit(1)
          .single();

        setStore(restaurant || FALLBACK_STORE);
      } catch {
        setStore(FALLBACK_STORE);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    setSelectedFlyerIndex(0);
  }, [category, tab]);

  const flyerOptions = useMemo(() => getFlyerPaths(category), [category]);

  const selectedFlyer = flyerOptions[selectedFlyerIndex] || flyerOptions[0];

  const slug = getSlug(store);
  const storeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/store/${slug}`
      : `https://menuflow.app/store/${slug}`;

  const qrUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/store/${slug}`
      : `https://menuflow.app/store/${slug}`;

  async function saveFlyerOrder() {
    if (tab === 'free') {
      window.open(storeUrl, '_blank');
      return;
    }

    if (!store?.id) {
      window.open(PACKS[pack].url, '_blank');
      return;
    }

    const payload: FlyerOrderPayload = {
      restaurant_id: store.id,
      flyer_type: 'custom_qr',
      flyer_design_id: selectedFlyer.id,
      flyer_preview_url: selectedFlyer.src,
      quantity: PACKS[pack].qty,
      status: 'pending',
      package_key: pack,
      category_key: category,
      store_slug: slug,
      store_name: getName(store),
      store_phone: getPhone(store),
      store_address: getAddress(store),
      qr_url: qrUrl,
      checkout_url: PACKS[pack].url,
    };

    try {
      await supabase.from('flyer_orders').insert(payload);
    } catch {
      // do nothing, still send owner to checkout
    }

    window.open(PACKS[pack].url, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(storeUrl);
  }

  function markImageBroken(src: string) {
    setBrokenImages((prev) => ({
      ...prev,
      [src]: true,
    }));
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loadingCard">Loading flyers...</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="heroCard">
        <div className="heroIcon">📣</div>
        <div>
          <h1>Custom QR Flyers</h1>
          <p>Choose a category and use your real flyer images from your public flyers folders.</p>
        </div>
      </div>

      <div className="storeCard">
        <div className="storeTop">
          <div>
            <div className="storeLabel">Your Store Link</div>
            <div className="storeUrl">{storeUrl}</div>
          </div>
          <span className="statusPill">Active</span>
        </div>

        <div className="storeButtons">
          <button type="button" className="secondaryBtn" onClick={copyLink}>
            Copy Link
          </button>
          <button
            type="button"
            className="primaryBtn"
            onClick={() => window.open(storeUrl, '_blank')}
          >
            Open Store
          </button>
        </div>
      </div>

      <div className="tabsWrap">
        <button
          type="button"
          className={`tabBtn ${tab === 'custom' ? 'active' : ''}`}
          onClick={() => setTab('custom')}
        >
          Custom Flyers
        </button>
        <button
          type="button"
          className={`tabBtn ${tab === 'free' ? 'active' : ''}`}
          onClick={() => setTab('free')}
        >
          Free White Flyer
        </button>
      </div>

      <div className="sectionTitle">
        <span>1. CHOOSE A CATEGORY</span>
      </div>

      <div className="categoryRow">
        {CATEGORIES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`categoryBtn ${category === item.key ? 'active' : ''}`}
            onClick={() => setCategory(item.key)}
          >
            <span className="emoji">{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'custom' ? (
        <>
          <div className="sectionTitle split">
            <span>2. CHOOSE YOUR FLYER STYLE</span>
            <span className="helperText">Tap any design to preview</span>
          </div>

          <div className="flyerGrid">
            {flyerOptions.map((flyer, index) => (
              <FlyerCard
                key={flyer.id}
                src={flyer.src}
                title={flyer.title}
                selected={selectedFlyerIndex === index}
                onSelect={() => {
                  setSelectedFlyerIndex(index);
                  setPreviewOpen(true);
                }}
                broken={!!brokenImages[flyer.src]}
                onError={() => markImageBroken(flyer.src)}
              />
            ))}
          </div>

          <div className="sectionTitle">
            <span>3. SELECT YOUR PACKAGE</span>
          </div>

          <div className="packList">
            {(Object.keys(PACKS) as FlyerPackKey[]).map((key) => {
              const item = PACKS[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`packCard ${pack === key ? 'active' : ''}`}
                  onClick={() => setPack(key)}
                >
                  <div className="packLeft">
                    <div className="radioDot">{pack === key ? '●' : ''}</div>
                    <div>
                      <div className="packQty">{item.qty} FLYERS</div>
                      <div className="packType">One Time</div>
                    </div>
                  </div>
                  <div className="packPrice">${item.price}</div>
                </button>
              );
            })}
          </div>

          <button type="button" className="checkoutBtn" onClick={saveFlyerOrder}>
            UPGRADE & UNLOCK
          </button>
        </>
      ) : (
        <div className="freeFlyerCard">
          <div className="freeFlyerInner">
            <div className="freeHeader">Free White Flyer</div>
            <div className="freeStoreName">{getName(store)}</div>
            <div className="freeStoreUrl">{storeUrl}</div>
            <div className="freeScanText">SCAN TO ORDER</div>
          </div>

          <button type="button" className="checkoutBtn" onClick={saveFlyerOrder}>
            OPEN STORE
          </button>
        </div>
      )}

      <PreviewModal
        open={previewOpen}
        imageSrc={selectedFlyer.src}
        title={`${getCategoryMeta(category).label} — ${selectedFlyer.title}`}
        onClose={() => setPreviewOpen(false)}
      />

      <style jsx>{styles}</style>
    </main>
  );
}

/* =========================
   STYLES
========================= */
const styles = `
  .page {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 20px 16px 120px;
    background: #f7f7fb;
    min-height: 100vh;
  }

  .loadingCard {
    background: #ffffff;
    border: 1px solid #e6e8ef;
    border-radius: 20px;
    padding: 32px;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }

  .heroCard {
    display: flex;
    gap: 16px;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e6e8ef;
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 18px;
  }

  .heroIcon {
    width: 74px;
    height: 74px;
    border-radius: 18px;
    background: #eef2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34px;
    flex-shrink: 0;
  }

  h1 {
    margin: 0 0 4px;
    font-size: 38px;
    line-height: 1;
    font-weight: 900;
    color: #081b52;
  }

  p {
    margin: 0;
    color: #475569;
    font-size: 16px;
    line-height: 1.45;
  }

  .storeCard {
    background: #ffffff;
    border: 1px solid #e6e8ef;
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 18px;
  }

  .storeTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .storeLabel {
    font-size: 14px;
    font-weight: 800;
    color: #64748b;
    margin-bottom: 6px;
  }

  .storeUrl {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    word-break: break-word;
  }

  .statusPill {
    background: #22c55e;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .storeButtons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .primaryBtn,
  .secondaryBtn,
  .tabBtn,
  .categoryBtn,
  .packCard,
  .checkoutBtn,
  .modalClose,
  .flyerCard {
    appearance: none;
    border: none;
    outline: none;
    cursor: pointer;
    font-family: inherit;
  }

  .secondaryBtn {
    background: #ffffff;
    color: #081b52;
    border: 1.5px solid #cbd5e1;
    height: 52px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 800;
  }

  .primaryBtn {
    background: #081b52;
    color: #ffffff;
    height: 52px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 800;
  }

  .tabsWrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 18px;
  }

  .tabBtn {
    height: 52px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 800;
    background: #ffffff;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .tabBtn.active {
    background: #081b52;
    color: #ffffff;
    border-color: #081b52;
  }

  .sectionTitle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 18px 0 10px;
    font-size: 15px;
    font-weight: 900;
    color: #475569;
    letter-spacing: 0.02em;
  }

  .sectionTitle.split {
    margin-top: 24px;
  }

  .helperText {
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
  }

  .categoryRow {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .categoryBtn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: max-content;
    height: 54px;
    padding: 0 16px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 800;
    white-space: nowrap;
  }

  .categoryBtn.active {
    background: #081b52;
    color: #ffffff;
    border-color: #081b52;
  }

  .emoji {
    font-size: 22px;
    line-height: 1;
  }

  .flyerGrid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .flyerCard {
    position: relative;
    width: 100%;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 22px;
    overflow: hidden;
    padding: 0;
    text-align: left;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .flyerCard:hover {
    transform: translateY(-2px);
    border-color: #94a3b8;
  }

  .flyerCard.selected {
    border-color: #081b52;
    box-shadow: 0 0 0 4px rgba(8, 27, 82, 0.08);
  }

  .styleBadge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 3;
    background: rgba(8, 27, 82, 0.95);
    color: #ffffff;
    border-radius: 10px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.03em;
  }

  .flyerImage {
    width: 100%;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    display: block;
    background: #e5e7eb;
  }

  .flyerMissing {
    width: 100%;
    aspect-ratio: 9 / 16;
    background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 22px;
    text-align: center;
  }

  .missingTitle {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .missingPath {
    font-size: 13px;
    line-height: 1.45;
    color: #475569;
    word-break: break-word;
  }

  .packList {
    display: grid;
    gap: 12px;
  }

  .packCard {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    min-height: 74px;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 18px;
    padding: 14px 16px;
  }

  .packCard.active {
    border-color: #081b52;
    box-shadow: 0 0 0 4px rgba(8, 27, 82, 0.06);
  }

  .packLeft {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .radioDot {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 2px solid #94a3b8;
    color: #081b52;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .packQty {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .packType {
    font-size: 13px;
    color: #64748b;
    font-weight: 700;
  }

  .packPrice {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
  }

  .checkoutBtn {
    width: 100%;
    height: 56px;
    margin-top: 16px;
    border-radius: 18px;
    background: #081b52;
    color: #ffffff;
    font-size: 18px;
    font-weight: 900;
  }

  .freeFlyerCard {
    background: #ffffff;
    border: 1px solid #e6e8ef;
    border-radius: 22px;
    padding: 20px;
  }

  .freeFlyerInner {
    min-height: 420px;
    border-radius: 20px;
    background: #ffffff;
    border: 2px dashed #cbd5e1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px;
    text-align: center;
  }

  .freeHeader {
    font-size: 16px;
    font-weight: 900;
    color: #64748b;
    margin-bottom: 8px;
  }

  .freeStoreName {
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
  }

  .freeStoreUrl {
    font-size: 15px;
    color: #475569;
    margin-bottom: 18px;
    word-break: break-word;
  }

  .freeScanText {
    font-size: 34px;
    font-weight: 900;
    color: #081b52;
  }

  .modalWrap {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(15, 23, 42, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
  }

  .modalCard {
    width: min(100%, 460px);
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
  }

  .modalTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 16px;
    color: #0f172a;
  }

  .modalClose {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #0f172a;
    font-size: 16px;
    font-weight: 900;
  }

  .modalImage {
    width: 100%;
    display: block;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    background: #e5e7eb;
  }

  @media (max-width: 980px) {
    .flyerGrid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 640px) {
    .page {
      padding: 14px 12px 110px;
    }

    h1 {
      font-size: 30px;
    }

    .storeButtons,
    .tabsWrap,
    .flyerGrid {
      grid-template-columns: 1fr;
    }

    .packCard {
      padding: 14px;
    }

    .packPrice {
      font-size: 20px;
    }
  }
`;
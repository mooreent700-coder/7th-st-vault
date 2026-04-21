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

type FlyerOption = {
  id: string;
  title: string;
  src: string;
};

/* =========================
   CONSTANTS
========================= */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://menuflow-app-mu.vercel.app';

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
function getName(store: StoreRecord | null) {
  return store?.name?.trim() || 'MenuFlow Kitchen';
}

function getSlug(store: StoreRecord | null) {
  return (store?.slug?.trim() || 'menuflow-kitchen').toLowerCase();
}

function getPhone(store: StoreRecord | null) {
  return store?.phone?.trim() || '';
}

function getAddress(store: StoreRecord | null) {
  return store?.address?.trim() || '';
}

function getCategoryMeta(category: FlyerCategoryKey) {
  return CATEGORIES.find((item) => item.key === category) || CATEGORIES[0];
}

function getFlyerPaths(category: FlyerCategoryKey): FlyerOption[] {
  const meta = getCategoryMeta(category);
  const folder = meta.folder;

  return [
    { id: `${folder}_1`, title: 'Style 1', src: `/flyers/${folder}/${folder}_1.png` },
    { id: `${folder}_2`, title: 'Style 2', src: `/flyers/${folder}/${folder}_2.png` },
    { id: `${folder}_3`, title: 'Style 3', src: `/flyers/${folder}/${folder}_3.png` },
  ];
}

function buildQrImageUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(value)}`;
}

/* =========================
   UI
========================= */
function FlyerQrOverlay({
  qrSrc,
  onOpenStore,
}: {
  qrSrc: string;
  onOpenStore: () => void;
}) {
  return (
    <button type="button" className="qrOverlay" onClick={onOpenStore} aria-label="Open store">
      <div className="qrShell">
        <img src={qrSrc} alt="Store QR code" className="qrImage" />
      </div>
      <span className="qrText">SCAN TO ORDER</span>
    </button>
  );
}

function FlyerCard({
  src,
  title,
  selected,
  onPreview,
  onSelect,
  broken,
  onError,
  qrSrc,
  onOpenStore,
}: {
  src: string;
  title: string;
  selected: boolean;
  onPreview: () => void;
  onSelect: () => void;
  broken: boolean;
  onError: () => void;
  qrSrc: string;
  onOpenStore: () => void;
}) {
  return (
    <article className={`flyerCard ${selected ? 'selected' : ''}`}>
      <button type="button" className="flyerPreviewBtn" onClick={onPreview} aria-label={title}>
        <div className="styleBadge">{title.toUpperCase()}</div>

        {!broken ? (
          <div className="flyerImageWrap">
            <img src={src} alt={title} className="flyerImage" onError={onError} />
            <div className="imageGlow" />
            <div className="imageShade" />
            <FlyerQrOverlay qrSrc={qrSrc} onOpenStore={onOpenStore} />
          </div>
        ) : (
          <div className="flyerMissing">
            <div className="missingTitle">Missing flyer image</div>
            <div className="missingPath">{src}</div>
          </div>
        )}
      </button>

      <div className="flyerActionBar">
        <span className={`flyerStatePill ${selected ? 'locked' : 'idle'}`}>
          {selected ? 'Locked In' : 'Not Selected'}
        </span>

        <button
          type="button"
          className={`selectFlyerBtn ${selected ? 'selected' : ''}`}
          onClick={onSelect}
        >
          {selected ? 'Selected Flyer' : 'Select This Flyer'}
        </button>
      </div>
    </article>
  );
}

function PreviewModal({
  open,
  imageSrc,
  title,
  qrSrc,
  onClose,
  onOpenStore,
}: {
  open: boolean;
  imageSrc: string;
  title: string;
  qrSrc: string;
  onClose: () => void;
  onOpenStore: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modalWrap" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <div className="modalTitleWrap">
            <strong>{title}</strong>
            <span>Preview</span>
          </div>

          <button type="button" className="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modalImageWrap">
          <img src={imageSrc} alt={title} className="modalImage" />
          <div className="imageGlow modalGlow" />
          <div className="imageShade modalShade" />
          <FlyerQrOverlay qrSrc={qrSrc} onOpenStore={onOpenStore} />
        </div>
      </div>
    </div>
  );
}

/* =========================
   PAGE
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
  const [copied, setCopied] = useState(false);

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

    void load();
  }, []);

  useEffect(() => {
    setSelectedFlyerIndex(0);
  }, [category, tab]);

  const flyerOptions = useMemo(() => getFlyerPaths(category), [category]);
  const selectedFlyer = flyerOptions[selectedFlyerIndex] || flyerOptions[0];

  const slug = getSlug(store);
  const storeUrl = `${BASE_URL}/store/${slug}`;
  const qrImageUrl = useMemo(() => buildQrImageUrl(storeUrl), [storeUrl]);

  async function saveFlyerOrder() {
    if (tab === 'free') {
      window.location.href = storeUrl;
      return;
    }

    const checkoutUrl = PACKS[pack].url;

    if (!store?.id) {
      window.location.href = checkoutUrl;
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
      qr_url: storeUrl,
      checkout_url: checkoutUrl,
    };

    try {
      await supabase.from('flyer_orders').insert(payload);
    } catch {
      // continue checkout even if insert fails
    }

    window.location.href = checkoutUrl;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function markImageBroken(src: string) {
    setBrokenImages((prev) => ({
      ...prev,
      [src]: true,
    }));
  }

  function openStore() {
    window.location.href = storeUrl;
  }

  if (loading) {
    return (
      <main className="page">
        <div className="backgroundGlow glow1" />
        <div className="backgroundGlow glow2" />
        <div className="backgroundGlow glow3" />
        <div className="loadingCard">Loading flyers...</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="backgroundGlow glow1" />
      <div className="backgroundGlow glow2" />
      <div className="backgroundGlow glow3" />

      <div className="pageShell">
        <section className="heroCard">
          <div className="heroIcon">📣</div>

          <div className="heroText">
            <h1>Custom QR Flyers</h1>
            <p>Pick a category, lock in one flyer, then upgrade and unlock your print package.</p>
          </div>
        </section>

        <section className="storeCard">
          <div className="storeTop">
            <div>
              <div className="storeLabel">Your Store Link</div>
              <div className="storeUrl">{storeUrl}</div>
            </div>

            <span className="statusPill">Active</span>
          </div>

          <div className="storeButtons">
            <button type="button" className="secondaryBtn" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy Link'}
            </button>

            <button type="button" className="primaryBtn" onClick={openStore}>
              Open Store
            </button>
          </div>
        </section>

        <section className="tabsWrap">
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
        </section>

        <div className="sectionTitle">
          <span>1. CHOOSE A CATEGORY</span>
        </div>

        <section className="categorySection">
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
        </section>

        {tab === 'custom' ? (
          <>
            <div className="sectionTitle split">
              <span>2. SELECTED FLYER</span>
              <span className="helperText">Preview it or lock it in below</span>
            </div>

            <section className="selectedSummary">
              <div className="selectedSummaryTop">
                <span className="selectedStepPill">Style {selectedFlyerIndex + 1}</span>
                <span className="selectedLockedPill">Locked In</span>
              </div>

              <strong>
                {getCategoryMeta(category).label} — {selectedFlyer.title}
              </strong>
            </section>

            <section className="flyerGrid">
              {flyerOptions.map((flyer, index) => (
                <FlyerCard
                  key={flyer.id}
                  src={flyer.src}
                  title={flyer.title}
                  selected={selectedFlyerIndex === index}
                  onPreview={() => {
                    setSelectedFlyerIndex(index);
                    setPreviewOpen(true);
                  }}
                  onSelect={() => setSelectedFlyerIndex(index)}
                  broken={!!brokenImages[flyer.src]}
                  onError={() => markImageBroken(flyer.src)}
                  qrSrc={qrImageUrl}
                  onOpenStore={openStore}
                />
              ))}
            </section>

            <div className="sectionTitle">
              <span>3. SELECT YOUR PACKAGE</span>
            </div>

            <section className="packList">
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
                      <div className={`radioDot ${pack === key ? 'active' : ''}`}>
                        {pack === key ? '✓' : ''}
                      </div>

                      <div>
                        <div className="packQty">{item.qty} Flyers</div>
                        <div className="packType">One Time</div>
                      </div>
                    </div>

                    <div className="packPrice">${item.price}</div>
                  </button>
                );
              })}
            </section>

            <button type="button" className="checkoutBtn" onClick={saveFlyerOrder}>
              UPGRADE & UNLOCK
            </button>
          </>
        ) : (
          <section className="freeFlyerCard">
            <div className="freeFlyerInner">
              <div className="freeHeader">Free White Flyer</div>
              <div className="freeStoreName">{getName(store)}</div>
              <div className="freeStoreUrl">{storeUrl}</div>

              <div className="freeQrWrap">
                <img src={qrImageUrl} alt="Store QR code" className="freeQrImage" />
              </div>

              <div className="freeScanText">SCAN TO ORDER</div>
            </div>

            <button type="button" className="checkoutBtn" onClick={openStore}>
              OPEN STORE
            </button>
          </section>
        )}

        <PreviewModal
          open={previewOpen}
          imageSrc={selectedFlyer.src}
          title={`${getCategoryMeta(category).label} — ${selectedFlyer.title}`}
          qrSrc={qrImageUrl}
          onClose={() => setPreviewOpen(false)}
          onOpenStore={openStore}
        />
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    padding: 20px 16px 120px;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 24%),
      radial-gradient(circle at top right, rgba(56, 189, 248, 0.10), transparent 22%),
      linear-gradient(180deg, #06090f 0%, #090d16 42%, #06090f 100%);
  }

  .backgroundGlow {
    position: absolute;
    border-radius: 999px;
    filter: blur(90px);
    pointer-events: none;
    opacity: 0.22;
  }

  .glow1 {
    width: 280px;
    height: 280px;
    background: #2563eb;
    top: -90px;
    left: -100px;
  }

  .glow2 {
    width: 240px;
    height: 240px;
    background: #0ea5e9;
    top: 180px;
    right: -90px;
  }

  .glow3 {
    width: 180px;
    height: 180px;
    background: #1d4ed8;
    bottom: 120px;
    left: 4%;
  }

  .pageShell {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1320px;
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }

  .loadingCard,
  .heroCard,
  .storeCard,
  .categorySection,
  .selectedSummary,
  .freeFlyerCard,
  .modalCard {
    background: linear-gradient(180deg, rgba(15, 23, 34, 0.94) 0%, rgba(10, 15, 23, 0.98) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 24px 80px rgba(0,0,0,0.34),
      inset 0 1px 0 rgba(255,255,255,0.04);
    backdrop-filter: blur(18px);
  }

  .loadingCard {
    position: relative;
    z-index: 1;
    border-radius: 22px;
    padding: 34px;
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
    max-width: 1320px;
    margin: 0 auto;
  }

  .heroCard {
    display: flex;
    align-items: center;
    gap: 18px;
    border-radius: 26px;
    padding: 22px;
  }

  .heroIcon {
    width: 82px;
    height: 82px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(37,99,235,0.28) 0%, rgba(14,165,233,0.14) 100%);
    border: 1px solid rgba(96, 165, 250, 0.26);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 38px;
    flex-shrink: 0;
    box-shadow: 0 0 30px rgba(37,99,235,0.18);
  }

  .heroText {
    display: grid;
    gap: 6px;
  }

  h1 {
    margin: 0;
    font-size: 42px;
    line-height: 0.96;
    font-weight: 950;
    letter-spacing: -0.05em;
    color: #ffffff;
  }

  p {
    margin: 0;
    color: rgba(255,255,255,0.66);
    font-size: 16px;
    line-height: 1.5;
    font-weight: 700;
  }

  .storeCard {
    border-radius: 24px;
    padding: 20px;
  }

  .storeTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .storeLabel {
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 8px;
  }

  .storeUrl {
    font-size: 18px;
    font-weight: 850;
    color: #ffffff;
    word-break: break-word;
  }

  .statusPill {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(34,197,94,0.18);
    border: 1px solid rgba(74, 222, 128, 0.22);
    color: #bbf7d0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
    box-shadow: 0 0 24px rgba(34,197,94,0.10);
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
  .flyerPreviewBtn,
  .selectFlyerBtn,
  .qrOverlay {
    appearance: none;
    outline: none;
    cursor: pointer;
    font-family: inherit;
  }

  .secondaryBtn {
    min-height: 54px;
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(96,165,250,0.18);
    color: #ffffff;
    font-size: 16px;
    font-weight: 900;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
  }

  .primaryBtn {
    min-height: 54px;
    border-radius: 16px;
    border: 1px solid rgba(96,165,250,0.28);
    background: linear-gradient(180deg, rgba(14,34,76,0.84) 0%, rgba(8,18,46,0.94) 100%);
    color: #ffffff;
    font-size: 16px;
    font-weight: 900;
    box-shadow: 0 0 26px rgba(37,99,235,0.16);
  }

  .tabsWrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .tabBtn {
    min-height: 54px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.70);
    font-size: 16px;
    font-weight: 900;
  }

  .tabBtn.active {
    color: #ffffff;
    border-color: rgba(96,165,250,0.28);
    background: linear-gradient(180deg, rgba(12,31,67,0.90) 0%, rgba(10,20,42,0.98) 100%);
    box-shadow: 0 0 24px rgba(37,99,235,0.14);
  }

  .sectionTitle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 4px 0 -4px;
    font-size: 15px;
    font-weight: 950;
    color: #e2e8f0;
    letter-spacing: 0.04em;
  }

  .sectionTitle.split {
    margin-top: 4px;
  }

  .helperText {
    font-size: 13px;
    font-weight: 800;
    color: rgba(255,255,255,0.52);
  }

  .categorySection {
    border-radius: 24px;
    padding: 14px;
  }

  .selectedSummary {
    border-radius: 22px;
    padding: 16px 18px;
    display: grid;
    gap: 8px;
  }

  .selectedSummaryTop {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .selectedStepPill,
  .selectedLockedPill {
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .selectedStepPill {
    background: rgba(14,165,233,0.14);
    border: 1px solid rgba(56,189,248,0.18);
    color: #bfdbfe;
  }

  .selectedLockedPill {
    background: rgba(34,197,94,0.18);
    border: 1px solid rgba(74,222,128,0.20);
    color: #bbf7d0;
  }

  .selectedSummary strong {
    color: #ffffff;
    font-size: 24px;
    line-height: 1.1;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .categoryRow {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }

  .categoryRow::-webkit-scrollbar {
    height: 8px;
  }

  .categoryRow::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.04);
    border-radius: 999px;
  }

  .categoryRow::-webkit-scrollbar-thumb {
    background: rgba(96,165,250,0.30);
    border-radius: 999px;
  }

  .categoryBtn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: max-content;
    min-height: 52px;
    padding: 0 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #ffffff;
    font-size: 15px;
    font-weight: 850;
    white-space: nowrap;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .categoryBtn.active {
    background: linear-gradient(180deg, rgba(18,54,123,0.86) 0%, rgba(8,25,59,0.98) 100%);
    border-color: rgba(96,165,250,0.38);
    box-shadow: 0 0 20px rgba(37,99,235,0.22);
  }

  .emoji {
    font-size: 22px;
    line-height: 1;
  }

  .flyerGrid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .flyerCard {
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(15,23,34,0.94) 0%, rgba(10,15,23,0.98) 100%);
    box-shadow: 0 24px 80px rgba(0,0,0,0.28);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .flyerCard:hover {
    transform: translateY(-4px);
    border-color: rgba(96,165,250,0.24);
    box-shadow: 0 28px 80px rgba(0,0,0,0.34), 0 0 24px rgba(37,99,235,0.10);
  }

  .flyerCard.selected {
    border-color: rgba(96,165,250,0.40);
    box-shadow:
      0 28px 90px rgba(0,0,0,0.36),
      0 0 0 1px rgba(96,165,250,0.20),
      0 0 28px rgba(37,99,235,0.18);
  }

  .flyerPreviewBtn {
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    text-align: left;
  }

  .styleBadge {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 6;
    background: rgba(8, 25, 59, 0.96);
    color: #ffffff;
    border: 1px solid rgba(96,165,250,0.22);
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.06em;
  }

  .flyerImageWrap {
    position: relative;
    width: 100%;
    background: #111827;
    overflow: hidden;
  }

  .flyerImage {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
  }

  .imageGlow {
    position: absolute;
    inset: auto 10% -40px 10%;
    height: 100px;
    background: radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0) 72%);
    pointer-events: none;
    z-index: 1;
  }

  .imageShade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 160px;
    background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(3,7,18,0.82) 100%);
    pointer-events: none;
    z-index: 2;
  }

  .qrOverlay {
    position: absolute;
    left: 50%;
    bottom: 16px;
    transform: translateX(-50%);
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: none;
    background: transparent;
  }

  .qrShell {
    width: 84px;
    height: 84px;
    padding: 6px;
    border-radius: 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: 0 14px 30px rgba(0,0,0,0.28);
  }

  .qrImage {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    display: block;
  }

  .qrText {
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.08em;
    color: #ffffff;
    text-shadow: 0 2px 12px rgba(0,0,0,0.92);
  }

  .flyerActionBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    background: linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(10,15,23,0.98) 100%);
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .flyerStatePill {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .flyerStatePill.locked {
    background: rgba(34,197,94,0.18);
    border: 1px solid rgba(74,222,128,0.20);
    color: #bbf7d0;
  }

  .flyerStatePill.idle {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.72);
  }

  .selectFlyerBtn {
    min-width: 152px;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 14px;
    border: 1px solid rgba(96,165,250,0.18);
    background: linear-gradient(180deg, rgba(12,31,67,0.86) 0%, rgba(8,18,46,0.96) 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 950;
    box-shadow: 0 0 16px rgba(37,99,235,0.10);
  }

  .selectFlyerBtn.selected {
    border-color: rgba(74,222,128,0.18);
    background: linear-gradient(180deg, rgba(20,83,45,0.94) 0%, rgba(18,60,34,0.98) 100%);
    box-shadow: 0 0 18px rgba(34,197,94,0.12);
  }

  .flyerMissing {
    width: 100%;
    aspect-ratio: 9 / 16;
    background: linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.98) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 22px;
    text-align: center;
  }

  .missingTitle {
    font-size: 18px;
    font-weight: 950;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .missingPath {
    font-size: 13px;
    line-height: 1.45;
    color: rgba(255,255,255,0.62);
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
    min-height: 78px;
    background: linear-gradient(180deg, rgba(15,23,34,0.94) 0%, rgba(10,15,23,0.98) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 22px;
    padding: 16px 18px;
    color: #ffffff;
    box-shadow: 0 20px 44px rgba(0,0,0,0.20);
  }

  .packCard.active {
    border-color: rgba(96,165,250,0.36);
    box-shadow:
      0 22px 50px rgba(0,0,0,0.28),
      0 0 24px rgba(37,99,235,0.16);
  }

  .packLeft {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .radioDot {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.16);
    color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 950;
    flex-shrink: 0;
    background: rgba(255,255,255,0.04);
  }

  .radioDot.active {
    color: #ffffff;
    border-color: rgba(96,165,250,0.34);
    background: linear-gradient(180deg, rgba(37,99,235,0.90) 0%, rgba(29,78,216,1) 100%);
    box-shadow: 0 0 18px rgba(37,99,235,0.18);
  }

  .packQty {
    font-size: 20px;
    font-weight: 950;
    color: #ffffff;
    text-transform: uppercase;
  }

  .packType {
    font-size: 13px;
    color: rgba(255,255,255,0.54);
    font-weight: 800;
  }

  .packPrice {
    font-size: 28px;
    font-weight: 950;
    color: #ffffff;
    letter-spacing: -0.03em;
  }

  .checkoutBtn {
    width: min(100%, 520px);
    min-height: 58px;
    margin: 4px auto 0;
    display: block;
    border-radius: 18px;
    border: 1px solid rgba(96,165,250,0.22);
    background: linear-gradient(180deg, rgba(10,20,42,0.98) 0%, rgba(6,12,28,1) 100%);
    color: #ffffff;
    font-size: 20px;
    font-weight: 950;
    letter-spacing: 0.03em;
    box-shadow: 0 0 28px rgba(37,99,235,0.14);
  }

  .freeFlyerCard {
    border-radius: 24px;
    padding: 20px;
  }

  .freeFlyerInner {
    min-height: 420px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px dashed rgba(255,255,255,0.18);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px;
    text-align: center;
  }

  .freeHeader {
    font-size: 16px;
    font-weight: 950;
    color: rgba(255,255,255,0.54);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .freeStoreName {
    font-size: 30px;
    font-weight: 950;
    color: #ffffff;
    margin-bottom: 10px;
    letter-spacing: -0.03em;
  }

  .freeStoreUrl {
    font-size: 15px;
    color: rgba(255,255,255,0.64);
    margin-bottom: 18px;
    word-break: break-word;
  }

  .freeQrWrap {
    width: 186px;
    height: 186px;
    border-radius: 22px;
    padding: 12px;
    background: rgba(255,255,255,0.96);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
    margin-bottom: 16px;
  }

  .freeQrImage {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 12px;
  }

  .freeScanText {
    font-size: 34px;
    font-weight: 950;
    color: #ffffff;
    letter-spacing: -0.03em;
  }

  .modalWrap {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(3, 7, 18, 0.86);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
  }

  .modalCard {
    width: min(100%, 560px);
    border-radius: 28px;
    overflow: hidden;
  }

  .modalTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    color: #ffffff;
  }

  .modalTitleWrap {
    display: grid;
    gap: 2px;
  }

  .modalTitleWrap strong {
    font-size: 18px;
    font-weight: 950;
  }

  .modalTitleWrap span {
    font-size: 12px;
    color: rgba(255,255,255,0.54);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.10em;
  }

  .modalClose {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #ffffff;
    font-size: 16px;
    font-weight: 950;
  }

  .modalImageWrap {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 16;
    background: #111827;
    overflow: hidden;
  }

  .modalImage {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    display: block;
  }

  .modalGlow {
    inset: auto 12% -50px 12%;
  }

  .modalShade {
    height: 180px;
  }

  @media (max-width: 1100px) {
    .flyerGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px) {
    .heroCard {
      align-items: flex-start;
    }

    h1 {
      font-size: 34px;
    }

    .storeButtons,
    .tabsWrap,
    .flyerGrid {
      grid-template-columns: 1fr;
    }

    .packPrice {
      font-size: 24px;
    }

    .storeTop {
      flex-direction: column;
    }
  }

  @media (max-width: 640px) {
    .page {
      padding: 14px 12px 110px;
    }

    .heroCard,
    .storeCard,
    .categorySection,
    .selectedSummary,
    .freeFlyerCard {
      padding: 16px;
      border-radius: 22px;
    }

    .heroIcon {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      font-size: 32px;
    }

    h1 {
      font-size: 30px;
    }

    .sectionTitle {
      flex-direction: column;
      align-items: flex-start;
    }

    .flyerActionBar {
      flex-direction: column;
      align-items: stretch;
    }

    .selectFlyerBtn {
      width: 100%;
      min-width: 0;
    }

    .packCard {
      padding: 14px;
    }

    .packPrice {
      font-size: 22px;
    }

    .qrShell {
      width: 72px;
      height: 72px;
      border-radius: 14px;
    }

    .qrText {
      font-size: 10px;
    }

    .checkoutBtn {
      width: 100%;
    }
  }
`;

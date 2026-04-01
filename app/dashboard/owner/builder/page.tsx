'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_url: string | null;
  logo_url: string | null;
  storefront_theme: ThemeMode | null;
};

export default function OwnerBuilderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    let active = true;

    async function loadBuilder() {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        if (!active) return;
        setOwnerId(user.id);

        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, owner_id, name, slug, phone, address, hero_url, logo_url, storefront_theme')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (restaurantError) {
          throw restaurantError;
        }

        if (!active) return;

        if (restaurant) {
          const row = restaurant as RestaurantRow;
          setRestaurantId(row.id);
          setName(row.name || '');
          setSlug(row.slug || '');
          setPhone(row.phone || '');
          setAddress(row.address || '');
          setHeroUrl(row.hero_url || '');
          setLogoUrl(row.logo_url || '');
          setTheme((row.storefront_theme as ThemeMode) || 'light');
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Could not load builder.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBuilder();

    return () => {
      active = false;
    };
  }, [router]);

  const normalizedSlug = useMemo(() => {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, [slug]);

  const previewLink = normalizedSlug
    ? `/store/${normalizedSlug}`
    : '/store/demo';

  const previewThemeClass =
    theme === 'dark' ? 'previewShell previewDark' : 'previewShell previewLight';

  async function handleSave() {
    try {
      if (!ownerId) return;

      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        owner_id: ownerId,
        name: name.trim() || null,
        slug: normalizedSlug || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        hero_url: heroUrl.trim() || null,
        logo_url: logoUrl.trim() || null,
        storefront_theme: theme,
      };

      if (restaurantId) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update(payload)
          .eq('id', restaurantId);

        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('restaurants')
          .insert(payload)
          .select('id')
          .single();

        if (insertError) throw insertError;
        setRestaurantId(inserted.id);
      }

      setSuccess('Builder saved.');
    } catch (err: any) {
      setError(err?.message || 'Could not save builder.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="shell">
          <div className="eyebrow">MenuFlow Owner</div>
          <h1>Loading builder...</h1>
        </section>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
            padding: 24px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .shell {
            max-width: 1100px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            border-radius: 32px;
            padding: 28px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
          }
          .eyebrow {
            color: #718096;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 12px;
          }
          h1 {
            margin: 0;
            color: #0f172a;
            font-size: clamp(34px, 6vw, 60px);
            line-height: 0.94;
            letter-spacing: -0.05em;
            font-weight: 900;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell">
        <div className="topRow">
          <div>
            <div className="eyebrow">MenuFlow Owner</div>
            <h1>Store Builder</h1>
            <p>Save your store details and choose the live storefront theme.</p>
          </div>

          <div className="topActions">
            <Link href={previewLink} className="ghostButton" target="_blank">
              Open Store
            </Link>
            <button type="button" className="primaryButton" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Builder'}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <div className="grid">
          <section className="panel">
            <div className="panelTitle">Store Details</div>

            <label className="field">
              <span className="label">Store name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hug Donut"
              />
            </label>

            <label className="field">
              <span className="label">Slug</span>
              <input
                className="input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="hug-donut"
              />
              <span className="helpText">Live URL: /store/{normalizedSlug || 'your-store'}</span>
            </label>

            <label className="field">
              <span className="label">Phone</span>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="3235553355"
              />
            </label>

            <label className="field">
              <span className="label">Address</span>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </label>

            <label className="field">
              <span className="label">Hero image URL</span>
              <input
                className="input"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="field">
              <span className="label">Logo image URL</span>
              <input
                className="input"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>

            <div className="themeWrap">
              <div className="label">Storefront theme</div>

              <div className="themeRow">
                <button
                  type="button"
                  className={theme === 'light' ? 'themeButton activeTheme' : 'themeButton'}
                  onClick={() => setTheme('light')}
                >
                  Light
                </button>

                <button
                  type="button"
                  className={theme === 'dark' ? 'themeButton activeTheme' : 'themeButton'}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelTitle">Live Preview</div>

            <div className={previewThemeClass}>
              <div className="previewHero">
                {heroUrl ? (
                  <img src={heroUrl} alt="Hero" className="previewHeroImage" />
                ) : (
                  <div className="previewHeroFallback" />
                )}

                <div className="previewOverlay" />

                <div className="previewHeroContent">
                  <div className="previewBrandRow">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="previewLogo" />
                    ) : (
                      <div className="previewLogoFallback">
                        {(name.trim() || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="previewName">{name.trim() || 'Your Store'}</div>
                      <div className="previewTag">Order direct. No fees.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="previewContent">
                <div className="previewThemeNote">
                  Theme: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                </div>

                <div className="previewInfoCard">
                  <div className="previewInfoLabel">Address</div>
                  <div className="previewInfoValue">{address.trim() || '123 Main St'}</div>
                </div>

                <div className="previewInfoCard">
                  <div className="previewInfoLabel">Phone</div>
                  <div className="previewInfoValue">{phone.trim() || '3235553355'}</div>
                </div>

                <div className="previewMenuCard">
                  <div className="previewMenuImage" />
                  <div className="previewMenuBody">
                    <div className="previewMenuName">Sample Item</div>
                    <div className="previewMenuPrice">$12.00</div>
                    <button type="button" className="previewAddButton">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .shell {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 32px;
          padding: 28px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }

        .topRow {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 18px;
          margin-bottom: 20px;
        }

        .eyebrow {
          color: #718096;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 6vw, 60px);
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        p {
          margin: 12px 0 0;
          color: #566274;
          font-size: 18px;
          line-height: 1.5;
          font-weight: 700;
        }

        .topActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primaryButton,
        .ghostButton {
          min-height: 52px;
          padding: 0 18px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .primaryButton {
          border: none;
          background: #0f172a;
          color: #fff;
          cursor: pointer;
        }

        .ghostButton {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: #0f172a;
        }

        .primaryButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          margin-bottom: 14px;
          border-radius: 18px;
          padding: 14px 16px;
          font-size: 15px;
          font-weight: 800;
        }

        .error {
          color: #991b1b;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.16);
        }

        .success {
          color: #166534;
          background: rgba(22, 163, 74, 0.08);
          border: 1px solid rgba(22, 163, 74, 0.16);
        }

        .grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 20px;
        }

        .panel {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 28px;
          padding: 20px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.04);
        }

        .panelTitle {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .field {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .label {
          color: #718096;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .input {
          width: 100%;
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          padding: 0 16px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
          outline: none;
        }

        .helpText {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .themeWrap {
          margin-top: 6px;
        }

        .themeRow {
          display: flex;
          gap: 10px;
        }

        .themeButton {
          min-width: 120px;
          min-height: 52px;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .activeTheme {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .previewShell {
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(15, 23, 42, 0.1);
        }

        .previewLight {
          background: #f8fbff;
          color: #0f172a;
        }

        .previewDark {
          background: #0f172a;
          color: #fff;
        }

        .previewHero {
          position: relative;
          height: 260px;
          overflow: hidden;
          background: #0f172a;
        }

        .previewHeroImage,
        .previewHeroFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
        }

        .previewOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.65) 100%);
        }

        .previewHeroContent {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: end;
          padding: 18px;
        }

        .previewBrandRow {
          display: flex;
          align-items: end;
          gap: 14px;
        }

        .previewLogo,
        .previewLogoFallback {
          width: 74px;
          height: 74px;
          border-radius: 20px;
          object-fit: cover;
          background: #fff;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: 900;
        }

        .previewName {
          color: #fff;
          font-size: 42px;
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .previewTag {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-weight: 800;
        }

        .previewContent {
          padding: 18px;
        }

        .previewThemeNote {
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 12px;
          color: inherit;
        }

        .previewInfoCard,
        .previewMenuCard {
          border-radius: 22px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.9);
          margin-bottom: 12px;
        }

        .previewDark .previewInfoCard,
        .previewDark .previewMenuCard {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .previewInfoCard {
          padding: 16px;
        }

        .previewInfoLabel {
          color: #718096;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .previewDark .previewInfoLabel {
          color: rgba(255, 255, 255, 0.65);
        }

        .previewInfoValue {
          margin-top: 6px;
          color: inherit;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.3;
        }

        .previewMenuImage {
          height: 180px;
          background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
        }

        .previewMenuBody {
          padding: 16px;
        }

        .previewMenuName {
          color: inherit;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.05;
        }

        .previewMenuPrice {
          margin-top: 8px;
          color: inherit;
          font-size: 22px;
          font-weight: 900;
        }

        .previewAddButton {
          margin-top: 14px;
          min-height: 50px;
          width: 100%;
          border: none;
          border-radius: 16px;
          background: #0f172a;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
        }

        .previewDark .previewAddButton {
          background: #fff;
          color: #0f172a;
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }

          .shell {
            padding: 18px;
            border-radius: 24px;
          }

          .topRow {
            flex-direction: column;
          }

          .topActions {
            width: 100%;
          }

          .primaryButton,
          .ghostButton {
            flex: 1 1 0;
          }

          .previewHero {
            height: 220px;
          }

          .previewName {
            font-size: 34px;
          }
        }
      `}</style>
    </main>
  );
}
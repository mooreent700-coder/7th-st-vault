'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Lang = 'en' | 'es';

type SettingsForm = {
  name: string;
  slug: string;
  phone: string;
  address: string;
  hours: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const copy = {
  en: {
    eyebrow: 'Store Settings',
    title: 'Storefront settings',
    subtitle:
      'Update the public business settings that control your storefront link, contact details, and operating hours.',
    languageLabel: 'Page Language',
    english: 'English',
    spanish: 'Spanish',
    name: 'Business Name',
    slug: 'Slug (URL)',
    phone: 'Phone',
    address: 'Address',
    hours: 'Hours',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved successfully',
    error: 'Something went wrong',
  },
  es: {
    eyebrow: 'Configuración de tienda',
    title: 'Configuración del storefront',
    subtitle:
      'Actualiza la configuración pública del negocio que controla el enlace de tu tienda, los datos de contacto y los horarios.',
    languageLabel: 'Idioma de la página',
    english: 'English',
    spanish: 'Spanish',
    name: 'Nombre del negocio',
    slug: 'Slug (URL)',
    phone: 'Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    save: 'Guardar cambios',
    saving: 'Guardando...',
    saved: 'Guardado correctamente',
    error: 'Algo salió mal',
  },
} as const;

export default function OwnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [form, setForm] = useState<SettingsForm>({
    name: '',
    slug: '',
    phone: '',
    address: '',
    hours: '',
  });

  const t = copy[lang];

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!user) {
          if (mounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, slug, phone, address, hours, owner_order_language, order_language')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!mounted) return;

        if (data) {
          setRestaurantId(data.id || null);
          setForm({
            name: data.name || '',
            slug: data.slug || '',
            phone: data.phone || '',
            address: data.address || '',
            hours: data.hours || '',
          });

          const savedLang =
            (data.owner_order_language || data.order_language || 'en')
              .toString()
              .toLowerCase() === 'es'
              ? 'es'
              : 'en';

          setLang(savedLang);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  function updateField<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!restaurantId) return;

    setSaving(true);
    setStatusMessage('');

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: form.name.trim(),
          slug: form.slug.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          hours: form.hours.trim(),
        })
        .eq('id', restaurantId);

      if (error) throw error;

      setStatusMessage(t.saved);
    } catch (error) {
      console.error(error);
      setStatusMessage(t.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="pageShell">
        <div className="pageWrap">
          <section className="heroCard">
            <div className="loadingState">Loading...</div>
          </section>
        </div>

        <style jsx>{`
          .pageShell {
            min-height: 100vh;
            background: radial-gradient(circle at top, rgba(255, 255, 255, 0.88), rgba(240, 241, 244, 0.96));
            padding: 20px;
          }
          .pageWrap {
            max-width: 920px;
            margin: 0 auto;
          }
          .heroCard {
            border-radius: 28px;
            border: 1px solid #e8ebef;
            background: rgba(255, 255, 255, 0.92);
            box-shadow: 0 20px 50px rgba(20, 23, 28, 0.05);
            padding: 28px;
          }
          .loadingState {
            min-height: 240px;
            display: grid;
            place-items: center;
            font-size: 1rem;
            font-weight: 700;
            color: #111827;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="pageShell">
      <div className="pageWrap">
        <section className="heroCard">
          <div className="heroTop">
            <div className="heroCopy">
              <div className="eyebrow">{t.eyebrow}</div>
              <h1>{t.title}</h1>
              <p>{t.subtitle}</p>
            </div>

            <div className="languageBlock">
              <span>{t.languageLabel}</span>
              <div className="pillGroup">
                <button
                  type="button"
                  className={lang === 'en' ? 'pillButton active' : 'pillButton'}
                  onClick={() => setLang('en')}
                >
                  {t.english}
                </button>
                <button
                  type="button"
                  className={lang === 'es' ? 'pillButton active' : 'pillButton'}
                  onClick={() => setLang('es')}
                >
                  {t.spanish}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="formCard">
          <div className="fieldGrid">
            <label className="field">
              <span>{t.name}</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={t.name}
              />
            </label>

            <label className="field">
              <span>{t.slug}</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder={t.slug}
              />
            </label>

            <label className="field">
              <span>{t.phone}</span>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder={t.phone}
              />
            </label>

            <label className="field">
              <span>{t.hours}</span>
              <input
                type="text"
                value={form.hours}
                onChange={(e) => updateField('hours', e.target.value)}
                placeholder={t.hours}
              />
            </label>

            <label className="field fieldFull">
              <span>{t.address}</span>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder={t.address}
              />
            </label>
          </div>

          <div className="footerRow">
            <div className="statusText">{statusMessage}</div>

            <button type="button" className="saveButton" onClick={handleSave} disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .pageShell {
          min-height: 100vh;
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.88), rgba(240, 241, 244, 0.96));
          padding: 20px;
        }

        .pageWrap {
          max-width: 920px;
          margin: 0 auto;
          display: grid;
          gap: 16px;
        }

        .heroCard,
        .formCard {
          border-radius: 28px;
          border: 1px solid #e8ebef;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 20px 50px rgba(20, 23, 28, 0.05);
        }

        .heroCard {
          padding: 28px;
        }

        .formCard {
          padding: 28px;
        }

        .heroTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .heroCopy {
          max-width: 580px;
        }

        .eyebrow {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 10px;
        }

        h1 {
          margin: 0;
          color: #0f172a;
          font-size: 2.2rem;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        p {
          margin: 14px 0 0;
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.65;
          font-weight: 500;
        }

        .languageBlock {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 220px;
        }

        .languageBlock span {
          color: #64748b;
          font-size: 0.84rem;
          font-weight: 700;
        }

        .pillGroup {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e5e9ee;
          background: #fff;
          padding: 4px;
          border-radius: 18px;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
        }

        .pillButton {
          border: 0;
          background: transparent;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 14px;
          color: #6b7280;
          font-weight: 700;
          cursor: pointer;
        }

        .pillButton.active {
          background: #eff6f5;
          color: #2f6463;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fieldFull {
          grid-column: 1 / -1;
        }

        .field span {
          color: #334155;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .field input {
          height: 58px;
          width: 100%;
          border-radius: 18px;
          border: 1px solid #dfe5ec;
          background: #fff;
          color: #0f172a;
          padding: 0 18px;
          font-size: 1rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .field input::placeholder {
          color: #9aa4b2;
          font-weight: 600;
        }

        .field input:focus {
          border-color: #b9c8d9;
          box-shadow: 0 0 0 4px rgba(191, 219, 254, 0.35);
        }

        .footerRow {
          margin-top: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .statusText {
          min-height: 24px;
          color: #6b7280;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .saveButton {
          min-width: 220px;
          height: 56px;
          border: 0;
          border-radius: 18px;
          background: #0f172a;
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
        }

        .saveButton:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .pageShell {
            padding: 12px;
          }

          .heroCard,
          .formCard {
            border-radius: 24px;
            padding: 20px;
          }

          h1 {
            font-size: 1.8rem;
          }

          .fieldGrid {
            grid-template-columns: 1fr;
          }

          .field input {
            height: 54px;
            border-radius: 16px;
          }

          .saveButton {
            width: 100%;
            min-width: 0;
          }

          .footerRow {
            align-items: stretch;
          }
        }
      `}</style>
    </main>
  );
}
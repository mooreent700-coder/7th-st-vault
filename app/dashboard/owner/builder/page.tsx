'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  hero_url: string | null;
  logo_url: string | null;
  owner_email?: string | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  name: string | null;
  price: number | string | null;
  description: string | null;
  image_url: string | null;
  created_at?: string | null;
};

type HoursRow = {
  enabled: boolean;
  open: string;
  close: string;
};

type HoursState = Record<DayKey, HoursRow>;

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const EMPTY_HOURS: HoursState = {
  mon: { enabled: false, open: '09:00', close: '17:00' },
  tue: { enabled: false, open: '09:00', close: '17:00' },
  wed: { enabled: false, open: '09:00', close: '17:00' },
  thu: { enabled: false, open: '09:00', close: '17:00' },
  fri: { enabled: false, open: '09:00', close: '17:00' },
  sat: { enabled: false, open: '09:00', close: '17:00' },
  sun: { enabled: false, open: '09:00', close: '17:00' },
};

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    eyebrow: 'Store Builder',
    title: 'Build your store in minutes!',
    subtitle: 'Update your store information, upload images, and menu items.',
    back: 'Back to Dashboard',
    preview: 'Live Store Preview',
    viewStore: 'View Store',
    images: 'Upload Store Banner',
    business: 'Business Info',
    storeName: 'Store Name',
    phone: 'Phone',
    address: 'Address',
    hours: 'Business Hours',
    signedIn: 'Signed in as:',
    save: 'Save Changes',
    saving: 'Saving...',
    menu: 'Menu',
    addItem: 'Add Menu Item',
    itemName: 'Item Name',
    price: 'Price',
    description: 'Description',
    uploadMenuImage: 'Upload Menu Image',
    uploadHint: 'Click to upload • PNG, JPG, or WEBP',
    imageOptional: 'Image optional',
    currentMenu: 'Current Menu',
    items: 'items',
    noItems: 'No menu items yet.',
    loading: 'Loading builder...',
    uploadFailed: 'Upload failed.',
    saveFailed: 'Save failed.',
    loadFailed: 'Failed to load builder.',
    itemAdded: 'Menu item added.',
    builderFailed: 'Builder action failed.',
    notSignedIn: 'You are not signed in.',
    noBusiness: 'Business name missing',
    noUrl: 'No URL yet',
    changeImage: 'Change Image',
    uploadStoreBanner: 'Upload Store Banner',
    closed: 'Closed',
    noHours: 'No hours selected yet',
    remove: 'Remove',
    previewTab: 'Preview',
    businessTab: 'Business',
    imagesTab: 'Images',
    menuTab: 'Menu',
  },
  es: {
    eyebrow: 'Store Builder',
    title: '¡Construye tu tienda en minutos!',
    subtitle: 'Actualiza la información de tu tienda, sube imágenes y productos.',
    back: 'Volver al Panel',
    preview: 'Vista Previa de la Tienda',
    viewStore: 'Ver Tienda',
    images: 'Subir Banner de la Tienda',
    business: 'Información del Negocio',
    storeName: 'Nombre',
    phone: 'Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    signedIn: 'Sesión iniciada como:',
    save: 'Guardar Cambios',
    saving: 'Guardando...',
    menu: 'Menú',
    addItem: 'Agregar Producto',
    itemName: 'Nombre del Producto',
    price: 'Precio',
    description: 'Descripción',
    uploadMenuImage: 'Subir Imagen del Menú',
    uploadHint: 'Haz clic para subir • PNG, JPG o WEBP',
    imageOptional: 'Imagen opcional',
    currentMenu: 'Menú Actual',
    items: 'productos',
    noItems: 'Todavía no hay productos.',
    loading: 'Cargando builder...',
    uploadFailed: 'La subida falló.',
    saveFailed: 'No se pudo guardar.',
    loadFailed: 'No se pudo cargar el builder.',
    itemAdded: 'Producto agregado.',
    builderFailed: 'La acción falló.',
    notSignedIn: 'No has iniciado sesión.',
    noBusiness: 'Falta nombre del negocio',
    noUrl: 'Todavía no hay URL',
    changeImage: 'Cambiar Imagen',
    uploadStoreBanner: 'Subir Banner de la Tienda',
    closed: 'Cerrado',
    noHours: 'Todavía no hay horario',
    remove: 'Eliminar',
    previewTab: 'Preview',
    businessTab: 'Business',
    imagesTab: 'Images',
    menuTab: 'Menu',
  },
};

const DAY_LABELS: Record<Lang, Record<DayKey, string>> = {
  en: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' },
  es: { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cloneHours(): HoursState {
  return JSON.parse(JSON.stringify(EMPTY_HOURS));
}

function parseHours(value: string | null): HoursState {
  if (!value) return cloneHours();

  try {
    const parsed = JSON.parse(value);
    const next = cloneHours();

    for (const day of DAY_ORDER) {
      const row = parsed?.[day];
      if (row && typeof row === 'object') {
        next[day] = {
          enabled: Boolean(row.enabled),
          open: typeof row.open === 'string' && row.open ? row.open : next[day].open,
          close: typeof row.close === 'string' && row.close ? row.close : next[day].close,
        };
      }
    }

    return next;
  } catch {
    return cloneHours();
  }
}

function serializeHours(hours: HoursState) {
  return JSON.stringify(hours);
}

function createFilePath(prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
}

function formatPrice(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

export default function BuilderPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const t = LABELS[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState<HoursState>(cloneHours());
  const [heroUrl, setHeroUrl] = useState('');
  const [heroPreview, setHeroPreview] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);

  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const menuInputRef = useRef<HTMLInputElement | null>(null);

  const safeSlug = useMemo(() => slugify(slug || businessName), [slug, businessName]);
  const previewHero = heroPreview || heroUrl;
  const menuCountText = `${menuItems.length} ${t.items}`;

  const hoursSummary = useMemo(() => {
    const rows = DAY_ORDER.filter((day) => hours[day].enabled).map((day) => {
      const row = hours[day];
      return `${DAY_LABELS[lang][day]} ${row.open} - ${row.close}`;
    });
    return rows.join(' • ') || t.noHours;
  }, [hours, lang, t.noHours]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = session?.user;
        if (!user) {
          alert(t.notSignedIn);
          router.push('/auth/login');
          return;
        }

        if (mounted) setUserEmail(user.email || '');

        let { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id, owner_id, name, slug, phone, address, hours, hero_url, logo_url, owner_email')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!restaurant) {
          const defaultName =
            (user.user_metadata?.business_name as string | undefined)?.trim() ||
            (user.user_metadata?.name as string | undefined)?.trim() ||
            'My Business';

          const created = await supabase
            .from('restaurants')
            .insert({
              owner_id: user.id,
              owner_email: user.email || null,
              name: defaultName,
              slug: slugify(defaultName),
              phone: null,
              address: null,
              hours: null,
              hero_url: null,
              logo_url: null,
            })
            .select('id, owner_id, name, slug, phone, address, hours, hero_url, logo_url, owner_email')
            .single();

          if (created.error) throw created.error;
          restaurant = created.data;
        }

        if (mounted && restaurant) {
          const row = restaurant as RestaurantRow;
          setRestaurantId(row.id);
          setBusinessName(row.name || '');
          setSlug(row.slug || '');
          setPhone(row.phone || '');
          setAddress(row.address || '');
          setHours(parseHours(row.hours || null));
          setHeroUrl(row.hero_url || '');
          setLogoUrl(row.logo_url || '');
        }

        if (restaurant?.id) {
          const items = await supabase
            .from('menu_items')
            .select('id, restaurant_id, name, price, description, image_url, created_at')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false });

          if (items.error) throw items.error;
          if (mounted) setMenuItems((items.data || []) as MenuItemRow[]);
        }
      } catch (error: any) {
        alert(error?.message || t.loadFailed);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [router, t.loadFailed, t.notSignedIn]);

  useEffect(() => {
    return () => {
      if (heroPreview.startsWith('blob:')) URL.revokeObjectURL(heroPreview);
      if (menuImagePreview.startsWith('blob:')) URL.revokeObjectURL(menuImagePreview);
    };
  }, [heroPreview, menuImagePreview]);

  async function uploadFile(bucket: string, prefix: string, file: File) {
    const path = createFilePath(prefix, file);

    const upload = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (upload.error) throw upload.error;

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function refreshMenuItems(id: string) {
    const items = await supabase
      .from('menu_items')
      .select('id, restaurant_id, name, price, description, image_url, created_at')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false });

    if (items.error) throw items.error;
    setMenuItems((items.data || []) as MenuItemRow[]);
  }

  async function handleHeroUpload(e: ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file || !restaurantId) return;

      if (heroPreview.startsWith('blob:')) URL.revokeObjectURL(heroPreview);
      setHeroPreview(URL.createObjectURL(file));
      setHeroUploading(true);

      const publicUrl = await uploadFile('heroes', 'hero', file);

      const updated = await supabase
        .from('restaurants')
        .update({ hero_url: publicUrl })
        .eq('id', restaurantId);

      if (updated.error) throw updated.error;

      setHeroUrl(publicUrl);
      setHeroPreview('');
    } catch (error: any) {
      alert(error?.message || t.uploadFailed);
    } finally {
      setHeroUploading(false);
      if (e.target) e.target.value = '';
    }
  }

  function handleMenuImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;

    if (menuImagePreview.startsWith('blob:')) URL.revokeObjectURL(menuImagePreview);

    setMenuImageFile(file);

    if (file) {
      setMenuImagePreview(URL.createObjectURL(file));
    } else {
      setMenuImagePreview('');
    }
  }

  function handleHoursToggle(day: DayKey) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function handleHoursTimeChange(day: DayKey, field: 'open' | 'close', value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      setSaving(true);
      const cleanSlug = slugify(businessName);

      const updated = await supabase
        .from('restaurants')
        .update({
          name: businessName.trim() || null,
          slug: cleanSlug || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          hours: serializeHours(hours),
        })
        .eq('id', restaurantId);

      if (updated.error) throw updated.error;

      setSlug(cleanSlug);
      alert(t.businessSaved);
    } catch (error: any) {
      alert(error?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMenuItem() {
    if (!restaurantId) return;

    try {
      setAddingItem(true);

      const cleanName = menuName.trim();
      const cleanDescription = menuDescription.trim();

      if (!cleanName) {
        alert(t.builderFailed);
        return;
      }

      const priceNumber = menuPrice.trim() ? Number(menuPrice) : null;
      if (menuPrice.trim() && Number.isNaN(priceNumber)) {
        alert('Price must be a valid number.');
        return;
      }

      let imageUrl: string | null = null;
      if (menuImageFile) {
        imageUrl = await uploadFile('menu-items', 'menu-item', menuImageFile);
      }

      const inserted = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: cleanName,
        price: priceNumber,
        description: cleanDescription || null,
        image_url: imageUrl,
      });

      if (inserted.error) throw inserted.error;

      setMenuName('');
      setMenuPrice('');
      setMenuDescription('');
      setMenuImageFile(null);
      if (menuImagePreview.startsWith('blob:')) URL.revokeObjectURL(menuImagePreview);
      setMenuImagePreview('');

      await refreshMenuItems(restaurantId);
      alert(t.itemAdded);
    } catch (error: any) {
      alert(error?.message || t.builderFailed);
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteMenuItem(id: string) {
    try {
      const deleted = await supabase.from('menu_items').delete().eq('id', id);
      if (deleted.error) throw deleted.error;
      await refreshMenuItems(restaurantId);
    } catch (error: any) {
      alert(error?.message || t.builderFailed);
    }
  }

  function handleViewStore() {
    if (!safeSlug) {
      alert(t.noUrl);
      return;
    }
    router.push(`/store/${safeSlug}`);
  }

  if (loading) {
    return (
      <main className="loadingPage">
        <div className="loadingBox">{t.loading}</div>
        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, #f6f8fd 0%, #eef3fb 100%);
          }
          .loadingBox {
            color: #142132;
            font-size: 18px;
            font-weight: 800;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <form onSubmit={handleSave} className="builderWrap">
        <section className="heroCard">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1 className="heroTitle">{t.title}</h1>
          <p className="heroText">{t.subtitle}</p>

          <div className="topRow">
            <Link href="/dashboard/owner" className="backLink">
              {t.back}
            </Link>

            <div className="langWrap">
              <button type="button" className={lang === 'en' ? 'langButton activeLang' : 'langButton'} onClick={() => setLang('en')}>
                EN
              </button>
              <button type="button" className={lang === 'es' ? 'langButton activeLang' : 'langButton'} onClick={() => setLang('es')}>
                ES
              </button>
            </div>
          </div>

          <div className="previewCard" id="preview-section">
            <div className="sectionTitle">{t.preview}</div>

            <div className="previewPhone">
              <div className="previewHeader">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="previewLogo" />
                ) : (
                  <div className="previewLogoFallback">M</div>
                )}
                <div className="previewBusiness">{businessName || t.noBusiness}</div>
              </div>

              {previewHero ? (
                <div className="previewHeroWrap">
                  <img src={previewHero} alt="Hero preview" className="previewHeroImage" />
                </div>
              ) : (
                <div className="previewHeroPlaceholder">{t.changeImage}</div>
              )}

              <button type="button" className="viewStoreButton" onClick={handleViewStore}>
                {t.viewStore}
              </button>
            </div>
          </div>
        </section>

        <section className="sectionCard" id="images-section">
          <div className="sectionTitle">{t.images}</div>

          <input
            ref={heroInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleHeroUpload}
            className="hiddenInput"
          />

          <button type="button" className="bannerUploadCard" onClick={() => heroInputRef.current?.click()}>
            {previewHero ? (
              <>
                <div className="bannerPreviewWrap">
                  <img src={previewHero} alt="Hero banner" className="bannerPreview" />
                </div>
                <div className="changeImageBar">{heroUploading ? t.loading : t.changeImage}</div>
              </>
            ) : (
              <>
                <span className="uploadTitle">{t.uploadStoreBanner}</span>
                <span className="uploadText">{t.uploadHint}</span>
              </>
            )}
          </button>
        </section>

        <section className="sectionCard" id="business-section">
          <div className="sectionTitle">{t.business}</div>

          <div className="fieldGrid">
            <div className="field">
              <label className="label">{t.storeName}</label>
              <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">URL</label>
              <input className="input" value={safeSlug ? `/store/${safeSlug}` : ''} placeholder={t.noUrl} disabled />
            </div>

            <div className="field">
              <label className="label">{t.phone}</label>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">{t.address}</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="field fullField">
              <label className="label">{t.hours}</label>
              <div className="hoursCard">
                {DAY_ORDER.map((day) => (
                  <div key={day} className="hoursRow">
                    <button type="button" className={hours[day].enabled ? 'dayToggle activeDay' : 'dayToggle'} onClick={() => handleHoursToggle(day)}>
                      {DAY_LABELS[lang][day]}
                    </button>

                    <div className="hoursInputs">
                      <input
                        type="time"
                        className="timeInput"
                        value={hours[day].open}
                        disabled={!hours[day].enabled}
                        onChange={(e) => handleHoursTimeChange(day, 'open', e.target.value)}
                      />
                      <span className="timeDash">—</span>
                      <input
                        type="time"
                        className="timeInput"
                        value={hours[day].close}
                        disabled={!hours[day].enabled}
                        onChange={(e) => handleHoursTimeChange(day, 'close', e.target.value)}
                      />
                    </div>

                    <div className="dayState">{hours[day].enabled ? '' : t.closed}</div>
                  </div>
                ))}

                <div className="hoursSummary">{hoursSummary}</div>
              </div>
            </div>

            <div className="field">
              <label className="label">{t.signedIn}</label>
              <input className="input" value={userEmail} disabled />
            </div>
          </div>
        </section>

        <section className="sectionCard" id="menu-section">
          <div className="sectionHead">
            <div>
              <div className="sectionTitle">{t.menu}</div>
              <div className="sectionMeta">{menuCountText}</div>
            </div>
          </div>

          <div className="menuAddCard">
            <div className="field">
              <label className="label">{t.itemName}</label>
              <input className="input" value={menuName} onChange={(e) => setMenuName(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">{t.price}</label>
              <input className="input" value={menuPrice} onChange={(e) => setMenuPrice(e.target.value)} inputMode="decimal" />
            </div>

            <div className="field">
              <label className="label">{t.description}</label>
              <textarea className="textarea" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">{t.uploadMenuImage}</label>

              <input
                ref={menuInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleMenuImageSelect}
                className="hiddenInput"
              />

              <button type="button" className="menuUploadCard" onClick={() => menuInputRef.current?.click()}>
                {menuImagePreview ? (
                  <div className="menuUploadPreviewWrap">
                    <img src={menuImagePreview} alt="Menu preview" className="menuUploadPreview" />
                  </div>
                ) : (
                  <>
                    <span className="uploadTitle">{t.uploadMenuImage}</span>
                    <span className="uploadText">{t.uploadHint}</span>
                    <span className="uploadText small">{t.imageOptional}</span>
                  </>
                )}
              </button>
            </div>

            <button type="button" className="primaryButton" disabled={addingItem} onClick={handleAddMenuItem}>
              {addingItem ? t.loading : t.addItem}
            </button>
          </div>

          <div className="currentMenuTitle">{t.currentMenu}</div>

          <div className="menuList">
            {menuItems.length === 0 ? (
              <div className="emptyBox">{t.noItems}</div>
            ) : (
              menuItems.map((item) => (
                <div key={item.id} className="menuItemCard">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name || 'Menu item'} className="menuItemImage" />
                  ) : (
                    <div className="menuItemImage placeholderImage" />
                  )}

                  <div className="menuItemBody">
                    <div className="menuItemTop">
                      <div className="menuItemName">{item.name || ''}</div>
                      <div className="menuItemPrice">{formatPrice(item.price)}</div>
                    </div>

                    {item.description ? <div className="menuItemDescription">{item.description}</div> : null}

                    <button type="button" className="removeButton" onClick={() => handleDeleteMenuItem(item.id)}>
                      {t.remove}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <button type="submit" className="saveButton" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>

        <nav className="bottomNav">
          <button type="button" className="navButton" onClick={() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span className="navLabel">{t.previewTab}</span>
          </button>
          <button type="button" className="navButton" onClick={() => document.getElementById('business-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span className="navLabel">{t.businessTab}</span>
          </button>
          <button type="button" className="navButton" onClick={() => document.getElementById('images-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span className="navLabel">{t.imagesTab}</span>
          </button>
          <button type="button" className="navButton" onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span className="navLabel">{t.menuTab}</span>
          </button>
        </nav>
      </form>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f6f8fd 0%, #eef3fb 100%);
          color: #142132;
          padding: 16px;
          padding-bottom: 120px;
          overflow-x: hidden;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .builderWrap {
          max-width: 760px;
          margin: 0 auto;
          display: grid;
          gap: 16px;
        }
        .heroCard,
        .sectionCard {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 30px;
          padding: 24px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }
        .eyebrow {
          color: #70798a;
          font-size: 18px;
          font-weight: 900;
          margin-bottom: 10px;
        }
        .heroTitle {
          margin: 0;
          font-size: clamp(40px, 9vw, 68px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 900;
          color: #142132;
        }
        .heroText {
          margin: 18px 0 0;
          color: #5a6473;
          font-size: 18px;
          line-height: 1.55;
          font-weight: 600;
          max-width: 620px;
        }
        .topRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
          margin-top: 20px;
        }
        .backLink {
          color: #142132;
          text-decoration: none;
          font-size: 18px;
          font-weight: 800;
        }
        .langWrap {
          display: inline-flex;
          border: 1px solid rgba(20, 33, 50, 0.12);
          background: #fff;
          padding: 5px;
          border-radius: 18px;
        }
        .langButton {
          border: none;
          background: transparent;
          color: #6b7686;
          min-width: 72px;
          min-height: 52px;
          border-radius: 14px;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
        }
        .activeLang {
          background: #0f172a;
          color: #fff;
        }
        .previewCard {
          margin-top: 24px;
          background: #ffffff;
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 26px;
          padding: 20px;
        }
        .sectionTitle {
          margin: 0 0 14px;
          color: #142132;
          font-size: clamp(26px, 5vw, 40px);
          line-height: 1.02;
          letter-spacing: -0.04em;
          font-weight: 900;
        }
        .sectionHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .sectionMeta {
          color: #70798a;
          font-size: 18px;
          font-weight: 800;
          margin-top: 6px;
        }
        .previewPhone {
          border-radius: 24px;
          background: #fbfdff;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 18px;
        }
        .previewHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .previewLogo,
        .previewLogoFallback {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .previewLogoFallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          color: #fff;
          font-size: 24px;
          font-weight: 900;
        }
        .previewBusiness {
          font-size: clamp(24px, 5vw, 38px);
          font-weight: 900;
          color: #142132;
          letter-spacing: -0.04em;
          line-height: 1.05;
          word-break: break-word;
        }
        .previewHeroWrap,
        .previewHeroPlaceholder {
          width: 100%;
          height: 220px;
          border-radius: 24px;
          overflow: hidden;
          background: #eef4ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .previewHeroImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .previewHeroPlaceholder {
          color: #5a6473;
          font-size: 18px;
          font-weight: 800;
          text-align: center;
          padding: 20px;
          border: 1px dashed rgba(20, 33, 50, 0.14);
        }
        .viewStoreButton,
        .primaryButton,
        .saveButton,
        .bannerUploadCard,
        .menuUploadCard {
          width: 100%;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 900;
          font-size: 20px;
        }
        .viewStoreButton,
        .primaryButton,
        .saveButton {
          background: #000;
          color: #fff;
          min-height: 68px;
        }
        .viewStoreButton {
          margin-top: 16px;
        }
        .bannerUploadCard,
        .menuUploadCard {
          min-height: 180px;
          margin-top: 12px;
          background: #f8fafc;
          color: #142132;
          border: 2px dashed rgba(20, 33, 50, 0.12);
          padding: 16px;
          position: relative;
          overflow: hidden;
        }
        .bannerPreviewWrap {
          width: 100%;
          height: 220px;
          border-radius: 20px;
          overflow: hidden;
        }
        .bannerPreview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .changeImageBar {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          min-height: 54px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.82);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 900;
          backdrop-filter: blur(6px);
        }
        .uploadTitle {
          display: block;
          font-size: 22px;
          font-weight: 900;
          text-align: center;
        }
        .uploadText {
          display: block;
          margin-top: 8px;
          color: #5a6473;
          font-size: 16px;
          line-height: 1.45;
          text-align: center;
          font-weight: 700;
        }
        .small {
          font-size: 14px;
        }
        .fieldGrid {
          display: grid;
          gap: 14px;
        }
        .field {
          min-width: 0;
        }
        .fullField {
          grid-column: 1 / -1;
        }
        .label {
          display: block;
          margin-bottom: 8px;
          color: #142132;
          font-size: 16px;
          font-weight: 800;
        }
        .input,
        .textarea,
        .timeInput {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(20, 33, 50, 0.1);
          background: #fff;
          color: #142132;
          font-size: 18px;
          font-weight: 600;
          padding: 16px 18px;
          outline: none;
          box-sizing: border-box;
        }
        .input:disabled,
        .timeInput:disabled {
          color: #7a8493;
          background: #f7f8fb;
        }
        .input,
        .timeInput {
          min-height: 60px;
        }
        .textarea {
          min-height: 130px;
          resize: vertical;
        }
        .hoursCard {
          border-radius: 20px;
          border: 1px solid rgba(20, 33, 50, 0.08);
          background: #fbfdff;
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .hoursRow {
          display: grid;
          grid-template-columns: 74px 1fr 70px;
          gap: 10px;
          align-items: center;
        }
        .dayToggle {
          min-height: 52px;
          border-radius: 14px;
          border: 1px solid rgba(20, 33, 50, 0.1);
          background: #fff;
          color: #6b7686;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
        }
        .activeDay {
          background: #0f172a;
          border-color: #0f172a;
          color: #fff;
        }
        .hoursInputs {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 8px;
          align-items: center;
        }
        .timeDash {
          color: #7a8493;
          font-weight: 800;
        }
        .dayState {
          text-align: right;
          color: #7a8493;
          font-size: 14px;
          font-weight: 800;
        }
        .hoursSummary {
          margin-top: 6px;
          border-top: 1px solid rgba(20, 33, 50, 0.08);
          padding-top: 12px;
          color: #5a6473;
          font-size: 15px;
          line-height: 1.5;
          font-weight: 700;
        }
        .hiddenInput {
          display: none;
        }
        .menuAddCard {
          display: grid;
          gap: 14px;
        }
        .menuUploadPreviewWrap {
          width: 100%;
          height: 210px;
          border-radius: 20px;
          overflow: hidden;
        }
        .menuUploadPreview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .currentMenuTitle {
          margin-top: 24px;
          color: #142132;
          font-size: 22px;
          font-weight: 900;
        }
        .menuList {
          margin-top: 14px;
          display: grid;
          gap: 14px;
        }
        .emptyBox {
          border-radius: 18px;
          background: #f7f8fb;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 22px;
          color: #6c7685;
          font-size: 18px;
          font-weight: 700;
        }
        .menuItemCard {
          border-radius: 24px;
          background: #fbfcfe;
          border: 1px solid rgba(20, 33, 50, 0.08);
          overflow: hidden;
        }
        .menuItemImage,
        .placeholderImage {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
          background: #eef2f7;
        }
        .placeholderImage {
          border-bottom: 1px dashed rgba(20, 33, 50, 0.12);
        }
        .menuItemBody {
          padding: 18px;
        }
        .menuItemTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }
        .menuItemName {
          color: #142132;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.08;
          word-break: break-word;
        }
        .menuItemPrice {
          color: #142132;
          font-size: 22px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .menuItemDescription {
          margin-top: 12px;
          color: #5a6473;
          font-size: 17px;
          line-height: 1.55;
          font-weight: 700;
          word-break: break-word;
        }
        .removeButton {
          margin-top: 16px;
          border: none;
          background: transparent;
          color: #dc2626;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          padding: 0;
        }
        .saveButton {
          position: sticky;
          bottom: 88px;
          z-index: 20;
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.15);
        }
        .bottomNav {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 30;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 22px;
          backdrop-filter: blur(12px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }
        .navButton {
          border: none;
          background: transparent;
          min-height: 48px;
          border-radius: 14px;
          cursor: pointer;
          padding: 0 4px;
        }
        .navLabel {
          color: #142132;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.2;
        }
        @media (min-width: 900px) {
          .page {
            padding-bottom: 40px;
          }
          .builderWrap {
            max-width: 1200px;
            grid-template-columns: minmax(0, 1fr) 400px;
            align-items: start;
          }
          .heroCard {
            grid-column: 1 / -1;
          }
          .sectionCard:nth-of-type(2),
          .sectionCard:nth-of-type(3),
          .sectionCard:nth-of-type(4) {
            grid-column: 1 / 2;
          }
          .saveButton {
            grid-column: 1 / 2;
            position: static;
          }
          .bottomNav {
            display: none;
          }
        }
        @media (max-width: 560px) {
          .heroCard,
          .sectionCard {
            padding: 20px;
            border-radius: 24px;
          }
          .topRow {
            grid-template-columns: 1fr;
          }
          .langWrap {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .langButton {
            width: 100%;
          }
          .previewHeroWrap,
          .previewHeroPlaceholder,
          .bannerPreviewWrap {
            height: 180px;
          }
          .heroTitle {
            font-size: clamp(34px, 12vw, 56px);
          }
          .sectionTitle {
            font-size: clamp(24px, 8vw, 34px);
          }
          .hoursRow {
            grid-template-columns: 1fr;
          }
          .dayState {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}

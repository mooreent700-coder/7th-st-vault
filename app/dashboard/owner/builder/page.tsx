'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

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
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
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

const BUCKETS = {
  hero: 'heroes',
  menuItem: 'menu-items',
} as const;

const copy = {
  en: {
    eyebrow: 'Store Builder',
    title: 'Build your store in minutes!',
    subtitle: 'Update your store information, upload images, menu items, and connect payments.',
    signedIn: 'Signed in as:',
    back: 'Back to Dashboard',
    preview: 'Live Store Preview',
    viewStore: 'View Store',
    banner: 'Upload Store Banner',
    business: 'Business Info',
    menu: 'Menu',
    payments: 'Payments',
    storeName: 'Store Name',
    phone: 'Phone',
    address: 'Address',
    hours: 'Hours',
    save: 'Save Changes',
    saving: 'Saving...',
    addMenuItem: 'Add Menu Item',
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
    notSignedIn: 'You are not signed in.',
    loadFailed: 'Failed to load builder.',
    uploadFailed: 'Upload failed.',
    saveFailed: 'Save failed.',
    businessSaved: 'Changes saved.',
    itemAdded: 'Menu item added.',
    builderFailed: 'Builder action failed.',
    noSlug: 'No URL yet',
    noBusiness: 'Business name missing',
    remove: 'Remove',
    connectStripe: 'Connect Stripe',
    refreshStripe: 'Refresh Stripe',
    incomplete: 'Not connected',
    connected: 'Connected',
    charges: 'Charges',
    payouts: 'Payouts',
    account: 'Account',
    changeImage: 'Change Image',
    itemNamePlaceholder: '',
    pricePlaceholder: '',
    descriptionPlaceholder: '',
    storeNamePlaceholder: '',
    phonePlaceholder: '',
    addressPlaceholder: '',
    hoursPlaceholder: '',
  },
  es: {
    eyebrow: 'Store Builder',
    title: '¡Construye tu tienda en minutos!',
    subtitle: 'Actualiza la información de tu tienda, sube imágenes, productos y conecta pagos.',
    signedIn: 'Sesión iniciada como:',
    back: 'Volver al Panel',
    preview: 'Vista Previa de la Tienda',
    viewStore: 'Ver Tienda',
    banner: 'Subir Banner de la Tienda',
    business: 'Información del Negocio',
    menu: 'Menú',
    payments: 'Pagos',
    storeName: 'Nombre',
    phone: 'Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    save: 'Guardar Cambios',
    saving: 'Guardando...',
    addMenuItem: 'Agregar Producto',
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
    notSignedIn: 'No has iniciado sesión.',
    loadFailed: 'No se pudo cargar el builder.',
    uploadFailed: 'La subida falló.',
    saveFailed: 'No se pudo guardar.',
    businessSaved: 'Cambios guardados.',
    itemAdded: 'Producto agregado.',
    builderFailed: 'La acción falló.',
    noSlug: 'Todavía no hay URL',
    noBusiness: 'Falta nombre del negocio',
    remove: 'Eliminar',
    connectStripe: 'Conectar Stripe',
    refreshStripe: 'Actualizar Stripe',
    incomplete: 'No conectado',
    connected: 'Conectado',
    charges: 'Cobros',
    payouts: 'Pagos',
    account: 'Cuenta',
    changeImage: 'Cambiar Imagen',
    itemNamePlaceholder: '',
    pricePlaceholder: '',
    descriptionPlaceholder: '',
    storeNamePlaceholder: '',
    phonePlaceholder: '',
    addressPlaceholder: '',
    hoursPlaceholder: '',
  },
} as const;

function formatPrice(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '$0.00';
  return `$${numeric.toFixed(2)}`;
}

function createFilePath(prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function BuilderPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>('en');
  const t = copy[lang];

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [heroPreview, setHeroPreview] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [stripeAccountId, setStripeAccountId] = useState('');
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeChargesEnabled, setStripeChargesEnabled] = useState(false);
  const [stripePayoutsEnabled, setStripePayoutsEnabled] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState('');

  const [saving, setSaving] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);

  const menuImageInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);

  const menuCountText = useMemo(() => `${menuItems.length} ${t.items}`, [menuItems.length, t.items]);

  useEffect(() => {
    let mounted = true;

    const loadBuilder = async () => {
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

        if (mounted) setUserEmail(user.email ?? '');

        let { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, owner_id, name, slug, phone, address, hours, hero_url, logo_url, owner_email')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (!restaurantData) {
          const defaultName =
            (user.user_metadata?.business_name as string | undefined)?.trim() ||
            (user.user_metadata?.name as string | undefined)?.trim() ||
            'My Business';

          const { data: createdRestaurant, error: insertError } = await supabase
            .from('restaurants')
            .insert({
              owner_id: user.id,
              owner_email: user.email ?? null,
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

          if (insertError) throw insertError;
          restaurantData = createdRestaurant;
        }

        const restaurant = restaurantData as RestaurantRow;

        if (restaurant && mounted) {
          setRestaurantId(restaurant.id);
          setBusinessName(restaurant.name ?? '');
          setSlug(restaurant.slug ?? '');
          setPhone(restaurant.phone ?? '');
          setAddress(restaurant.address ?? '');
          setHours(restaurant.hours ?? '');
          setHeroUrl(restaurant.hero_url ?? '');
          setLogoUrl(restaurant.logo_url ?? '');
        }

        if (restaurant?.id) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('menu_items')
            .select('id, restaurant_id, name, price, description, image_url, created_at')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false });

          if (itemsError) throw itemsError;
          if (mounted) setMenuItems((itemsData ?? []) as MenuItemRow[]);

          try {
            const response = await fetch(`/api/connect/status?restaurantId=${restaurant.id}`);
            if (response.ok) {
              const stripeData = await response.json();
              if (mounted) {
                setStripeAccountId(stripeData?.accountId ?? '');
                setStripeConnected(Boolean(stripeData?.connected));
                setStripeChargesEnabled(Boolean(stripeData?.chargesEnabled));
                setStripePayoutsEnabled(Boolean(stripeData?.payoutsEnabled));
              }
            }
          } catch {}
        }
      } catch (error: any) {
        alert(error?.message || t.loadFailed);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadBuilder();

    return () => {
      mounted = false;
    };
  }, [router, t.loadFailed, t.notSignedIn]);

  useEffect(() => {
    return () => {
      if (menuImagePreview && menuImagePreview.startsWith('blob:')) URL.revokeObjectURL(menuImagePreview);
      if (heroPreview && heroPreview.startsWith('blob:')) URL.revokeObjectURL(heroPreview);
    };
  }, [menuImagePreview, heroPreview]);

  const uploadFileToBucket = async (bucket: string, prefix: string, file: File) => {
    const path = createFilePath(prefix, file);

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const refreshMenuItems = async (targetRestaurantId: string) => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, name, price, description, image_url, created_at')
      .eq('restaurant_id', targetRestaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setMenuItems((data ?? []) as MenuItemRow[]);
  };

  const handleHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !restaurantId) return;

      if (heroPreview && heroPreview.startsWith('blob:')) URL.revokeObjectURL(heroPreview);
      const localUrl = URL.createObjectURL(file);
      setHeroPreview(localUrl);
      setHeroUploading(true);

      const publicUrl = await uploadFileToBucket(BUCKETS.hero, 'hero', file);

      const { error } = await supabase
        .from('restaurants')
        .update({ hero_url: publicUrl })
        .eq('id', restaurantId);

      if (error) throw error;

      setHeroUrl(publicUrl);
      setHeroPreview('');
    } catch (error: any) {
      alert(error?.message || t.uploadFailed);
    } finally {
      setHeroUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleMenuImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (menuImagePreview && menuImagePreview.startsWith('blob:')) URL.revokeObjectURL(menuImagePreview);

    setMenuImageFile(file);

    if (file) {
      const localUrl = URL.createObjectURL(file);
      setMenuImagePreview(localUrl);
    } else {
      setMenuImagePreview('');
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      setSaving(true);

      const generatedSlug = slugify(businessName.trim()) || slug;

      const { error } = await supabase
        .from('restaurants')
        .update({
          name: businessName.trim() || null,
          slug: generatedSlug || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          hours: hours.trim() || null,
        })
        .eq('id', restaurantId);

      if (error) throw error;

      setSlug(generatedSlug);
      alert(t.businessSaved);
    } catch (error: any) {
      alert(error?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!restaurantId) return;

    try {
      setAddingItem(true);

      const cleanName = menuName.trim();
      const cleanDescription = menuDescription.trim();
      const priceValue = menuPrice.trim();

      if (!cleanName && !priceValue && !cleanDescription && !menuImageFile) {
        alert(t.builderFailed);
        return;
      }

      const parsedPrice = priceValue ? Number(priceValue) : null;
      if (priceValue && (parsedPrice === null || Number.isNaN(parsedPrice))) {
        alert('Price must be a valid number.');
        return;
      }

      let imageUrl: string | null = null;
      if (menuImageFile) {
        imageUrl = await uploadFileToBucket(BUCKETS.menuItem, 'menu-item', menuImageFile);
      }

      const { error } = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: cleanName || null,
        price: parsedPrice,
        description: cleanDescription || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setMenuName('');
      setMenuPrice('');
      setMenuDescription('');
      setMenuImageFile(null);
      if (menuImagePreview && menuImagePreview.startsWith('blob:')) URL.revokeObjectURL(menuImagePreview);
      setMenuImagePreview('');

      await refreshMenuItems(restaurantId);
      alert(t.itemAdded);
    } catch (error: any) {
      alert(error?.message || t.builderFailed);
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      await refreshMenuItems(restaurantId);
    } catch (error: any) {
      alert(error?.message || t.builderFailed);
    }
  };

  const handleViewStore = () => {
    if (!slug) {
      alert(t.noSlug);
      return;
    }
    router.push(`/store/${slug}`);
  };

  const handleStripeConnect = async () => {
    try {
      setStripeLoading(true);
      const response = await fetch('/api/connect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to connect Stripe.');
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      alert(t.builderFailed);
    } catch (error: any) {
      alert(error?.message || t.builderFailed);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleStripeRefresh = async () => {
    try {
      setStripeLoading(true);
      const response = await fetch(`/api/connect/status?restaurantId=${restaurantId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || 'Unable to refresh Stripe.');

      setStripeAccountId(data?.accountId ?? '');
      setStripeConnected(Boolean(data?.connected));
      setStripeChargesEnabled(Boolean(data?.chargesEnabled));
      setStripePayoutsEnabled(Boolean(data?.payoutsEnabled));
    } catch (error: any) {
      alert(error?.message || t.builderFailed);
    } finally {
      setStripeLoading(false);
    }
  };

  const previewHero = heroPreview || heroUrl;

  if (loading) {
    return (
      <main className="loadingPage">
        <div className="loadingBox">{t.loading}</div>

        <style jsx>{`
          .loadingPage { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #f6f8fd 0%, #eef3fb 100%); padding: 24px; }
          .loadingBox { color: #142132; font-size: 18px; font-weight: 800; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
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
            <Link href="/dashboard/owner" className="backLink">{t.back}</Link>
            <div className="langWrap">
              <button type="button" className={lang === 'en' ? 'langButton activeLang' : 'langButton'} onClick={() => setLang('en')}>EN</button>
              <button type="button" className={lang === 'es' ? 'langButton activeLang' : 'langButton'} onClick={() => setLang('es')}>ES</button>
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

              <button type="button" className="viewStoreButton" onClick={handleViewStore}>{t.viewStore}</button>
            </div>
          </div>
        </section>

        <section className="sectionCard" id="images-section">
          <div className="sectionTitle">{t.banner}</div>

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
                <span className="uploadTitle">{heroUploading ? t.loading : t.banner}</span>
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
              <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t.storeNamePlaceholder} />
            </div>

            <div className="field">
              <label className="label">URL</label>
              <input className="input" value={slug ? `/store/${slug}` : ''} placeholder={t.noSlug} disabled />
            </div>

            <div className="field">
              <label className="label">{t.phone}</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} />
            </div>

            <div className="field">
              <label className="label">{t.address}</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} />
            </div>

            <div className="field">
              <label className="label">{t.hours}</label>
              <input className="input" value={hours} onChange={(e) => setHours(e.target.value)} placeholder={t.hoursPlaceholder} />
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
              <input className="input" value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder={t.itemNamePlaceholder} />
            </div>

            <div className="field">
              <label className="label">{t.price}</label>
              <input className="input" value={menuPrice} onChange={(e) => setMenuPrice(e.target.value)} placeholder={t.pricePlaceholder} inputMode="decimal" />
            </div>

            <div className="field">
              <label className="label">{t.description}</label>
              <textarea className="textarea" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} placeholder={t.descriptionPlaceholder} />
            </div>

            <div className="field">
              <label className="label">{t.uploadMenuImage}</label>

              <input
                ref={menuImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleMenuImageSelect}
                className="hiddenInput"
              />

              <button type="button" className="menuUploadCard" onClick={() => menuImageInputRef.current?.click()}>
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
              {addingItem ? t.loading : t.addMenuItem}
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

                    {item.description ? (
                      <div className="menuItemDescription">{item.description}</div>
                    ) : null}

                    <button type="button" className="removeButton" onClick={() => handleDeleteMenuItem(item.id)}>
                      {t.remove}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="sectionCard" id="payments-section">
          <div className="sectionTitle">{t.payments}</div>

          <div className="paymentGrid">
            <div className="paymentStat">
              <div className="paymentLabel">{t.account}</div>
              <div className="paymentValue">{stripeAccountId ? stripeAccountId : stripeConnected ? t.connected : t.incomplete}</div>
            </div>
            <div className="paymentStat">
              <div className="paymentLabel">{t.charges}</div>
              <div className="paymentValue">{stripeChargesEnabled ? t.connected : t.incomplete}</div>
            </div>
            <div className="paymentStat">
              <div className="paymentLabel">{t.payouts}</div>
              <div className="paymentValue">{stripePayoutsEnabled ? t.connected : t.incomplete}</div>
            </div>
          </div>

          <div className="paymentButtons">
            <button type="button" className="primaryButton" disabled={stripeLoading} onClick={handleStripeConnect}>
              {stripeLoading ? t.loading : t.connectStripe}
            </button>

            <button type="button" className="secondaryButton" disabled={stripeLoading} onClick={handleStripeRefresh}>
              {stripeLoading ? t.loading : t.refreshStripe}
            </button>
          </div>
        </section>

        <button type="submit" className="saveButton" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>

        <nav className="bottomNav">
          <button type="button" className="navButton" onClick={() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span className="navLabel">Preview</span></button>
          <button type="button" className="navButton" onClick={() => document.getElementById('business-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span className="navLabel">Business</span></button>
          <button type="button" className="navButton" onClick={() => document.getElementById('images-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span className="navLabel">Images</span></button>
          <button type="button" className="navButton" onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span className="navLabel">Menu</span></button>
          <button type="button" className="navButton" onClick={() => document.getElementById('payments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span className="navLabel">Payments</span></button>
        </nav>
      </form>

      <style jsx>{`
        .page { min-height: 100vh; background: linear-gradient(180deg, #f6f8fd 0%, #eef3fb 100%); color: #142132; padding: 16px; padding-bottom: 120px; overflow-x: hidden; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .builderWrap { max-width: 760px; margin: 0 auto; display: grid; gap: 16px; }
        .heroCard, .sectionCard { background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(20, 33, 50, 0.08); border-radius: 30px; padding: 24px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05); }
        .eyebrow { color: #70798a; font-size: 18px; font-weight: 900; margin-bottom: 10px; }
        .heroTitle { margin: 0; font-size: clamp(40px, 9vw, 68px); line-height: 0.95; letter-spacing: -0.06em; font-weight: 900; color: #142132; }
        .heroText { margin: 18px 0 0; color: #5a6473; font-size: 18px; line-height: 1.55; font-weight: 600; max-width: 620px; }
        .topRow { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; margin-top: 20px; }
        .backLink { color: #142132; text-decoration: none; font-size: 18px; font-weight: 800; }
        .langWrap { display: inline-flex; border: 1px solid rgba(20, 33, 50, 0.12); background: #fff; padding: 5px; border-radius: 18px; }
        .langButton { border: none; background: transparent; color: #6b7686; min-width: 72px; min-height: 52px; border-radius: 14px; font-size: 18px; font-weight: 900; cursor: pointer; }
        .activeLang { background: #0f172a; color: #fff; }
        .previewCard { margin-top: 24px; background: #ffffff; border: 1px solid rgba(20, 33, 50, 0.08); border-radius: 26px; padding: 20px; }
        .sectionTitle { margin: 0 0 14px; color: #142132; font-size: clamp(26px, 5vw, 40px); line-height: 1.02; letter-spacing: -0.04em; font-weight: 900; }
        .sectionHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .sectionMeta { color: #70798a; font-size: 18px; font-weight: 800; margin-top: 6px; }
        .previewPhone { border-radius: 24px; background: #fbfdff; border: 1px solid rgba(20, 33, 50, 0.08); padding: 18px; }
        .previewHeader { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .previewLogo, .previewLogoFallback { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; flex-shrink: 0; }
        .previewLogoFallback { display: flex; align-items: center; justify-content: center; background: #000; color: #fff; font-size: 24px; font-weight: 900; }
        .previewBusiness { font-size: clamp(24px, 5vw, 38px); font-weight: 900; color: #142132; letter-spacing: -0.04em; line-height: 1.05; word-break: break-word; }
        .previewHeroWrap, .previewHeroPlaceholder { width: 100%; height: 220px; border-radius: 24px; overflow: hidden; background: #eef4ff; display: flex; align-items: center; justify-content: center; }
        .previewHeroImage { width: 100%; height: 100%; object-fit: cover; display: block; }
        .previewHeroPlaceholder { color: #5a6473; font-size: 18px; font-weight: 800; text-align: center; padding: 20px; border: 1px dashed rgba(20, 33, 50, 0.14); }
        .viewStoreButton, .primaryButton, .saveButton, .secondaryButton, .bannerUploadCard, .menuUploadCard { width: 100%; border: none; border-radius: 20px; cursor: pointer; font-weight: 900; font-size: 20px; }
        .viewStoreButton, .primaryButton, .saveButton { background: #000; color: #fff; min-height: 68px; }
        .viewStoreButton { margin-top: 16px; }
        .secondaryButton { min-height: 64px; background: #fff; color: #142132; border: 1px solid rgba(20, 33, 50, 0.12); }
        .bannerUploadCard, .menuUploadCard { min-height: 180px; margin-top: 12px; background: #f8fafc; color: #142132; border: 2px dashed rgba(20, 33, 50, 0.12); padding: 16px; position: relative; overflow: hidden; }
        .bannerPreviewWrap { width: 100%; height: 220px; border-radius: 20px; overflow: hidden; }
        .bannerPreview { width: 100%; height: 100%; object-fit: cover; display: block; }
        .changeImageBar { position: absolute; left: 16px; right: 16px; bottom: 16px; min-height: 54px; border-radius: 16px; background: rgba(0, 0, 0, 0.82); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; backdrop-filter: blur(6px); }
        .uploadTitle { display: block; font-size: 22px; font-weight: 900; text-align: center; }
        .uploadText { display: block; margin-top: 8px; color: #5a6473; font-size: 16px; line-height: 1.45; text-align: center; font-weight: 700; }
        .small { font-size: 14px; }
        .fieldGrid { display: grid; gap: 14px; }
        .field { min-width: 0; }
        .label { display: block; margin-bottom: 8px; color: #142132; font-size: 16px; font-weight: 800; }
        .input, .textarea { width: 100%; border-radius: 18px; border: 1px solid rgba(20, 33, 50, 0.1); background: #fff; color: #142132; font-size: 18px; font-weight: 600; padding: 16px 18px; outline: none; box-sizing: border-box; }
        .input:disabled { color: #7a8493; background: #f7f8fb; }
        .input { min-height: 60px; }
        .textarea { min-height: 130px; resize: vertical; }
        .hiddenInput { display: none; }
        .menuAddCard { display: grid; gap: 14px; }
        .menuUploadPreviewWrap { width: 100%; height: 210px; border-radius: 20px; overflow: hidden; }
        .menuUploadPreview { width: 100%; height: 100%; object-fit: cover; display: block; }
        .currentMenuTitle { margin-top: 24px; color: #142132; font-size: 22px; font-weight: 900; }
        .menuList { margin-top: 14px; display: grid; gap: 14px; }
        .emptyBox { border-radius: 18px; background: #f7f8fb; border: 1px solid rgba(20, 33, 50, 0.08); padding: 22px; color: #6c7685; font-size: 18px; font-weight: 700; }
        .menuItemCard { border-radius: 24px; background: #fbfcfe; border: 1px solid rgba(20, 33, 50, 0.08); overflow: hidden; }
        .menuItemImage, .placeholderImage { width: 100%; height: 200px; object-fit: cover; display: block; background: #eef2f7; }
        .placeholderImage { border-bottom: 1px dashed rgba(20, 33, 50, 0.12); }
        .menuItemBody { padding: 18px; }
        .menuItemTop { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
        .menuItemName { color: #142132; font-size: 22px; font-weight: 900; line-height: 1.08; word-break: break-word; }
        .menuItemPrice { color: #142132; font-size: 22px; font-weight: 900; flex-shrink: 0; }
        .menuItemDescription { margin-top: 12px; color: #5a6473; font-size: 17px; line-height: 1.55; font-weight: 700; word-break: break-word; }
        .removeButton { margin-top: 16px; border: none; background: transparent; color: #dc2626; font-size: 18px; font-weight: 900; cursor: pointer; padding: 0; }
        .paymentGrid { display: grid; gap: 12px; }
        .paymentStat { border-radius: 20px; background: #f8f9fc; border: 1px solid rgba(20, 33, 50, 0.08); padding: 18px; }
        .paymentLabel { color: #6c7685; font-size: 15px; line-height: 1.35; font-weight: 800; }
        .paymentValue { margin-top: 8px; color: #142132; font-size: 18px; font-weight: 900; word-break: break-word; }
        .paymentButtons { margin-top: 16px; display: grid; gap: 12px; }
        .saveButton { position: sticky; bottom: 88px; z-index: 20; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.15); }
        .bottomNav { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 30; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; padding: 10px; background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(20, 33, 50, 0.08); border-radius: 22px; backdrop-filter: blur(12px); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); }
        .navButton { border: none; background: transparent; min-height: 48px; border-radius: 14px; cursor: pointer; padding: 0 4px; }
        .navLabel { color: #142132; font-size: 14px; font-weight: 800; line-height: 1.2; }
        @media (min-width: 900px) {
          .page { padding-bottom: 40px; }
          .builderWrap { max-width: 1200px; grid-template-columns: minmax(0, 1fr) 400px; align-items: start; }
          .heroCard { grid-column: 1 / -1; }
          .sectionCard:nth-of-type(2), .sectionCard:nth-of-type(3), .sectionCard:nth-of-type(4) { grid-column: 1 / 2; }
          .sectionCard:nth-of-type(5) { grid-column: 2 / 3; grid-row: 2 / span 3; position: sticky; top: 20px; }
          .saveButton { grid-column: 1 / 2; position: static; }
          .bottomNav { display: none; }
        }
        @media (max-width: 560px) {
          .heroCard, .sectionCard { padding: 20px; border-radius: 24px; }
          .topRow { grid-template-columns: 1fr; }
          .langWrap { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
          .langButton { width: 100%; }
          .previewHeroWrap, .previewHeroPlaceholder { height: 180px; }
          .bannerPreviewWrap { height: 180px; }
          .heroTitle { font-size: clamp(34px, 12vw, 56px); }
          .sectionTitle { font-size: clamp(24px, 8vw, 34px); }
        }
      `}</style>
    </main>
  );
}

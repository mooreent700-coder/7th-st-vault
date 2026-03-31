'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  FormEvent,
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
  logo: 'logos',
  menuItem: 'menu-items',
} as const;

const copy = {
  en: {
    eyebrow: 'Store Builder',
    title: 'Build your store, menu, and images',
    subtitle: 'Update your menu, store images, and storefront preview.',
    signedIn: 'Signed in as:',
    back: 'Back to Dashboard',
    businessInfo: 'Business Information',
    businessName: 'Business Name',
    storeSlug: 'Store URL',
    phone: 'Phone Number',
    address: 'Address',
    hours: 'Hours',
    saveBusiness: 'Save Business Info',
    savingBusiness: 'Saving...',
    addItem: 'Add Menu Item',
    itemName: 'Item Name',
    price: 'Price',
    description: 'Description',
    itemImage: 'Menu Item Image',
    uploadMenuImage: 'Upload Menu Image',
    uploadHint: 'Click to upload • PNG, JPG, or WEBP',
    imageOptional: 'Image optional',
    addingItem: 'Adding...',
    addMenuItem: 'Add Item',
    currentMenu: 'Current Menu',
    items: 'items',
    noItems: 'No menu items yet.',
    viewStore: 'View Store',
    storePreview: 'Store Preview',
    previewText: 'Live storefront preview',
    previewHero: 'Hero image preview will show here.',
    storeImages: 'Store Images',
    storeImagesText: 'Change hero and logo whenever you need.',
    heroImage: 'Hero Image',
    logoImage: 'Logo Image',
    uploadHero: 'Upload Hero',
    uploadLogo: 'Upload Logo',
    uploading: 'Uploading...',
    stripeTitle: 'Stripe Payments',
    stripeText:
      'Connect your Stripe account to receive payouts and let MenuFlow take the correct platform fee automatically.',
    platformFee: 'Platform fee',
    onboarding: 'Onboarding complete',
    charges: 'Charges enabled',
    payouts: 'Payouts enabled',
    incomplete: 'Onboarding incomplete',
    connectStripe: 'Connect Stripe',
    refreshStripe: 'Refresh Stripe',
    loading: 'Loading builder...',
    notSignedIn: 'You are not signed in.',
    loadFailed: 'Failed to load builder.',
    uploadFailed: 'Upload failed.',
    saveFailed: 'Save failed.',
    businessSaved: 'Business information saved.',
    itemAdded: 'Menu item added.',
    builderFailed: 'Builder action failed.',
    noSlug: 'No URL yet',
    noBusiness: 'Business name missing',
    phonePlaceholder: '(323) 555-1234',
    addressPlaceholder: '123 Main St, City, State',
    hoursPlaceholder: 'Mon-Sat 10am - 8pm',
    itemNamePlaceholder: 'Taco Plate',
    pricePlaceholder: '12.99',
    descriptionPlaceholder: 'Fresh food made to order',
    remove: 'Remove',
  },
  es: {
    eyebrow: 'Store Builder',
    title: 'Construye tu tienda, menú e imágenes',
    subtitle: 'Actualiza tu menú, imágenes y vista previa del storefront.',
    signedIn: 'Sesión iniciada como:',
    back: 'Volver al Panel',
    businessInfo: 'Información del Negocio',
    businessName: 'Nombre del Negocio',
    storeSlug: 'URL de la Tienda',
    phone: 'Número de Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    saveBusiness: 'Guardar Información',
    savingBusiness: 'Guardando...',
    addItem: 'Agregar Producto',
    itemName: 'Nombre del Producto',
    price: 'Precio',
    description: 'Descripción',
    itemImage: 'Imagen del Producto',
    uploadMenuImage: 'Subir Imagen del Menú',
    uploadHint: 'Haz clic para subir • PNG, JPG o WEBP',
    imageOptional: 'Imagen opcional',
    addingItem: 'Agregando...',
    addMenuItem: 'Agregar Producto',
    currentMenu: 'Menú Actual',
    items: 'productos',
    noItems: 'Todavía no hay productos.',
    viewStore: 'Ver Tienda',
    storePreview: 'Vista Previa de la Tienda',
    previewText: 'Vista real del storefront',
    previewHero: 'La vista previa del hero aparecerá aquí.',
    storeImages: 'Imágenes de la Tienda',
    storeImagesText: 'Cambia el hero y el logo cuando quieras.',
    heroImage: 'Imagen Hero',
    logoImage: 'Imagen Logo',
    uploadHero: 'Subir Hero',
    uploadLogo: 'Subir Logo',
    uploading: 'Subiendo...',
    stripeTitle: 'Pagos con Stripe',
    stripeText:
      'Conecta tu cuenta de Stripe para recibir pagos y permitir que MenuFlow cobre la tarifa correcta automáticamente.',
    platformFee: 'Tarifa de plataforma',
    onboarding: 'Onboarding completo',
    charges: 'Cobros habilitados',
    payouts: 'Pagos habilitados',
    incomplete: 'Onboarding incompleto',
    connectStripe: 'Conectar Stripe',
    refreshStripe: 'Actualizar Stripe',
    loading: 'Cargando builder...',
    notSignedIn: 'No has iniciado sesión.',
    loadFailed: 'No se pudo cargar el builder.',
    uploadFailed: 'La subida falló.',
    saveFailed: 'No se pudo guardar.',
    businessSaved: 'Información del negocio guardada.',
    itemAdded: 'Producto agregado.',
    builderFailed: 'La acción falló.',
    noSlug: 'Todavía no hay URL',
    noBusiness: 'Falta nombre del negocio',
    phonePlaceholder: '(323) 555-1234',
    addressPlaceholder: '123 Main St, City, State',
    hoursPlaceholder: 'Lun-Sáb 10am - 8pm',
    itemNamePlaceholder: 'Plato de tacos',
    pricePlaceholder: '12.99',
    descriptionPlaceholder: 'Comida fresca hecha al momento',
    remove: 'Eliminar',
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
  const [logoUrl, setLogoUrl] = useState('');

  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState('');

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);

  const menuImageInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const menuCountText = useMemo(() => {
    return `${menuItems.length} ${t.items}`;
  }, [menuItems.length, t.items]);

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

          if (mounted) {
            setMenuItems((itemsData ?? []) as MenuItemRow[]);
          }
        }
      } catch (error: any) {
        alert(error?.message || t.loadFailed);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBuilder();

    return () => {
      mounted = false;
    };
  }, [router, t.loadFailed, t.notSignedIn]);

  useEffect(() => {
    return () => {
      if (menuImagePreview && menuImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(menuImagePreview);
      }
    };
  }, [menuImagePreview]);

  const uploadFileToBucket = async (
    bucket: string,
    prefix: string,
    file: File
  ) => {
    const path = createFilePath(prefix, file);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
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

      setHeroUploading(true);

      const publicUrl = await uploadFileToBucket(BUCKETS.hero, 'hero', file);

      const { error } = await supabase
        .from('restaurants')
        .update({ hero_url: publicUrl })
        .eq('id', restaurantId);

      if (error) throw error;

      setHeroUrl(publicUrl);
    } catch (error: any) {
      alert(error?.message || t.uploadFailed);
    } finally {
      setHeroUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !restaurantId) return;

      setLogoUploading(true);

      const publicUrl = await uploadFileToBucket(BUCKETS.logo, 'logo', file);

      const { error } = await supabase
        .from('restaurants')
        .update({ logo_url: publicUrl })
        .eq('id', restaurantId);

      if (error) throw error;

      setLogoUrl(publicUrl);
    } catch (error: any) {
      alert(error?.message || t.uploadFailed);
    } finally {
      setLogoUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleMenuImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (menuImagePreview && menuImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(menuImagePreview);
    }

    setMenuImageFile(file);

    if (file) {
      const localUrl = URL.createObjectURL(file);
      setMenuImagePreview(localUrl);
    } else {
      setMenuImagePreview('');
    }
  };

  const handleSaveBusiness = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!restaurantId) return;

    try {
      setSavingBusiness(true);

      const generatedSlug = slugify(businessName.trim()) || slug;

      const { error } = await supabase
        .from('restaurants')
        .update({
          name: businessName.trim(),
          slug: generatedSlug,
          phone: phone.trim(),
          address: address.trim(),
          hours: hours.trim(),
        })
        .eq('id', restaurantId);

      if (error) throw error;

      setSlug(generatedSlug);
      alert(t.businessSaved);
    } catch (error: any) {
      alert(error?.message || t.saveFailed);
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleAddMenuItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!restaurantId) return;

    try {
      setAddingItem(true);

      const parsedPrice = Number(menuPrice);
      if (Number.isNaN(parsedPrice)) {
        alert('Price must be a valid number.');
        return;
      }

      let imageUrl: string | null = null;

      if (menuImageFile) {
        imageUrl = await uploadFileToBucket(BUCKETS.menuItem, 'menu-item', menuImageFile);
      }

      const { error } = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: menuName.trim(),
        price: parsedPrice,
        description: menuDescription.trim(),
        image_url: imageUrl,
      });

      if (error) throw error;

      setMenuName('');
      setMenuPrice('');
      setMenuDescription('');
      setMenuImageFile(null);

      if (menuImagePreview && menuImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(menuImagePreview);
      }
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

  if (loading) {
    return (
      <main className="loadingPage">
        <div className="loadingBox">{t.loading}</div>

        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #f6f8fd 0%, #eef3fb 100%);
            padding: 24px;
          }

          .loadingBox {
            color: #142132;
            font-size: 18px;
            font-weight: 800;
            font-family:
              Inter,
              ui-sans-serif,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              'Segoe UI',
              sans-serif;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="heroTop">
          <div className="heroLeft">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1 className="heroTitle">{t.title}</h1>
            <p className="heroText">{t.subtitle}</p>
            <div className="signedIn">
              {t.signedIn} <strong>{userEmail}</strong>
            </div>
          </div>

          <div className="heroRight">
            <Link href="/dashboard/owner" className="backButton">
              {t.back}
            </Link>

            <div className="langWrap">
              <button
                type="button"
                className={lang === 'en' ? 'langButton activeLang' : 'langButton'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'es' ? 'langButton activeLang' : 'langButton'}
                onClick={() => setLang('es')}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="contentGrid">
        <div className="leftCol">
          <form onSubmit={handleSaveBusiness} className="card">
            <h2 className="cardTitle">{t.businessInfo}</h2>

            <label className="label">{t.businessName}</label>
            <input
              className="input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t.noBusiness}
              required
            />

            <label className="label">{t.storeSlug}</label>
            <input
              className="input"
              value={slug ? `/store/${slug}` : ''}
              placeholder={t.noSlug}
              disabled
            />

            <label className="label">{t.phone}</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
            />

            <label className="label">{t.address}</label>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.addressPlaceholder}
            />

            <label className="label">{t.hours}</label>
            <input
              className="input"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder={t.hoursPlaceholder}
            />

            <button type="submit" className="primaryButton" disabled={savingBusiness}>
              {savingBusiness ? t.savingBusiness : t.saveBusiness}
            </button>
          </form>

          <div className="card">
            <h2 className="cardTitle">{t.storeImages}</h2>
            <p className="muted imageText">{t.storeImagesText}</p>

            <div className="imageGrid">
              <div>
                <div className="label">{t.heroImage}</div>

                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleHeroUpload}
                  className="hiddenInput"
                />

                <button
                  type="button"
                  className="imageUploadBox"
                  onClick={() => heroInputRef.current?.click()}
                >
                  {heroUrl ? (
                    <div className="imagePreviewWrap">
                      <img src={heroUrl} alt="Hero" className="imagePreview" />
                    </div>
                  ) : (
                    <>
                      <span className="uploadTitle">
                        {heroUploading ? t.uploading : t.uploadHero}
                      </span>
                      <span className="uploadText">{t.uploadHint}</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <div className="label">{t.logoImage}</div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hiddenInput"
                />

                <button
                  type="button"
                  className="imageUploadBox"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUrl ? (
                    <div className="imagePreviewWrap">
                      <img src={logoUrl} alt="Logo" className="imagePreview" />
                    </div>
                  ) : (
                    <>
                      <span className="uploadTitle">
                        {logoUploading ? t.uploading : t.uploadLogo}
                      </span>
                      <span className="uploadText">{t.uploadHint}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddMenuItem} className="card">
            <div className="cardTop">
              <div>
                <h2 className="cardTitle">{t.addItem}</h2>
                <div className="muted">{menuCountText}</div>
              </div>

              <button type="button" className="secondaryButton" onClick={handleViewStore}>
                {t.viewStore}
              </button>
            </div>

            <label className="label">{t.itemName}</label>
            <input
              className="input"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder={t.itemNamePlaceholder}
              required
            />

            <label className="label">{t.price}</label>
            <input
              className="input"
              value={menuPrice}
              onChange={(e) => setMenuPrice(e.target.value)}
              placeholder={t.pricePlaceholder}
              inputMode="decimal"
              required
            />

            <label className="label">{t.description}</label>
            <textarea
              className="textarea"
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              required
            />

            <label className="label">{t.itemImage}</label>
            <input
              ref={menuImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleMenuImageSelect}
              className="hiddenInput"
            />

            <button
              type="button"
              className="uploadBox"
              onClick={() => menuImageInputRef.current?.click()}
            >
              {menuImagePreview ? (
                <div className="imagePreviewWrap">
                  <img
                    src={menuImagePreview}
                    alt="Menu preview"
                    className="imagePreview"
                  />
                </div>
              ) : (
                <>
                  <span className="uploadTitle">{t.uploadMenuImage}</span>
                  <span className="uploadText">{t.uploadHint}</span>
                  <span className="uploadText small">{t.imageOptional}</span>
                </>
              )}
            </button>

            <button type="submit" className="primaryButton" disabled={addingItem}>
              {addingItem ? t.addingItem : t.addMenuItem}
            </button>
          </form>

          <div className="card">
            <div className="cardTop">
              <div>
                <h2 className="cardTitle">{t.currentMenu}</h2>
                <div className="muted">{menuCountText}</div>
              </div>
            </div>

            <div className="menuList">
              {menuItems.length === 0 ? (
                <div className="emptyBox">{t.noItems}</div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="menuItemCard">
                    <div className="menuItemTop">
                      <div className="menuItemInfo">
                        <div className="menuItemName">{item.name || 'Untitled item'}</div>
                        <div className="menuItemPrice">{formatPrice(item.price)}</div>
                      </div>

                      <div className="menuItemActions">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name || 'Menu item'}
                            className="menuThumb"
                          />
                        ) : null}

                        <button
                          type="button"
                          className="removeButton"
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>

                    {item.description ? (
                      <div className="menuItemDescription">{item.description}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rightCol">
          <div className="card previewCard">
            <div className="cardTop">
              <div>
                <h2 className="cardTitle">{t.storePreview}</h2>
                <div className="muted">{t.previewText}</div>
              </div>

              <div className="slugTag">/store/{slug || t.noSlug}</div>
            </div>

            <div className="previewPhone">
              {logoUrl ? (
                <div className="previewLogoWrap">
                  <img src={logoUrl} alt="Logo preview" className="previewLogo" />
                </div>
              ) : null}

              <div className="previewBusiness">{businessName || t.noBusiness}</div>

              {heroUrl ? (
                <div className="previewHeroWrap">
                  <img src={heroUrl} alt="Hero preview" className="previewHeroImage" />
                </div>
              ) : (
                <div className="previewHeroPlaceholder">{t.previewHero}</div>
              )}

              <div className="previewMenuSection">
                {menuItems.length === 0 ? (
                  <div className="previewEmpty">{t.noItems}</div>
                ) : (
                  menuItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="previewMenuItem">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name || 'Menu preview'}
                          className="previewMenuImage"
                        />
                      ) : null}

                      <div className="previewMenuText">
                        <div className="previewMenuName">{item.name}</div>
                        <div className="previewMenuPrice">{formatPrice(item.price)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="cardTitle">{t.stripeTitle}</h2>
            <p className="muted">{t.stripeText}</p>

            <div className="stripeGrid">
              <div className="stripeStat">
                <div className="stripeLabel">{t.platformFee}</div>
                <div className="stripeValue">--</div>
              </div>
              <div className="stripeStat">
                <div className="stripeLabel">{t.onboarding}</div>
                <div className="stripeValue">{t.incomplete}</div>
              </div>
              <div className="stripeStat">
                <div className="stripeLabel">{t.charges}</div>
                <div className="stripeValue">--</div>
              </div>
              <div className="stripeStat">
                <div className="stripeLabel">{t.payouts}</div>
                <div className="stripeValue">--</div>
              </div>
            </div>

            <div className="stripeButtons">
              <button type="button" className="primaryButton mutedButton">
                {t.connectStripe}
              </button>
              <button type="button" className="secondaryButton">
                {t.refreshStripe}
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f6f8fd 0%, #eef3fb 100%);
          color: #142132;
          padding: 18px;
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

        .hero {
          max-width: 1440px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 34px;
          padding: 28px;
          box-shadow: 0 20px 46px rgba(15, 23, 42, 0.06);
        }

        .heroTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .heroLeft {
          max-width: 860px;
        }

        .eyebrow {
          color: #5a6473;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .heroTitle {
          margin: 14px 0 0;
          font-size: clamp(42px, 7vw, 82px);
          line-height: 0.96;
          letter-spacing: -0.06em;
          font-weight: 900;
          color: #142132;
          max-width: 760px;
        }

        .heroText {
          margin-top: 18px;
          color: #5a6473;
          font-size: clamp(18px, 2vw, 28px);
          line-height: 1.5;
          font-weight: 600;
          max-width: 780px;
        }

        .signedIn {
          margin-top: 20px;
          color: #5a6473;
          font-size: 16px;
          font-weight: 700;
        }

        .signedIn strong {
          color: #142132;
        }

        .heroRight {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .backButton,
        .primaryButton,
        .secondaryButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: none;
          cursor: pointer;
          font-weight: 900;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .backButton {
          min-height: 62px;
          padding: 0 28px;
          border-radius: 20px;
          background: #fff;
          border: 1px solid rgba(20, 33, 50, 0.1);
          color: #142132;
          font-size: 18px;
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
          min-width: 70px;
          min-height: 58px;
          border-radius: 14px;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
        }

        .activeLang {
          background: #0f172a;
          color: #fff;
        }

        .contentGrid {
          max-width: 1440px;
          margin: 18px auto 0;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
          gap: 20px;
          align-items: start;
        }

        .leftCol,
        .rightCol {
          display: grid;
          gap: 20px;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 30px;
          padding: 26px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
          width: 100%;
          box-sizing: border-box;
        }

        .cardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cardTitle {
          margin: 0;
          color: #142132;
          font-size: clamp(30px, 3vw, 52px);
          line-height: 1.02;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .muted {
          margin-top: 10px;
          color: #5a6473;
          font-size: 18px;
          line-height: 1.5;
          font-weight: 700;
        }

        .label {
          display: block;
          margin-top: 18px;
          color: #142132;
          font-size: 16px;
          font-weight: 800;
        }

        .input,
        .textarea {
          width: 100%;
          margin-top: 10px;
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

        .input:disabled {
          color: #7a8493;
          background: #f7f8fb;
        }

        .input {
          min-height: 64px;
        }

        .textarea {
          min-height: 150px;
          resize: vertical;
        }

        .hiddenInput {
          display: none;
        }

        .uploadBox,
        .imageUploadBox {
          width: 100%;
          margin-top: 10px;
          min-height: 220px;
          border-radius: 24px;
          border: 2px dashed rgba(20, 33, 50, 0.12);
          background: #f8fafc;
          color: #142132;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          padding: 18px;
          cursor: pointer;
          box-sizing: border-box;
        }

        .uploadTitle {
          font-size: 20px;
          font-weight: 900;
          text-align: center;
        }

        .uploadText {
          color: #5a6473;
          font-size: 16px;
          line-height: 1.45;
          text-align: center;
          font-weight: 700;
        }

        .uploadText.small {
          font-size: 14px;
        }

        .imagePreviewWrap {
          width: 100%;
          height: 100%;
          min-height: 180px;
          border-radius: 20px;
          overflow: hidden;
        }

        .imagePreview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 20px;
        }

        .primaryButton,
        .secondaryButton {
          min-height: 70px;
          border-radius: 20px;
          font-size: 20px;
          margin-top: 18px;
          padding: 0 24px;
        }

        .primaryButton {
          width: 100%;
          background: #000;
          color: #fff;
        }

        .secondaryButton {
          background: #fff;
          color: #142132;
          border: 1px solid rgba(20, 33, 50, 0.12);
        }

        .mutedButton {
          background: #000;
          color: #fff;
        }

        .menuList {
          margin-top: 18px;
          display: grid;
          gap: 14px;
        }

        .emptyBox {
          margin-top: 8px;
          border-radius: 18px;
          background: #f7f8fb;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 22px;
          color: #6c7685;
          font-size: 18px;
          font-weight: 700;
        }

        .menuItemCard {
          border-radius: 20px;
          background: #f9fbff;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 16px;
        }

        .menuItemTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .menuItemInfo {
          min-width: 0;
        }

        .menuItemActions {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-shrink: 0;
        }

        .menuItemName {
          color: #142132;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.1;
        }

        .menuItemPrice {
          margin-top: 8px;
          color: #5a6473;
          font-size: 18px;
          font-weight: 900;
        }

        .menuItemDescription {
          margin-top: 12px;
          color: #5a6473;
          font-size: 15px;
          line-height: 1.55;
          font-weight: 700;
        }

        .menuThumb {
          width: 84px;
          height: 84px;
          object-fit: cover;
          border-radius: 16px;
          flex-shrink: 0;
        }

        .removeButton {
          border: none;
          background: transparent;
          color: #dc2626;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          padding: 0;
        }

        .previewCard {
          position: sticky;
          top: 18px;
        }

        .slugTag {
          color: #6c7685;
          font-size: 16px;
          font-weight: 800;
          word-break: break-word;
        }

        .previewPhone {
          margin-top: 18px;
          border-radius: 30px;
          border: 1px solid rgba(20, 33, 50, 0.08);
          background: #fbfdff;
          padding: 20px;
          overflow: hidden;
        }

        .previewLogoWrap {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .previewLogo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .previewBusiness {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 900;
          color: #142132;
          letter-spacing: -0.04em;
          line-height: 1.05;
          word-break: break-word;
        }

        .previewHeroWrap {
          margin-top: 18px;
          width: 100%;
          height: 220px;
          border-radius: 24px;
          overflow: hidden;
          background: #eef4ff;
        }

        .previewHeroImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .previewHeroPlaceholder {
          margin-top: 18px;
          border-radius: 24px;
          min-height: 220px;
          background: #eef4ff;
          border: 1px dashed rgba(20, 33, 50, 0.14);
          color: #5a6473;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px;
          font-size: 18px;
          line-height: 1.5;
          font-weight: 900;
        }

        .previewMenuSection {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .previewEmpty {
          border-radius: 20px;
          background: #fff;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 18px;
          color: #6c7685;
          font-size: 16px;
          font-weight: 800;
        }

        .previewMenuItem {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 12px;
        }

        .previewMenuImage {
          width: 68px;
          height: 68px;
          border-radius: 14px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .previewMenuText {
          min-width: 0;
        }

        .previewMenuName {
          font-size: 18px;
          color: #142132;
          font-weight: 900;
          line-height: 1.15;
        }

        .previewMenuPrice {
          margin-top: 6px;
          color: #5a6473;
          font-size: 15px;
          font-weight: 900;
        }

        .imageGrid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .imageText {
          max-width: 580px;
        }

        .stripeGrid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .stripeStat {
          border-radius: 20px;
          background: #f8f9fc;
          border: 1px solid rgba(20, 33, 50, 0.08);
          padding: 18px;
        }

        .stripeLabel {
          color: #6c7685;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 800;
        }

        .stripeValue {
          margin-top: 10px;
          color: #142132;
          font-size: 18px;
          line-height: 1.4;
          font-weight: 900;
          word-break: break-word;
        }

        .stripeButtons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .stripeButtons :global(button) {
          flex: 1 1 220px;
          margin-top: 0;
        }

        @media (max-width: 980px) {
          .page {
            padding: 12px;
          }

          .hero {
            padding: 20px;
            border-radius: 26px;
          }

          .heroTitle {
            font-size: clamp(34px, 12vw, 58px);
          }

          .heroText {
            font-size: 18px;
          }

          .backButton {
            width: 100%;
          }

          .contentGrid {
            grid-template-columns: 1fr;
          }

          .previewCard {
            position: static;
          }

          .card {
            padding: 20px;
            border-radius: 24px;
          }

          .cardTitle {
            font-size: clamp(26px, 9vw, 40px);
          }

          .input,
          .textarea {
            font-size: 16px;
          }

          .imageGrid,
          .stripeGrid {
            grid-template-columns: 1fr;
          }

          .uploadBox,
          .imageUploadBox {
            min-height: 180px;
          }

          .previewHeroWrap,
          .previewHeroPlaceholder {
            min-height: 180px;
            height: 180px;
          }
        }
      `}</style>
    </main>
  );
}

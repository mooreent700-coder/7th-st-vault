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
    subtitle: 'Manage business info, store images, menu items, and preview everything in one place.',
    signedIn: 'Signed in as:',
    back: 'Back to Dashboard',
    businessInfo: 'Business Information',
    businessName: 'Business Name',
    storeUrl: 'Store URL',
    phone: 'Phone Number',
    address: 'Address',
    hours: 'Hours',
    saveBusiness: 'Save Business Info',
    savingBusiness: 'Saving...',
    addItemTitle: 'Add Menu Item',
    itemName: 'Item Name',
    price: 'Price',
    description: 'Description',
    itemImage: 'Menu Item Image',
    uploadMenuImage: 'Upload Menu Image',
    uploadHero: 'Upload Hero Image',
    uploadLogo: 'Upload Logo Image',
    uploadHint: 'PNG / JPG / WEBP',
    addItem: 'Add Item',
    addingItem: 'Adding...',
    currentMenu: 'Menu',
    items: 'items',
    noItems: 'No menu items yet.',
    viewStore: 'View Store',
    previewTitle: 'Live Store Preview',
    previewText: 'This is how the storefront is shaping up.',
    previewHero: 'Hero image preview will show here.',
    storeImages: 'Store Images',
    heroImage: 'Hero Image',
    logoImage: 'Logo Image',
    uploading: 'Uploading...',
    loadFailed: 'Failed to load builder.',
    notSignedIn: 'You are not signed in.',
    uploadFailed: 'Upload failed.',
    saveFailed: 'Save failed.',
    businessSaved: 'Business information saved.',
    itemAdded: 'Menu item added.',
    builderFailed: 'Builder action failed.',
    noSlug: 'No slug yet',
    noBusiness: 'Business name missing',
    phonePlaceholder: '(323) 555-1234',
    addressPlaceholder: '123 Main St, City, State',
    hoursPlaceholder: 'Mon-Sat 10am - 8pm',
    itemNamePlaceholder: 'Taco Plate',
    pricePlaceholder: '12.99',
    descriptionPlaceholder: 'Fresh food made to order',
    delete: 'Delete',
    remove: 'Remove',
    tapToUpload: 'Tap to upload',
    optional: 'Optional',
  },
  es: {
    eyebrow: 'Store Builder',
    title: 'Construye tu tienda, menú e imágenes',
    subtitle: 'Administra la información del negocio, imágenes, productos y vista previa en un solo lugar.',
    signedIn: 'Sesión iniciada como:',
    back: 'Volver al Panel',
    businessInfo: 'Información del Negocio',
    businessName: 'Nombre del Negocio',
    storeUrl: 'URL de la Tienda',
    phone: 'Número de Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    saveBusiness: 'Guardar Información',
    savingBusiness: 'Guardando...',
    addItemTitle: 'Agregar Producto',
    itemName: 'Nombre del Producto',
    price: 'Precio',
    description: 'Descripción',
    itemImage: 'Imagen del Producto',
    uploadMenuImage: 'Subir Imagen del Producto',
    uploadHero: 'Subir Imagen Hero',
    uploadLogo: 'Subir Logo',
    uploadHint: 'PNG / JPG / WEBP',
    addItem: 'Agregar Producto',
    addingItem: 'Agregando...',
    currentMenu: 'Menú',
    items: 'productos',
    noItems: 'Todavía no hay productos.',
    viewStore: 'Ver Tienda',
    previewTitle: 'Vista Previa en Vivo',
    previewText: 'Así se va viendo tu storefront.',
    previewHero: 'La vista previa del hero aparecerá aquí.',
    storeImages: 'Imágenes de la Tienda',
    heroImage: 'Imagen Hero',
    logoImage: 'Logo',
    uploading: 'Subiendo...',
    loadFailed: 'No se pudo cargar el builder.',
    notSignedIn: 'No has iniciado sesión.',
    uploadFailed: 'La subida falló.',
    saveFailed: 'No se pudo guardar.',
    businessSaved: 'Información guardada.',
    itemAdded: 'Producto agregado.',
    builderFailed: 'La acción falló.',
    noSlug: 'Todavía no hay slug',
    noBusiness: 'Falta nombre del negocio',
    phonePlaceholder: '(323) 555-1234',
    addressPlaceholder: '123 Main St, City, State',
    hoursPlaceholder: 'Lun-Sáb 10am - 8pm',
    itemNamePlaceholder: 'Plato de tacos',
    pricePlaceholder: '12.99',
    descriptionPlaceholder: 'Comida fresca hecha al momento',
    delete: 'Eliminar',
    remove: 'Quitar',
    tapToUpload: 'Toca para subir',
    optional: 'Opcional',
  },
} as const;

function formatPrice(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '$0.00';
  return `$${numeric.toFixed(2)}`;
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

function createFilePath(prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
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

      const generatedSlug = slugify(businessName) || slug;

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
    if (!restaurantId) return;

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
            background: #f2f3f5;
            padding: 24px;
          }
          .loadingBox {
            color: #111827;
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
            <div className="sectionHeader">
              <div>
                <h2 className="cardTitle">{t.businessInfo}</h2>
                <div className="muted">{t.subtitle}</div>
              </div>
            </div>

            <div className="fieldGrid">
              <div className="field full">
                <label className="label">{t.businessName}</label>
                <input
                  className="input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t.noBusiness}
                  required
                />
              </div>

              <div className="field full">
                <label className="label">{t.storeUrl}</label>
                <div className="readonlyField">/store/{slug || t.noSlug}</div>
              </div>

              <div className="field">
                <label className="label">{t.phone}</label>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                />
              </div>

              <div className="field">
                <label className="label">{t.hours}</label>
                <input
                  className="input"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder={t.hoursPlaceholder}
                />
              </div>

              <div className="field full">
                <label className="label">{t.address}</label>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t.addressPlaceholder}
                />
              </div>
            </div>

            <button type="submit" className="primaryButton" disabled={savingBusiness}>
              {savingBusiness ? t.savingBusiness : t.saveBusiness}
            </button>
          </form>

          <div className="card">
            <div className="sectionHeader">
              <div>
                <h2 className="cardTitle">{t.storeImages}</h2>
                <div className="muted">{t.uploadHint}</div>
              </div>
            </div>

            <div className="imageGrid">
              <div className="uploadCard">
                <div className="uploadCardLabel">{t.heroImage}</div>

                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleHeroUpload}
                  className="hiddenInput"
                />

                <button
                  type="button"
                  className="uploadSurface"
                  onClick={() => heroInputRef.current?.click()}
                >
                  {heroUrl ? (
                    <div className="uploadPreviewRow">
                      <div className="uploadThumbWrap">
                        <img src={heroUrl} alt="Hero preview" className="uploadThumb" />
                      </div>
                      <div className="uploadMeta">
                        <div className="uploadMetaTitle">{t.heroImage}</div>
                        <div className="uploadMetaText">
                          {heroUploading ? t.uploading : t.tapToUpload}
                        </div>
                        <div className="uploadMetaSmall">{t.uploadHint}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="uploadEmpty">
                      <div className="uploadEmptyTitle">
                        {heroUploading ? t.uploading : t.uploadHero}
                      </div>
                      <div className="uploadEmptyText">{t.tapToUpload}</div>
                      <div className="uploadEmptySmall">{t.uploadHint}</div>
                    </div>
                  )}
                </button>
              </div>

              <div className="uploadCard">
                <div className="uploadCardLabel">{t.logoImage}</div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hiddenInput"
                />

                <button
                  type="button"
                  className="uploadSurface"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUrl ? (
                    <div className="uploadPreviewRow">
                      <div className="uploadThumbWrap square">
                        <img src={logoUrl} alt="Logo preview" className="uploadThumb" />
                      </div>
                      <div className="uploadMeta">
                        <div className="uploadMetaTitle">{t.logoImage}</div>
                        <div className="uploadMetaText">
                          {logoUploading ? t.uploading : t.tapToUpload}
                        </div>
                        <div className="uploadMetaSmall">{t.uploadHint}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="uploadEmpty">
                      <div className="uploadEmptyTitle">
                        {logoUploading ? t.uploading : t.uploadLogo}
                      </div>
                      <div className="uploadEmptyText">{t.tapToUpload}</div>
                      <div className="uploadEmptySmall">{t.uploadHint}</div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddMenuItem} className="card">
            <div className="sectionHeader">
              <div>
                <h2 className="cardTitle">{t.addItemTitle}</h2>
                <div className="muted">{menuCountText}</div>
              </div>
            </div>

            <div className="addItemTopRow">
              <div className="fieldGrow">
                <label className="label">{t.itemName}</label>
                <input
                  className="input"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder={t.itemNamePlaceholder}
                  required
                />
              </div>

              <div className="fieldPrice">
                <label className="label">{t.price}</label>
                <input
                  className="input"
                  value={menuPrice}
                  onChange={(e) => setMenuPrice(e.target.value)}
                  placeholder={t.pricePlaceholder}
                  inputMode="decimal"
                  required
                />
              </div>
            </div>

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

            <div className="menuImageRow">
              <button
                type="button"
                className="uploadSurface menuUpload"
                onClick={() => menuImageInputRef.current?.click()}
              >
                {menuImagePreview ? (
                  <div className="uploadPreviewRow">
                    <div className="uploadThumbWrap square">
                      <img
                        src={menuImagePreview}
                        alt="Menu preview"
                        className="uploadThumb"
                      />
                    </div>
                    <div className="uploadMeta">
                      <div className="uploadMetaTitle">{t.itemImage}</div>
                      <div className="uploadMetaText">{t.tapToUpload}</div>
                      <div className="uploadMetaSmall">
                        {t.uploadHint} • {t.optional}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="uploadEmpty compact">
                    <div className="uploadEmptyTitle">{t.uploadMenuImage}</div>
                    <div className="uploadEmptyText">{t.tapToUpload}</div>
                    <div className="uploadEmptySmall">
                      {t.uploadHint} • {t.optional}
                    </div>
                  </div>
                )}
              </button>

              <button type="submit" className="primaryButton addItemButton" disabled={addingItem}>
                {addingItem ? t.addingItem : t.addItem}
              </button>
            </div>
          </form>

          <div className="card">
            <div className="sectionHeader">
              <div>
                <h2 className="cardTitle">{t.currentMenu}</h2>
                <div className="muted">{menuCountText}</div>
              </div>

              <button type="button" className="primaryButton smallPrimary" onClick={handleViewStore}>
                {t.viewStore}
              </button>
            </div>

            <div className="menuList">
              {menuItems.length === 0 ? (
                <div className="emptyBox">{t.noItems}</div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="menuItemCard">
                    <div className="menuItemRow">
                      <div className="menuItemLeft">
                        <div className="miniIcon">≡</div>
                        <div className="menuItemCopy">
                          <div className="menuItemName">{item.name || 'Untitled item'}</div>
                          <div className="menuItemPrice">{formatPrice(item.price)}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="deleteButton"
                        onClick={() => handleDeleteMenuItem(item.id)}
                      >
                        {t.delete}
                      </button>
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
            <div className="sectionHeader">
              <div>
                <h2 className="cardTitle">{t.previewTitle}</h2>
                <div className="muted">{t.previewText}</div>
              </div>
            </div>

            <div className="phoneShell">
              <div className="phoneTopbar">
                <div className="phoneBrand">
                  <div className="brandMark">M</div>
                  <div className="brandName">{businessName || 'MenuFlow'}</div>
                </div>
                <div className="phoneMenu">≡</div>
              </div>

              {heroUrl ? (
                <div className="previewHeroWrap">
                  <img src={heroUrl} alt="Hero preview" className="previewHeroImage" />
                </div>
              ) : (
                <div className="previewHeroPlaceholder">{t.previewHero}</div>
              )}

              <div className="previewBusiness">{businessName || t.noBusiness}</div>

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
                      ) : (
                        <div className="previewMenuImage placeholderImage" />
                      )}

                      <div className="previewMenuText">
                        <div className="previewMenuName">{item.name}</div>
                        <div className="previewMenuPrice">{formatPrice(item.price)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button type="button" className="phonePrimaryButton" onClick={handleViewStore}>
                {t.viewStore}
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #eef0f3;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          color: #0f172a;
        }

        :global(*) {
          box-sizing: border-box;
        }

        :global(a) {
          color: inherit;
          text-decoration: none;
        }

        .page {
          min-height: 100vh;
          background: #eef0f3;
          color: #0f172a;
          padding: 18px;
          overflow-x: hidden;
        }

        .hero {
          max-width: 1460px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid #d9dee6;
          border-radius: 34px;
          padding: 24px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
        }

        .heroTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .heroLeft {
          max-width: 860px;
        }

        .eyebrow {
          color: #6b7280;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .heroTitle {
          margin: 10px 0 0;
          font-size: clamp(42px, 5vw, 70px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          font-weight: 900;
          color: #0f172a;
          max-width: 760px;
        }

        .heroText {
          margin-top: 14px;
          color: #667085;
          font-size: clamp(18px, 1.8vw, 26px);
          line-height: 1.5;
          font-weight: 600;
          max-width: 800px;
        }

        .signedIn {
          margin-top: 18px;
          color: #6b7280;
          font-size: 16px;
          font-weight: 700;
        }

        .signedIn strong {
          color: #0f172a;
        }

        .heroRight {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .backButton,
        .primaryButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          font-weight: 900;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .backButton:hover,
        .primaryButton:hover,
        .deleteButton:hover,
        .uploadSurface:hover,
        .langButton:hover {
          opacity: 0.95;
        }

        .backButton {
          min-height: 58px;
          padding: 0 24px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #d9dee6;
          color: #0f172a;
          font-size: 17px;
        }

        .langWrap {
          display: inline-flex;
          border: 1px solid #d9dee6;
          background: #fff;
          padding: 4px;
          border-radius: 18px;
        }

        .langButton {
          border: none;
          background: transparent;
          color: #6b7280;
          min-width: 66px;
          min-height: 50px;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
        }

        .activeLang {
          background: #0f172a;
          color: #fff;
        }

        .contentGrid {
          max-width: 1460px;
          margin: 18px auto 0;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
          gap: 20px;
          align-items: start;
        }

        .leftCol,
        .rightCol {
          display: grid;
          gap: 20px;
        }

        .card {
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid #d9dee6;
          border-radius: 30px;
          padding: 24px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
          width: 100%;
        }

        .sectionHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .cardTitle {
          margin: 0;
          color: #0f172a;
          font-size: clamp(26px, 2.5vw, 42px);
          line-height: 1.02;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .muted {
          margin-top: 10px;
          color: #667085;
          font-size: 17px;
          line-height: 1.5;
          font-weight: 700;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .label {
          display: block;
          margin-top: 8px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 800;
        }

        .input,
        .textarea,
        .readonlyField {
          width: 100%;
          margin-top: 10px;
          border-radius: 18px;
          border: 1px solid #d8dde5;
          background: #fff;
          color: #0f172a;
          font-size: 18px;
          font-weight: 600;
          padding: 16px 18px;
          outline: none;
        }

        .readonlyField {
          color: #6b7280;
          min-height: 64px;
          display: flex;
          align-items: center;
        }

        .input {
          min-height: 64px;
        }

        .textarea {
          min-height: 120px;
          resize: vertical;
        }

        .hiddenInput {
          display: none;
        }

        .primaryButton {
          min-height: 62px;
          border-radius: 18px;
          background: #000;
          color: #fff;
          font-size: 20px;
          margin-top: 18px;
          padding: 0 22px;
          width: 100%;
        }

        .smallPrimary {
          width: auto;
          min-width: 170px;
          margin-top: 0;
          font-size: 17px;
          min-height: 56px;
        }

        .imageGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 6px;
        }

        .uploadCard {
          border: 1px solid #d8dde5;
          border-radius: 24px;
          background: #f9fafb;
          padding: 16px;
        }

        .uploadCardLabel {
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .uploadSurface {
          width: 100%;
          min-height: 138px;
          border-radius: 20px;
          border: 1.5px dashed #d1d5db;
          background: #fff;
          padding: 14px;
          cursor: pointer;
          text-align: left;
        }

        .uploadPreviewRow {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .uploadThumbWrap {
          width: 118px;
          height: 86px;
          border-radius: 16px;
          overflow: hidden;
          background: #eef1f5;
          flex-shrink: 0;
        }

        .uploadThumbWrap.square {
          width: 86px;
          height: 86px;
        }

        .uploadThumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .uploadMeta {
          min-width: 0;
        }

        .uploadMetaTitle {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
          line-height: 1.15;
        }

        .uploadMetaText {
          margin-top: 8px;
          color: #4b5563;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
        }

        .uploadMetaSmall {
          margin-top: 6px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 700;
        }

        .uploadEmpty {
          min-height: 108px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
        }

        .uploadEmpty.compact {
          min-height: 90px;
        }

        .uploadEmptyTitle {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        .uploadEmptyText {
          margin-top: 8px;
          color: #4b5563;
          font-size: 15px;
          font-weight: 700;
        }

        .uploadEmptySmall {
          margin-top: 6px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 700;
        }

        .addItemTopRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 210px;
          gap: 16px;
        }

        .fieldGrow,
        .fieldPrice {
          min-width: 0;
        }

        .menuImageRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 16px;
          align-items: end;
          margin-top: 4px;
        }

        .menuUpload {
          min-height: 120px;
        }

        .addItemButton {
          margin-top: 0;
        }

        .menuList {
          margin-top: 12px;
          display: grid;
          gap: 12px;
        }

        .emptyBox {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 22px;
          color: #6b7280;
          font-size: 17px;
          font-weight: 700;
        }

        .menuItemCard {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 14px 16px;
        }

        .menuItemRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .menuItemLeft {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .miniIcon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          background: #fff;
          border: 1px solid #d8dde5;
          font-size: 14px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .menuItemCopy {
          min-width: 0;
        }

        .menuItemName {
          color: #0f172a;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.15;
        }

        .menuItemPrice {
          margin-top: 6px;
          color: #4b5563;
          font-size: 16px;
          font-weight: 800;
        }

        .menuItemDescription {
          margin-top: 10px;
          color: #667085;
          font-size: 15px;
          line-height: 1.55;
          font-weight: 700;
          padding-left: 40px;
        }

        .deleteButton {
          border: none;
          background: transparent;
          color: #dc2626;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
        }

        .previewCard {
          position: sticky;
          top: 18px;
        }

        .phoneShell {
          margin-top: 8px;
          border-radius: 30px;
          border: 1px solid #d8dde5;
          background: #fff;
          padding: 18px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .phoneTopbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .phoneBrand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brandMark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: #0f172a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
          flex-shrink: 0;
        }

        .brandName {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .phoneMenu {
          color: #4b5563;
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
        }

        .previewHeroWrap {
          margin-top: 14px;
          width: 100%;
          height: 180px;
          border-radius: 22px;
          overflow: hidden;
          background: #eef1f5;
        }

        .previewHeroImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .previewHeroPlaceholder {
          margin-top: 14px;
          border-radius: 22px;
          min-height: 180px;
          background: #f8fafc;
          border: 1px dashed #d1d5db;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px;
          font-size: 16px;
          line-height: 1.5;
          font-weight: 800;
        }

        .previewBusiness {
          margin-top: 14px;
          font-size: clamp(24px, 3vw, 38px);
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.04em;
          line-height: 1.04;
          word-break: break-word;
        }

        .previewMenuSection {
          margin-top: 16px;
          display: grid;
          gap: 12px;
        }

        .previewEmpty {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 18px;
          color: #6b7280;
          font-size: 15px;
          font-weight: 800;
        }

        .previewMenuItem {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid #e5e7eb;
          padding: 12px;
        }

        .previewMenuImage {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .placeholderImage {
          background: #eef1f5;
        }

        .previewMenuText {
          min-width: 0;
        }

        .previewMenuName {
          font-size: 18px;
          color: #0f172a;
          font-weight: 900;
          line-height: 1.15;
        }

        .previewMenuPrice {
          margin-top: 6px;
          color: #4b5563;
          font-size: 15px;
          font-weight: 900;
        }

        .phonePrimaryButton {
          width: 100%;
          min-height: 58px;
          border-radius: 18px;
          background: #000;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          border: none;
          cursor: pointer;
          margin-top: 18px;
        }

        @media (max-width: 1180px) {
          .contentGrid {
            grid-template-columns: 1fr;
          }

          .previewCard {
            position: static;
          }
        }

        @media (max-width: 820px) {
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

          .card {
            padding: 20px;
            border-radius: 24px;
          }

          .cardTitle {
            font-size: clamp(24px, 9vw, 38px);
          }

          .fieldGrid,
          .imageGrid,
          .addItemTopRow,
          .menuImageRow {
            grid-template-columns: 1fr;
          }

          .smallPrimary {
            width: 100%;
          }

          .uploadPreviewRow {
            align-items: flex-start;
          }
        }

        @media (max-width: 560px) {
          .heroRight {
            width: 100%;
          }

          .langWrap {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .langButton {
            width: 100%;
          }

          .uploadThumbWrap {
            width: 96px;
            height: 74px;
          }

          .uploadThumbWrap.square {
            width: 74px;
            height: 74px;
          }

          .menuItemDescription {
            padding-left: 0;
          }
        }
      `}</style>
    </main>
  );
}
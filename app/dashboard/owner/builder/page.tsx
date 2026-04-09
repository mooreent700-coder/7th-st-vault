"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: string;
  owner_email?: string | null;
  name: string | null;
  slug: string | null;
};

type MenuItem = {
  id: string;
  restaurant_id: string;
  name: string | null;
  price: number | null;
  description: string | null;
  image_url: string | null;
  created_at?: string | null;
};

type Lang = "en" | "es";

const copy = {
  en: {
    eyebrow: "MenuFlow Builder",
    title: "Add and manage menu items",
    subtitle: "Create menu items for your live storefront.",
    signedInAs: "Signed in as",
    back: "Back to Dashboard",
    currentMenu: "Current Menu",
    yourStore: "Your Store",
    viewStore: "View Store",
    addMenuItem: "Add Menu Item",
    itemName: "Item Name",
    price: "Price",
    description: "Description",
    descriptionPlaceholder: "Fresh food made to order",
    addButton: "Add Menu Item",
    adding: "Adding...",
    remove: "Remove",
    removing: "Removing...",
    noRestaurant: "Save your business information in the owner dashboard first.",
    noMenuItems: "No menu items yet.",
    itemRequired: "Item name is required.",
    invalidPrice: "Enter a valid price.",
    added: "Menu item added successfully.",
    removed: "Menu item removed successfully.",
    loadError: "Could not load builder.",
    addError: "Could not add menu item.",
    removeError: "Could not remove menu item.",
  },
  es: {
    eyebrow: "Constructor de MenuFlow",
    title: "Agrega y administra artículos del menú",
    subtitle: "Crea artículos para tu tienda en vivo.",
    signedInAs: "Sesión iniciada como",
    back: "Volver al Panel",
    currentMenu: "Menú Actual",
    yourStore: "Tu Tienda",
    viewStore: "Ver Tienda",
    addMenuItem: "Agregar Artículo",
    itemName: "Nombre del Artículo",
    price: "Precio",
    description: "Descripción",
    descriptionPlaceholder: "Comida fresca hecha al momento",
    addButton: "Agregar Artículo",
    adding: "Agregando...",
    remove: "Eliminar",
    removing: "Eliminando...",
    noRestaurant: "Guarda primero la información de tu negocio en el panel del dueño.",
    noMenuItems: "Todavía no hay artículos.",
    itemRequired: "El nombre del artículo es obligatorio.",
    invalidPrice: "Ingresa un precio válido.",
    added: "Artículo agregado correctamente.",
    removed: "Artículo eliminado correctamente.",
    loadError: "No se pudo cargar el constructor.",
    addError: "No se pudo agregar el artículo.",
    removeError: "No se pudo eliminar el artículo.",
  },
} as const;

const COLORS = {
  page: "#f6f8fc",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#1f2937",
  sub: "#6b7280",
  blue: "#3b82f6",
  blueDark: "#2563eb",
  blueSoft: "#eff6ff",
  blueBorder: "#bfdbfe",
  redSoft: "#fee2e2",
  redText: "#b91c1c",
  shadow: "0 12px 34px rgba(15, 23, 42, 0.08)",
};

export default function OwnerBuilderPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const t = copy[lang];

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const loadingRef = useRef(false);

  useEffect(() => {
    void loadBuilder();
  }, []);

  async function loadBuilder() {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user?.email) {
        setMessage(t.loadError);
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_email", user.email)
        .maybeSingle();

      if (restaurantError) throw restaurantError;

      if (!restaurantData) {
        setRestaurant(null);
        setMenuItems([]);
        setLoading(false);
        setMessage(t.noRestaurant);
        return;
      }

      const typedRestaurant = restaurantData as Restaurant;
      setRestaurant(typedRestaurant);

      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", typedRestaurant.id)
        .order("created_at", { ascending: false });

      if (menuError) throw menuError;

      setMenuItems((menuData || []) as MenuItem[]);
      setLoading(false);
    } catch (err: any) {
      setMessage(err?.message || t.loadError);
      setLoading(false);
    } finally {
      loadingRef.current = false;
    }
  }

  async function handleAddMenuItem() {
    if (!restaurant?.id) {
      setMessage(t.noRestaurant);
      return;
    }

    const cleanName = itemName.trim();
    const cleanDescription = itemDescription.trim();
    const parsedPrice = Number(itemPrice);

    if (!cleanName) {
      setMessage(t.itemRequired);
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setMessage(t.invalidPrice);
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          restaurant_id: restaurant.id,
          name: cleanName,
          price: parsedPrice,
          description: cleanDescription || null,
          image_url: null,
        })
        .select("*")
        .single();

      if (error) throw error;

      setMenuItems((prev) => [data as MenuItem, ...prev]);
      setItemName("");
      setItemPrice("");
      setItemDescription("");
      setMessage(t.added);
    } catch (err: any) {
      setMessage(err?.message || t.addError);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMenuItem(id: string) {
    try {
      setRemovingId(id);
      setMessage("");

      const { error } = await supabase.from("menu_items").delete().eq("id", id);

      if (error) throw error;

      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      setMessage(t.removed);
    } catch (err: any) {
      setMessage(err?.message || t.removeError);
    } finally {
      setRemovingId("");
    }
  }

  const storeLink = useMemo(() => {
    if (!restaurant?.slug) return "#";
    return `/store/${restaurant.slug}`;
  }, [restaurant?.slug]);

  if (loading) {
    return (
      <div style={page}>
        <div style={loadingWrap}>Loading builder...</div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={shell}>
        <section style={heroCard}>
          <div>
            <div style={eyebrow}>{t.eyebrow}</div>
            <h1 style={heroTitle}>{t.title}</h1>
            <p style={heroText}>{t.subtitle}</p>
            <div style={emailText}>
              {t.signedInAs}: {userEmail}
            </div>
          </div>

          <div style={heroActions}>
            <button style={backButton} onClick={() => router.push("/dashboard/owner")}>
              {t.back}
            </button>

            <div style={langWrap}>
              <button
                type="button"
                onClick={() => setLang("en")}
                style={lang === "en" ? langButtonActive : langButton}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("es")}
                style={lang === "es" ? langButtonActive : langButton}
              >
                ES
              </button>
            </div>
          </div>
        </section>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={contentGrid}>
          <div style={panel}>
            <h2 style={panelTitle}>{t.addMenuItem}</h2>

            <label style={label}>{t.itemName}</label>
            <input
              style={input}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />

            <label style={label}>{t.price}</label>
            <input
              style={input}
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="12.99"
              inputMode="decimal"
            />

            <label style={label}>{t.description}</label>
            <textarea
              style={textarea}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
            />

            <button
              type="button"
              style={primaryButton}
              onClick={() => void handleAddMenuItem()}
              disabled={adding}
            >
              {adding ? t.adding : t.addButton}
            </button>
          </div>

          <div style={panel}>
            <div style={panelTopRow}>
              <div>
                <h2 style={panelTitle}>{t.currentMenu}</h2>
                <div style={panelMeta}>
                  {menuItems.length} {lang === "en" ? "items" : "artículos"}
                </div>
              </div>

              <div style={storeWrap}>
                <div style={storeLabel}>{t.yourStore}</div>
                <a href={storeLink} style={storeLink !== "#" ? storeButton : storeButtonDisabled}>
                  {t.viewStore}
                </a>
              </div>
            </div>

            {menuItems.length === 0 ? (
              <div style={emptyBox}>{t.noMenuItems}</div>
            ) : (
              <div style={menuList}>
                {menuItems.map((item) => (
                  <div key={item.id} style={menuCard}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name || "Menu item"} style={menuImage} />
                    ) : (
                      <div style={menuImagePlaceholder}>IMG</div>
                    )}

                    <div style={menuInfo}>
                      <div style={menuName}>{item.name || "-"}</div>
                      <div style={menuPrice}>${Number(item.price || 0).toFixed(2)}</div>
                      {item.description ? <div style={menuDesc}>{item.description}</div> : null}
                    </div>

                    <button
                      type="button"
                      style={removeButton}
                      onClick={() => void handleRemoveMenuItem(item.id)}
                      disabled={removingId === item.id}
                    >
                      {removingId === item.id ? t.removing : t.remove}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  background: COLORS.page,
  padding: "24px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: COLORS.text,
};

const shell: CSSProperties = {
  maxWidth: "1450px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
};

const heroCard: CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "28px",
  boxShadow: COLORS.shadow,
  padding: "28px",
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  flexWrap: "wrap",
};

const eyebrow: CSSProperties = {
  color: COLORS.blue,
  fontSize: "14px",
  fontWeight: 700,
};

const heroTitle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: "60px",
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

const heroText: CSSProperties = {
  marginTop: "10px",
  color: COLORS.sub,
  fontSize: "18px",
};

const emailText: CSSProperties = {
  marginTop: "10px",
  color: COLORS.sub,
  fontWeight: 600,
  fontSize: "16px",
};

const heroActions: CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const backButton: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
  color: COLORS.text,
  borderRadius: "16px",
  padding: "14px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const langWrap: CSSProperties = {
  display: "flex",
  background: COLORS.blueSoft,
  border: `1px solid ${COLORS.blueBorder}`,
  padding: "4px",
  borderRadius: "16px",
};

const langButton: CSSProperties = {
  border: "none",
  background: "transparent",
  color: COLORS.sub,
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 800,
  cursor: "pointer",
};

const langButtonActive: CSSProperties = {
  border: "none",
  background: COLORS.blue,
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 800,
  cursor: "pointer",
};

const messageBox: CSSProperties = {
  background: COLORS.blueSoft,
  border: `1px solid ${COLORS.blueBorder}`,
  color: COLORS.blueDark,
  borderRadius: "16px",
  padding: "14px 16px",
  fontWeight: 700,
};

const contentGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
  alignItems: "start",
};

const panel: CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "28px",
  boxShadow: COLORS.shadow,
  padding: "24px",
};

const panelTitle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 800,
  color: COLORS.text,
};

const panelMeta: CSSProperties = {
  marginTop: "8px",
  color: COLORS.sub,
  fontWeight: 600,
};

const label: CSSProperties = {
  display: "block",
  marginTop: "18px",
  marginBottom: "8px",
  fontWeight: 800,
  fontSize: "16px",
  color: "#334155",
};

const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "16px 18px",
  borderRadius: "16px",
  border: `1px solid ${COLORS.border}`,
  background: "#ffffff",
  color: COLORS.text,
  fontSize: "16px",
  outline: "none",
};

const textarea: CSSProperties = {
  width: "100%",
  minHeight: "120px",
  resize: "vertical",
  boxSizing: "border-box",
  padding: "16px 18px",
  borderRadius: "16px",
  border: `1px solid ${COLORS.border}`,
  background: "#ffffff",
  color: COLORS.text,
  fontSize: "16px",
  outline: "none",
};

const primaryButton: CSSProperties = {
  marginTop: "18px",
  width: "100%",
  padding: "16px 18px",
  borderRadius: "18px",
  border: "none",
  background: COLORS.blue,
  color: "#fff",
  fontWeight: 800,
  fontSize: "17px",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(37,99,235,0.22)",
};

const panelTopRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const storeWrap: CSSProperties = {
  display: "grid",
  gap: "8px",
  justifyItems: "end",
};

const storeLabel: CSSProperties = {
  color: COLORS.sub,
  fontWeight: 700,
};

const storeButton: CSSProperties = {
  textDecoration: "none",
  background: COLORS.blue,
  color: "#fff",
  borderRadius: "14px",
  padding: "12px 16px",
  fontWeight: 800,
};

const storeButtonDisabled: CSSProperties = {
  textDecoration: "none",
  background: "#cbd5e1",
  color: "#fff",
  borderRadius: "14px",
  padding: "12px 16px",
  fontWeight: 800,
  pointerEvents: "none",
};

const emptyBox: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.sub,
  fontWeight: 600,
};

const menuList: CSSProperties = {
  marginTop: "18px",
  display: "grid",
  gap: "14px",
};

const menuCard: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "86px 1fr auto",
  gap: "14px",
  alignItems: "center",
  padding: "14px",
  borderRadius: "20px",
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
};

const menuImage: CSSProperties = {
  width: "86px",
  height: "86px",
  objectFit: "cover",
  borderRadius: "18px",
  border: `1px solid ${COLORS.border}`,
};

const menuImagePlaceholder: CSSProperties = {
  width: "86px",
  height: "86px",
  borderRadius: "18px",
  border: `1px solid ${COLORS.border}`,
  background: "#f8fafc",
  color: "#94a3b8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: "12px",
};

const menuInfo: CSSProperties = {
  minWidth: 0,
};

const menuName: CSSProperties = {
  fontWeight: 800,
  fontSize: "24px",
  lineHeight: 1.15,
  color: COLORS.text,
};

const menuPrice: CSSProperties = {
  marginTop: "8px",
  color: COLORS.sub,
  fontSize: "18px",
  fontWeight: 800,
};

const menuDesc: CSSProperties = {
  marginTop: "8px",
  color: COLORS.sub,
  fontSize: "15px",
  lineHeight: 1.55,
};

const removeButton: CSSProperties = {
  border: "none",
  background: COLORS.redSoft,
  color: COLORS.redText,
  borderRadius: "14px",
  padding: "12px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const loadingWrap: CSSProperties = {
  minHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 800,
  color: COLORS.text,
};

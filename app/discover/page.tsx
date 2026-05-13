'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name: string | null;
  slug: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  category?: string | null;
  description?: string | null;
  hero_image?: string | null;
  logo_image?: string | null;
  cover_image?: string | null;
  cover_video?: string | null;
  storefront_theme?: string | null;
  storefront_accent?: string | null;
  public_visible?: boolean | null;
  featured?: boolean | null;
  views?: number | null;
  followers?: number | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
};

type MediaRow = {
  id: string;
  owner_id?: string | null;
  restaurant_id: string | null;
  media_type: string | null;
  media_url: string | null;
  caption: string | null;
  likes?: number | null;
  views?: number | null;
  created_at?: string | null;
};

type FeedCard = {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  state: string;
  description: string;
  caption: string;
  imageUrl: string;
  videoUrl: string;
  logoUrl: string;
  featured: boolean;
  followers: number;
  views: number;
  likes: number;
  pickup: boolean;
  delivery: boolean;
};

const BUCKET = 'menu-images';

const DEFAULT_CATEGORIES = [
  'All',
  'Trending',
  'Featured',
  'Food Trucks',
  'Pop-Ups',
  'Tacos',
  'BBQ',
  'Seafood',
  'Burgers',
  'Wings',
  'Desserts',
  'Drinks',
  'Breakfast',
  'Late Night',
];

function storageUrl(path: string) {
  const clean = String(path || '').replace(/^\/+/, '');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(clean);
  return data.publicUrl;
}

function resolveUrl(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('menu-images/')) return storageUrl(raw.replace(/^menu-images\//, ''));
  if (raw.startsWith(`${BUCKET}/`)) return storageUrl(raw.replace(`${BUCKET}/`, ''));
  return storageUrl(raw);
}

function cleanText(value?: string | null, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeNumber(value?: number | null) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value || 0);
}

function categoryImage(category: string) {
  const key = category.toLowerCase();

  if (key.includes('taco')) return storageUrl('tacos/1.jpg');
  if (key.includes('mexican')) return storageUrl('mexican/1.jpg');
  if (key.includes('burger')) return storageUrl('burgers/1.jpg');
  if (key.includes('wing')) return storageUrl('wings/1.jpg');
  if (key.includes('bbq') || key.includes('barbecue')) return storageUrl('bbq/1.jpg');
  if (key.includes('seafood') || key.includes('shrimp') || key.includes('fish')) return storageUrl('seafood/1.jpg');
  if (key.includes('dessert') || key.includes('cake')) return storageUrl('desserts/1.jpg');
  if (key.includes('drink') || key.includes('juice')) return storageUrl('drinks/1.jpg');
  if (key.includes('breakfast')) return storageUrl('breakfast/1.jpg');
  if (key.includes('chicken')) return storageUrl('chicken/1.jpg');
  if (key.includes('sandwich')) return storageUrl('sandwiches/1.jpg');

  return storageUrl('universal/1.jpg');
}

function isVideo(value?: string | null) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(value || '').trim());
}

function AutoplayVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const play = () => {
      const promise = video.play();
      if (promise?.catch) promise.catch(() => null);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play();
        else video.pause();
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    window.setTimeout(play, 120);

    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster || undefined}
      className="visual"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
    />
  );
}

export default function DiscoverPage() {
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'reels'>('grid');

  useEffect(() => {
    async function loadDiscover() {
      setLoading(true);

      const [{ data: restaurantRows, error: restaurantError }, { data: mediaRows, error: mediaError }] =
        await Promise.all([
          supabase
            .from('restaurants')
            .select('*')
            .or('public_visible.is.null,public_visible.eq.true')
            .not('slug', 'is', null)
            .limit(250),
          supabase
            .from('restaurant_media')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500),
        ]);

      if (restaurantError) console.error('DISCOVER RESTAURANTS ERROR:', restaurantError);
      if (mediaError) console.error('DISCOVER MEDIA ERROR:', mediaError);

      setRestaurants((restaurantRows || []) as RestaurantRow[]);
      setMedia((mediaRows || []) as MediaRow[]);
      setLoading(false);
    }

    void loadDiscover();
  }, []);

  const feed = useMemo<FeedCard[]>((() => {
    const mediaByRestaurant = new Map<string, MediaRow[]>();

    media.forEach((item) => {
      if (!item.restaurant_id) return;
      const list = mediaByRestaurant.get(item.restaurant_id) || [];
      list.push(item);
      mediaByRestaurant.set(item.restaurant_id, list);
    });

    return restaurants
      .filter((restaurant) => restaurant.slug)
      .map((restaurant) => {
        const restaurantMedia = mediaByRestaurant.get(restaurant.id) || [];
        const primaryMedia = restaurantMedia[0];

        const category = cleanText(restaurant.category, 'Food');
        const name = cleanText(restaurant.name, 'ORDA Restaurant');
        const imageUrl =
          resolveUrl(primaryMedia?.media_type === 'image' ? primaryMedia.media_url : '') ||
          resolveUrl(restaurant.cover_image) ||
          resolveUrl(restaurant.hero_image) ||
          categoryImage(category);

        const rawVideo =
          primaryMedia?.media_type === 'video'
            ? primaryMedia.media_url
            : restaurant.cover_video;

        const videoUrl = isVideo(rawVideo) ? resolveUrl(rawVideo) : '';

        return {
          id: primaryMedia?.id || restaurant.id,
          restaurantId: restaurant.id,
          name,
          slug: restaurant.slug || '',
          category,
          city: cleanText(restaurant.city, cleanText(restaurant.address, 'Local')),
          state: cleanText(restaurant.state, ''),
          description: cleanText(restaurant.description, 'Fresh food, direct ordering, and local flavor on ORDA.'),
          caption: cleanText(primaryMedia?.caption, `Order direct from ${name} on ORDA.`),
          imageUrl,
          videoUrl,
          logoUrl: resolveUrl(restaurant.logo_image),
          featured: Boolean(restaurant.featured),
          followers: safeNumber(restaurant.followers),
          views: safeNumber(primaryMedia?.views) || safeNumber(restaurant.views),
          likes: safeNumber(primaryMedia?.likes),
          pickup: restaurant.pickup_enabled !== false,
          delivery: Boolean(restaurant.delivery_enabled),
        };
      });
  }) as () => FeedCard[], [restaurants, media]);

  const categories = useMemo(() => {
    const dynamic = feed.map((item) => item.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...dynamic]));
  }, [feed]);

  const filteredFeed = useMemo(() => {
    const q = search.trim().toLowerCase();

    return feed.filter((item) => {
      const searchHit =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.caption.toLowerCase().includes(q);

      const categoryHit =
        activeCategory === 'All' ||
        (activeCategory === 'Trending' && (item.views >= 100 || item.likes >= 10 || item.featured)) ||
        (activeCategory === 'Featured' && item.featured) ||
        item.category.toLowerCase().includes(activeCategory.toLowerCase());

      return searchHit && categoryHit;
    });
  }, [activeCategory, feed, search]);

  const heroItems = filteredFeed.slice(0, 5);
  const featuredItem = heroItems[0] || feed[0];

  return (
    <main className="discoverPage">
      <header className="topBar">
        <Link href="/" className="brand">
          <span>ORDA</span>
          <small>Discover</small>
        </Link>

        <div className="searchBox">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search restaurants, food trucks, pop-ups, tacos..."
          />
        </div>

        <div className="topActions">
          <button type="button" className={viewMode === 'grid' ? 'mode active' : 'mode'} onClick={() => setViewMode('grid')}>Grid</button>
          <button type="button" className={viewMode === 'reels' ? 'mode active' : 'mode'} onClick={() => setViewMode('reels')}>Reels</button>
          <Link href="/auth/login" className="ownerLogin">Owner Login</Link>
        </div>
      </header>

      <section className="heroSection">
        <div className="heroCopy">
          <p>PUBLIC FOOD DISCOVERY</p>
          <h1>Scroll food. Find owners. Order direct.</h1>
          <span>ORDA turns every restaurant, food truck, pop-up, caterer, dessert maker, and drink brand into a visual storefront people can discover and order from.</span>

          <div className="heroStats">
            <div><b>{feed.length}</b><small>Stores</small></div>
            <div><b>{media.length}</b><small>Posts</small></div>
            <div><b>{formatCount(feed.reduce((sum, item) => sum + item.views, 0))}</b><small>Views</small></div>
          </div>
        </div>

        <div className="heroPreview">
          {featuredItem ? (
            <Link href={`/store/${featuredItem.slug}`} className="heroCard">
              {featuredItem.videoUrl ? <AutoplayVideo src={featuredItem.videoUrl} poster={featuredItem.imageUrl} /> : <img className="visual" src={featuredItem.imageUrl} alt={featuredItem.name} />}
              <div className="heroOverlay" />
              <div className="heroFloating">
                <strong>{featuredItem.name}</strong>
                <span>{featuredItem.category} • {featuredItem.city}</span>
                <b>Order Now →</b>
              </div>
            </Link>
          ) : (
            <div className="heroCard emptyHero"><strong>ORDA Discover</strong><span>Owner uploads will appear here.</span></div>
          )}
        </div>
      </section>

      <nav className="categoryRail">
        {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={activeCategory === category ? 'active' : ''}>{category}</button>)}
      </nav>

      {loading ? (
        <section className="statusBox">Loading ORDA Discover...</section>
      ) : filteredFeed.length === 0 ? (
        <section className="statusBox"><h2>No restaurants found yet.</h2><p>Once owners upload media and publish their storefronts, they will show here.</p></section>
      ) : viewMode === 'reels' ? (
        <section className="reelsFeed">
          {filteredFeed.map((item) => (
            <Link href={`/store/${item.slug}`} className="reelCard" key={item.id}>
              {item.videoUrl ? <AutoplayVideo src={item.videoUrl} poster={item.imageUrl} /> : <img className="visual" src={item.imageUrl} alt={item.name} />}
              <div className="reelShade" />
              <div className="reelActions"><button type="button">♡<span>{formatCount(item.likes)}</span></button><button type="button">↗<span>Share</span></button><button type="button">🛒<span>Order</span></button></div>
              <div className="reelInfo"><div className="logoDot">{item.logoUrl ? <img src={item.logoUrl} alt={item.name} /> : item.name.slice(0, 1)}</div><div><h2>{item.name}</h2><p>{item.caption}</p><div className="chips"><span>{item.category}</span><span>{item.city}{item.state ? `, ${item.state}` : ''}</span>{item.delivery ? <span>Delivery</span> : null}{item.pickup ? <span>Pickup</span> : null}</div></div></div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="discoverGrid">
          {filteredFeed.map((item, index) => (
            <Link href={`/store/${item.slug}`} className={index % 7 === 0 ? 'discoverCard large' : index % 5 === 0 ? 'discoverCard wide' : 'discoverCard'} key={item.id}>
              <div className="mediaWrap">
                {item.videoUrl ? <AutoplayVideo src={item.videoUrl} poster={item.imageUrl} /> : <img className="visual" src={item.imageUrl} alt={item.name} />}
                <div className="cardShade" />
                {item.featured ? <span className="featuredBadge">Featured</span> : null}
                <div className="quickStats"><span>👁 {formatCount(item.views)}</span><span>♡ {formatCount(item.likes)}</span></div>
              </div>

              <div className="cardContent">
                <div className="titleRow"><div className="logoDot">{item.logoUrl ? <img src={item.logoUrl} alt={item.name} /> : item.name.slice(0, 1)}</div><div><h2>{item.name}</h2><p>{item.category} • {item.city}{item.state ? `, ${item.state}` : ''}</p></div></div>
                <p className="caption">{item.caption || item.description}</p>
                <div className="bottomRow"><div className="serviceChips">{item.pickup ? <span>Pickup</span> : null}{item.delivery ? <span>Delivery</span> : null}</div><button type="button">Order Food</button></div>
              </div>
            </Link>
          ))}
        </section>
      )}

      <style jsx global>{`
        *{box-sizing:border-box}html,body{margin:0;padding:0;background:#050505;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{text-decoration:none;color:inherit}button,input{font:inherit}.discoverPage{min-height:100vh;background:radial-gradient(circle at 12% 0%,rgba(255,45,141,.24),transparent 34%),radial-gradient(circle at 88% 4%,rgba(255,122,24,.18),transparent 30%),radial-gradient(circle at 55% 40%,rgba(255,255,255,.06),transparent 32%),#050505;padding-bottom:80px;overflow-x:hidden}.topBar{height:78px;position:sticky;top:0;z-index:100;display:grid;grid-template-columns:auto minmax(220px,1fr) auto;gap:18px;align-items:center;padding:14px clamp(16px,4vw,46px);background:rgba(5,5,5,.78);backdrop-filter:blur(22px);border-bottom:1px solid rgba(255,255,255,.09)}.brand{display:grid;line-height:1}.brand span{font-size:30px;font-weight:1000;letter-spacing:.16em;color:#ff2d8d}.brand small{margin-top:5px;color:rgba(255,255,255,.55);font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:10px}.searchBox{height:50px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);border-radius:999px;display:flex;align-items:center;gap:10px;padding:0 18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}.searchBox span{font-size:23px;color:#ff2d8d;font-weight:1000}.searchBox input{width:100%;height:100%;border:0;outline:0;background:transparent;color:#fff;font-weight:800}.searchBox input::placeholder{color:rgba(255,255,255,.44)}.topActions{display:flex;align-items:center;gap:8px}.mode,.ownerLogin{height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;padding:0 15px;font-weight:1000;cursor:pointer}.mode.active,.ownerLogin{background:#fff;color:#080808;border-color:#fff}.heroSection{max-width:1440px;margin:0 auto;padding:58px clamp(16px,4vw,46px) 28px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.75fr);gap:30px;align-items:center}.heroCopy p{margin:0 0 12px;color:#ff2d8d;font-weight:1000;letter-spacing:.24em}.heroCopy h1{margin:0;font-size:clamp(46px,7vw,104px);line-height:.84;letter-spacing:-.08em;font-weight:1000;max-width:920px}.heroCopy>span{display:block;margin-top:20px;max-width:780px;color:rgba(255,255,255,.72);font-size:20px;line-height:1.38;font-weight:750}.heroStats{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.heroStats div{min-width:132px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07);border-radius:20px;padding:16px}.heroStats b{display:block;font-size:30px;font-weight:1000;color:#fff}.heroStats small{display:block;margin-top:4px;color:#ff2d8d;text-transform:uppercase;font-weight:1000;letter-spacing:.1em}.heroPreview{min-width:0}.heroCard{min-height:520px;display:block;position:relative;border-radius:36px;overflow:hidden;background:#111;border:1px solid rgba(255,255,255,.12);box-shadow:0 35px 110px rgba(0,0,0,.42),0 0 90px rgba(255,45,141,.12)}.visual{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.heroOverlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.78),rgba(0,0,0,.08) 58%,rgba(0,0,0,.12))}.heroFloating{position:absolute;left:22px;right:22px;bottom:22px;background:rgba(0,0,0,.58);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(16px);border-radius:24px;padding:18px}.heroFloating strong{display:block;font-size:28px;font-weight:1000;letter-spacing:-.05em}.heroFloating span{display:block;margin-top:6px;color:rgba(255,255,255,.72);font-weight:850}.heroFloating b{display:inline-flex;margin-top:14px;background:#ff2d8d;color:#fff;border-radius:999px;padding:12px 16px;font-weight:1000}.emptyHero{display:grid;place-items:center;text-align:center;padding:30px}.emptyHero strong{font-size:30px}.emptyHero span{color:rgba(255,255,255,.6)}.categoryRail{max-width:1440px;margin:0 auto 24px;padding:0 clamp(16px,4vw,46px);display:flex;gap:10px;overflow-x:auto;scrollbar-width:none}.categoryRail::-webkit-scrollbar{display:none}.categoryRail button{flex:0 0 auto;height:46px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;border-radius:999px;padding:0 18px;font-weight:1000;cursor:pointer}.categoryRail .active{background:#ff2d8d;border-color:#ff2d8d;box-shadow:0 15px 38px rgba(255,45,141,.25)}.statusBox{max-width:1100px;margin:0 auto;padding:100px 24px;text-align:center;color:rgba(255,255,255,.65);font-size:20px;font-weight:900}.statusBox h2{margin:0;color:#fff;font-size:38px}.statusBox p{margin:12px 0 0}.discoverGrid{max-width:1440px;margin:0 auto;padding:0 clamp(12px,3vw,46px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;grid-auto-flow:dense}.discoverCard{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:28px;overflow:hidden;min-width:0;box-shadow:0 22px 70px rgba(0,0,0,.28);transition:.18s ease}.discoverCard:hover{transform:translateY(-5px);border-color:rgba(255,45,141,.55);box-shadow:0 32px 90px rgba(255,45,141,.14)}.discoverCard.large{grid-column:span 2;grid-row:span 2}.discoverCard.wide{grid-column:span 2}.mediaWrap{height:290px;position:relative;background:#111;overflow:hidden}.large .mediaWrap{height:520px}.wide .mediaWrap{height:350px}.cardShade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.65),transparent 55%,rgba(0,0,0,.12))}.featuredBadge{position:absolute;top:14px;left:14px;background:#ff2d8d;color:#fff;border-radius:999px;padding:9px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:1000}.quickStats{position:absolute;left:14px;right:14px;bottom:14px;display:flex;justify-content:space-between;color:#fff;font-weight:1000;text-shadow:0 8px 24px rgba(0,0,0,.8)}.cardContent{padding:16px;display:grid;gap:13px}.titleRow{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}.logoDot{width:46px;height:46px;border-radius:999px;background:#ff2d8d;color:#fff;display:grid;place-items:center;font-weight:1000;overflow:hidden;flex:0 0 auto;text-transform:uppercase}.logoDot img{width:100%;height:100%;object-fit:cover}.titleRow h2{margin:0;font-size:22px;line-height:1.02;font-weight:1000;letter-spacing:-.04em}.titleRow p{margin:5px 0 0;color:rgba(255,255,255,.58);font-weight:850;font-size:13px}.caption{margin:0;color:rgba(255,255,255,.72);font-weight:750;line-height:1.35}.bottomRow{display:flex;align-items:center;justify-content:space-between;gap:12px}.serviceChips{display:flex;gap:6px;flex-wrap:wrap}.serviceChips span,.chips span{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);border-radius:999px;padding:7px 9px;font-size:11px;font-weight:1000;color:rgba(255,255,255,.78)}.bottomRow button{height:44px;border:0;border-radius:999px;background:#fff;color:#080808;padding:0 15px;font-weight:1000;cursor:pointer}.reelsFeed{height:calc(100vh - 78px);overflow-y:auto;scroll-snap-type:y mandatory;max-width:560px;margin:0 auto;border-left:1px solid rgba(255,255,255,.08);border-right:1px solid rgba(255,255,255,.08)}.reelCard{height:calc(100vh - 78px);position:relative;display:block;scroll-snap-align:start;background:#111;overflow:hidden}.reelShade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.86),transparent 48%,rgba(0,0,0,.18))}.reelActions{position:absolute;right:14px;bottom:132px;display:grid;gap:14px;z-index:4}.reelActions button{width:62px;min-height:62px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.48);color:#fff;border-radius:22px;font-weight:1000;display:grid;place-items:center;backdrop-filter:blur(12px)}.reelActions span{font-size:10px;color:rgba(255,255,255,.74)}.reelInfo{position:absolute;left:18px;right:88px;bottom:24px;z-index:5;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:end}.reelInfo h2{margin:0;font-size:28px;font-weight:1000;letter-spacing:-.05em}.reelInfo p{margin:8px 0 12px;color:rgba(255,255,255,.78);font-weight:750;line-height:1.35}.chips{display:flex;gap:7px;flex-wrap:wrap}@media(max-width:1180px){.heroSection{grid-template-columns:1fr}.heroCard{min-height:430px}.discoverGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){.topBar{height:auto;grid-template-columns:1fr auto;padding:12px}.searchBox{grid-column:1/-1;grid-row:2}.topActions{gap:6px}.mode{display:none}.ownerLogin{height:42px;padding:0 13px;font-size:13px}.brand span{font-size:22px}.heroSection{padding:34px 14px 18px;gap:20px}.heroCopy h1{font-size:48px}.heroCopy>span{font-size:16px}.heroStats div{min-width:100px;padding:13px}.heroStats b{font-size:24px}.heroCard{min-height:360px;border-radius:26px}.categoryRail{padding:0 14px}.discoverGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 10px}.discoverCard,.discoverCard.large,.discoverCard.wide{grid-column:span 1;grid-row:span 1;border-radius:20px}.mediaWrap,.large .mediaWrap,.wide .mediaWrap{height:230px}.cardContent{padding:12px;gap:10px}.logoDot{width:36px;height:36px}.titleRow{gap:8px}.titleRow h2{font-size:16px}.titleRow p{font-size:11px}.caption{font-size:12px}.bottomRow{display:grid}.bottomRow button{height:40px}.reelsFeed{max-width:100%;height:calc(100vh - 122px);border:0}.reelCard{height:calc(100vh - 122px)}}
      `}</style>
    </main>
  );
}

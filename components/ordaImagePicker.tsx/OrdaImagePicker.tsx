'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type OrdaImagePick = {
  url: string;
  path: string;
  fileName: string;
  category: string;
};

type OrdaImagePickerProps = {
  bucket?: string;
  itemName?: string | null;
  categoryName?: string | null;
  selectedUrl?: string | null;
  onPick: (image: OrdaImagePick) => void;
  onClose?: () => void;
};

type StorageImage = {
  url: string;
  path: string;
  fileName: string;
  category: string;
  score: number;
};

const DEFAULT_BUCKET = 'menu-images';

const CATEGORY_ALIASES: Record<string, string> = {
  bbq: 'bbq',
  barbecue: 'bbq',
  ribs: 'bbq',
  brisket: 'bbq',

  breakfast: 'breakfast',
  brunch: 'breakfast',

  burger: 'burgers',
  burgers: 'burgers',
  cheeseburger: 'burgers',
  double_burger: 'burgers',
  double_cheeseburger: 'burgers',
  bacon_burger: 'burgers',
  smash_burger: 'burgers',

  chicken: 'chicken',
  fried_chicken: 'chicken',
  baked_chicken: 'chicken',
  bbq_chicken: 'chicken',
  barbecue_chicken: 'chicken',
  chicken_combo: 'chicken',

  coffee: 'coffee',
  iced_coffee: 'coffee',
  ice_coffee: 'coffee',
  hot_coffee: 'coffee',

  combo: 'combos',
  combos: 'combos',
  meal: 'combos',
  meals: 'combos',
  plate: 'combos',
  plates: 'combos',

  dessert: 'desserts',
  desserts: 'desserts',
  cake: 'desserts',
  cupcake: 'desserts',
  cookie: 'desserts',

  drink: 'drinks',
  drinks: 'drinks',
  soda: 'drinks',
  soft_drink: 'drinks',
  soft_drinks: 'drinks',
  water: 'drinks',
  juice: 'drinks',
  lemonade: 'drinks',
  beverage: 'drinks',
  beverages: 'drinks',

  fry: 'fries',
  fries: 'fries',
  loaded_fries: 'fries',

  hero: 'hero',
  logo: 'logo',

  hibachi: 'hibachi',
  rice_bowl: 'hibachi',
  rice_bowls: 'hibachi',

  hotdog: 'hot dog',
  hotdogs: 'hot dog',
  hot_dog: 'hot dog',
  hot_dogs: 'hot dog',
  'hot dog': 'hot dog',

  mexican: 'mexican',
  mexican_plate: 'mexican',

  milkshake: 'milkshake',
  milkshakes: 'milkshake',
  shake: 'milkshake',
  shakes: 'milkshake',

  pasta: 'pasta',
  shrimp_pasta: 'pasta',
  chicken_pasta: 'pasta',
  alfredo: 'pasta',

  sandwich: 'sandwiches',
  sandwiches: 'sandwiches',
  pastrami: 'sandwiches',
  pastrami_sandwich: 'sandwiches',

  seafood: 'seafood',
  seafood_boil: 'seafood',
  shrimp: 'seafood',
  fish: 'seafood',
  crab: 'seafood',

  side: 'sides',
  sides: 'sides',

  single: 'singles',
  singles: 'singles',

  smoothie: 'smoothie',
  smoothies: 'smoothie',

  taco: 'tacos',
  tacos: 'tacos',
  burrito: 'tacos',
  burritos: 'tacos',
  street_tacos: 'tacos',
  birria_tacos: 'tacos',

  universal: 'universal',

  wing: 'wings',
  wings: 'wings',
  hot_wings: 'wings',
  fried_wings: 'wings',
  chicken_wings: 'wings',
  buffalo_wings: 'wings',
  bbq_wings: 'wings',
  lemon_pepper_wings: 'wings',
};

const LOCKED_CATEGORIES = [
  'universal',
  'bbq',
  'breakfast',
  'burgers',
  'chicken',
  'coffee',
  'combos',
  'desserts',
  'drinks',
  'fries',
  'hero',
  'hibachi',
  'hot dog',
  'logo',
  'mexican',
  'milkshake',
  'pasta',
  'sandwiches',
  'seafood',
  'sides',
  'singles',
  'smoothie',
  'tacos',
  'wings',
];

function slug(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function displayName(value?: string | null) {
  return String(value || '').replace(/_/g, ' ').trim();
}

function normalizeCategory(value?: string | null) {
  const raw = slug(value);
  if (!raw) return 'universal';
  return CATEGORY_ALIASES[raw] || raw.replace(/_/g, ' ');
}

function tokenList(value?: string | null) {
  return slug(value).split('_').filter(Boolean);
}

function publicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function imageScore(fileName: string, itemName?: string | null, categoryName?: string | null) {
  const file = slug(fileName);
  let score = 0;

  tokenList(itemName).forEach((token) => {
    if (file.includes(token)) score += 25;
  });

  tokenList(categoryName).forEach((token) => {
    if (file.includes(token)) score += 10;
  });

  if (file.includes('combo')) score += 5;
  if (file.includes('premium')) score += 3;
  if (file.includes('universal')) score -= 4;

  return score;
}

function isImageFile(name: string) {
  const clean = name.toLowerCase();
  return (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.avif') ||
    clean.endsWith('.gif')
  );
}

function folderVariants(value?: string | null) {
  const normalized = normalizeCategory(value);
  const rawSlug = slug(value);
  const normalSlug = slug(normalized);

  return Array.from(
    new Set(
      [
        normalized,
        normalized.replace(/ /g, '_'),
        normalized.replace(/_/g, ' '),
        rawSlug,
        rawSlug.replace(/_/g, ' '),
        normalSlug,
        normalSlug.replace(/_/g, ' '),
        CATEGORY_ALIASES[rawSlug],
        CATEGORY_ALIASES[normalSlug],
      ]
        .filter(Boolean)
        .map((folder) => String(folder).trim())
        .filter(Boolean)
    )
  );
}

async function listFolderImages(bucket: string, folder: string) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !data) return [];

  return data
    .filter((file) => file.name && !file.name.startsWith('.') && isImageFile(file.name))
    .map((file) => {
      const path = `${folder}/${file.name}`;
      return {
        url: publicUrl(bucket, path),
        path,
        fileName: file.name,
        category: folder,
      };
    });
}

export default function OrdaImagePicker({
  bucket = DEFAULT_BUCKET,
  itemName,
  categoryName,
  selectedUrl,
  onPick,
  onClose,
}: OrdaImagePickerProps) {
  const mountedRef = useRef(false);
  const preferredCategory = useMemo(() => normalizeCategory(categoryName), [categoryName]);

  const [activeCategory, setActiveCategory] = useState(preferredCategory);
  const [search, setSearch] = useState('');
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [brokenPaths, setBrokenPaths] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add(preferredCategory);
    LOCKED_CATEGORIES.forEach((cat) => set.add(cat));
    return Array.from(set).filter(Boolean);
  }, [preferredCategory]);

  const loadImages = useCallback(
    async (category: string, searchTerm?: string) => {
      setLoading(true);

      const normalized = normalizeCategory(category);
      const searchCategory = normalizeCategory(searchTerm);
      const searchSlug = slug(searchTerm);

      const folders = Array.from(
        new Set(
          [
            ...folderVariants(normalized),
            ...folderVariants(preferredCategory),
            ...(searchSlug ? folderVariants(searchTerm) : []),
            ...(searchSlug && CATEGORY_ALIASES[searchSlug] ? folderVariants(CATEGORY_ALIASES[searchSlug]) : []),
            'universal',
          ]
            .filter(Boolean)
            .map((folder) => String(folder).trim())
            .filter(Boolean)
        )
      );

      const loaded: StorageImage[] = [];

      for (const folder of folders) {
        const rows = await listFolderImages(bucket, folder);
        rows.forEach((row) => {
          const folderNormalized = normalizeCategory(folder);
          const preferredMatch = folderNormalized === preferredCategory;
          const activeMatch = folderNormalized === normalized;
          const searchMatch = searchSlug && folderNormalized === searchCategory;

          loaded.push({
            ...row,
            score:
              imageScore(row.fileName, itemName, categoryName) +
              (preferredMatch ? 60 : 0) +
              (activeMatch ? 40 : 0) +
              (searchMatch ? 80 : 0) +
              (folder === 'universal' ? -15 : 0),
          });
        });
      }

      const deduped = Array.from(new Map(loaded.map((img) => [img.path, img])).values()).sort(
        (a, b) => b.score - a.score || a.fileName.localeCompare(b.fileName)
      );

      if (mountedRef.current) {
        setImages(deduped);
        setLoading(false);
      }
    },
    [bucket, categoryName, itemName, preferredCategory]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setActiveCategory(preferredCategory);
  }, [preferredCategory]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadImages(activeCategory, search);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [activeCategory, search, loadImages]);

  const filteredImages = useMemo(() => {
    const q = slug(search);
    if (!q) return images;

    return images.filter((img) => {
      const imageText = slug(`${img.fileName} ${img.category} ${normalizeCategory(img.category)}`);
      const categoryMatch = normalizeCategory(search) === normalizeCategory(img.category);
      return imageText.includes(q) || categoryMatch;
    });
  }, [images, search]);

  function handleSearchChange(value: string) {
    setSearch(value);

    const normalized = normalizeCategory(value);
    if (value.trim() && categories.some((cat) => normalizeCategory(cat) === normalized)) {
      setActiveCategory(normalized);
    }
  }

  return (
    <section className="ordaImagePicker">
      <header className="pickerHeader">
        <div>
          <h2>Pick Item Image</h2>
          <p>Premium ORDA image options. Item name matches first. Category matches second. No random food.</p>
        </div>

        {onClose ? (
          <button type="button" className="closeBtn" onClick={onClose} aria-label="Close image picker">
            ×
          </button>
        ) : null}
      </header>

      <div className="searchRow">
        <input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Type category or image name..."
          autoComplete="off"
        />
        <span>{loading ? 'Loading...' : `${filteredImages.length} images`}</span>
      </div>

      <div className="categoryTabs" aria-label="Image categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={normalizeCategory(activeCategory) === normalizeCategory(category) ? 'active' : ''}
            onClick={() => {
              setSearch('');
              setActiveCategory(category);
            }}
          >
            {displayName(category)}
          </button>
        ))}
      </div>

      <div className="imageGrid">
        {loading ? (
          <div className="emptyState">Loading images...</div>
        ) : filteredImages.length ? (
          filteredImages.map((image) => {
            const selected = selectedUrl === image.url;
            const broken = brokenPaths[image.path];

            return (
              <button
                key={image.path}
                type="button"
                className={selected ? 'imageCard selected' : 'imageCard'}
                onClick={() => onPick(image)}
              >
                <div className="photoBox">
                  {!broken ? (
                    <img
                      src={image.url}
                      alt={image.fileName}
                      loading="lazy"
                      onError={() => setBrokenPaths((current) => ({ ...current, [image.path]: true }))}
                    />
                  ) : (
                    <div className="brokenBox">
                      <strong>Image path failed</strong>
                      <small>{image.path}</small>
                    </div>
                  )}
                </div>

                <div className="imageMeta">
                  <strong>{image.fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')}</strong>
                  <small>{displayName(image.category)}</small>
                </div>
              </button>
            );
          })
        ) : (
          <div className="emptyState">
            <strong>No images found</strong>
            <span>
              Check Supabase bucket <b>{bucket}</b> folder <b>{displayName(activeCategory)}</b>.
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .ordaImagePicker {
          width: 100%;
          color: #111827;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .pickerHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .pickerHeader h2 {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .pickerHeader p {
          margin: 0;
          max-width: 760px;
          color: #4b5563;
          font-size: 16px;
          line-height: 1.35;
          font-weight: 800;
        }

        .closeBtn {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 0;
          background: #111827;
          color: #fff;
          font-size: 30px;
          cursor: pointer;
        }

        .searchRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
        }

        .searchRow input {
          height: 50px;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          padding: 0 16px;
          background: #fff;
          color: #111827;
          font-size: 16px;
          font-weight: 850;
          outline: none;
        }

        .searchRow input:focus {
          border-color: #d6a516;
          box-shadow: 0 0 0 4px rgba(214, 165, 22, 0.18);
        }

        .searchRow span {
          color: #6b7280;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
        }

        .categoryTabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 4px 0 16px;
        }

        .categoryTabs button {
          flex: 0 0 auto;
          height: 42px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 0 18px;
          background: #fff;
          color: #111827;
          font-weight: 950;
          text-transform: capitalize;
          cursor: pointer;
        }

        .categoryTabs button.active {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }

        .imageGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .imageCard {
          overflow: hidden;
          padding: 0;
          border: 2px solid #e5e7eb;
          background: #fff;
          border-radius: 18px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .imageCard:hover {
          transform: translateY(-2px);
          border-color: #d6a516;
          box-shadow: 0 16px 38px rgba(17, 24, 39, 0.14);
        }

        .imageCard.selected {
          border-color: #d6a516;
          box-shadow: 0 0 0 4px rgba(214, 165, 22, 0.22);
        }

        .photoBox {
          height: 180px;
          background: #080a0f;
          display: grid;
          place-items: center;
        }

        .photoBox img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .brokenBox {
          width: 100%;
          height: 100%;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          background: #111827;
          color: #fff;
        }

        .brokenBox small {
          color: #d1d5db;
          word-break: break-all;
        }

        .imageMeta {
          padding: 12px 14px 14px;
          display: grid;
          gap: 4px;
        }

        .imageMeta strong {
          font-size: 15px;
          line-height: 1.15;
          color: #111827;
          text-transform: capitalize;
        }

        .imageMeta small {
          color: #6b7280;
          font-weight: 900;
          text-transform: capitalize;
        }

        .emptyState {
          grid-column: 1 / -1;
          min-height: 220px;
          border: 1px dashed #cbd5e1;
          border-radius: 18px;
          background: #f8fafc;
          color: #374151;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 24px;
          font-weight: 850;
        }

        .emptyState strong {
          display: block;
          font-size: 18px;
          margin-bottom: 6px;
        }

        @media (max-width: 900px) {
          .imageGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .pickerHeader h2 {
            font-size: 24px;
          }

          .pickerHeader p {
            font-size: 14px;
          }

          .searchRow {
            grid-template-columns: 1fr;
          }

          .imageGrid {
            grid-template-columns: 1fr;
          }

          .photoBox {
            height: 210px;
          }
        }
      `}</style>
    </section>
  );
}

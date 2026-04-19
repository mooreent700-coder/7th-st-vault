'use client';

import { useState, useMemo } from 'react';

export default function CategorySection({ categories, items, renderItem }: any) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Build categories + include ALL
  const allCategories = useMemo(() => {
    const map = new Map();

    categories?.forEach((cat: any) => {
      if (!cat?.name) return;
      map.set(cat.id || cat.name.toLowerCase(), cat.name);
    });

    return [
      { key: 'all', label: 'All' },
      ...Array.from(map.entries()).map(([key, label]) => ({
        key,
        label,
      })),
    ];
  }, [categories]);

  // FILTER LOGIC
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;

    return items.filter((item: any) => {
      return (
        item.category_id === selectedCategory ||
        item.category?.toLowerCase() === selectedCategory
      );
    });
  }, [items, selectedCategory]);

  return (
    <>
      {/* CATEGORY BUTTONS */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20 }}>
        {allCategories.map((cat: any) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.2)',
              background: selectedCategory === cat.key ? '#fff' : 'transparent',
              color: selectedCategory === cat.key ? '#000' : '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* MENU ITEMS */}
      <div style={{ display: 'grid', gap: 16 }}>
        {filteredItems.map((item: any) => (
          <div key={item.id}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </>
  );
}
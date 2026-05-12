// ORDA LOCKED CATEGORY OPTION SYSTEM (FINAL CLEAN)

export type OrdaSelectionMode = 'single' | 'multiple';

export type OrdaPresetChoice = {
  name: string;
  price_delta: number;
};

export type OrdaPresetGroup = {
  name: string;
  is_required: boolean;
  selection_mode: OrdaSelectionMode;
  choices: OrdaPresetChoice[];
};

function normalize(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function hasAny(key: string, words: string[]) {
  return words.some((word) => key.includes(word));
}

export function getOrdaOptionPreset(categoryName: string, itemName: string): OrdaPresetGroup[] {
  const key = normalize(`${categoryName} ${itemName}`);

  const isDrink = hasAny(key, ['drink','drinks','soda','soft','juice','beverage']);
  const isMexican = hasAny(key, ['mexican','taco','burrito','quesadilla','nacho']);
  const isSeafood = hasAny(key, ['seafood','shrimp','fish','crab','lobster','boil']);
  const isWing = hasAny(key, ['wing','wings']);
  const isBurger = hasAny(key, ['burger','sandwich']);
  const isSide = hasAny(key, ['fries','side']);

  // ================= DRINKS =================
  if (isDrink) {
    return [
      {
        name: 'Drink Brand',
        is_required: true,
        selection_mode: 'single',
        choices: [
          { name: 'Coca-Cola', price_delta: 0 },
          { name: 'Pepsi', price_delta: 0 },
          { name: 'Sprite', price_delta: 0 },
          { name: 'Fanta', price_delta: 0 },
          { name: 'Dr Pepper', price_delta: 0 },
          { name: 'Water', price_delta: 0 },
        ],
      },
      {
        name: 'Flavor',
        is_required: false,
        selection_mode: 'single',
        choices: [
          { name: 'Original', price_delta: 0 },
          { name: 'Strawberry', price_delta: 0 },
          { name: 'Mango', price_delta: 0 },
          { name: 'Pineapple', price_delta: 0 },
          { name: 'Fruit Punch', price_delta: 0 },
        ],
      },
      {
        name: 'Size',
        is_required: true,
        selection_mode: 'single',
        choices: [
          { name: 'Can', price_delta: 0 },
          { name: 'Bottle', price_delta: 1 },
          { name: 'Large', price_delta: 2 },
        ],
      },
      {
        name: 'Ice',
        is_required: false,
        selection_mode: 'single',
        choices: [
          { name: 'Regular Ice', price_delta: 0 },
          { name: 'Light Ice', price_delta: 0 },
          { name: 'No Ice', price_delta: 0 },
        ],
      },
    ];
  }

  // ================= MEXICAN =================
  if (isMexican) {
    return [
      {
        name: 'Protein',
        is_required: true,
        selection_mode: 'single',
        choices: [
          { name: 'Chicken', price_delta: 0 },
          { name: 'Beef', price_delta: 1 },
          { name: 'Steak', price_delta: 2 },
        ],
      },
      {
        name: 'Add Ons',
        is_required: false,
        selection_mode: 'multiple',
        choices: [
          { name: 'Sour Cream', price_delta: 0.75 },
          { name: 'Cheese Sauce', price_delta: 1 },
          { name: 'Guacamole', price_delta: 1.5 },
          { name: 'Extra Meat', price_delta: 3 },
        ],
      },
      {
        name: 'Remove Items',
        is_required: false,
        selection_mode: 'multiple',
        choices: [
          { name: 'No Onion', price_delta: 0 },
          { name: 'No Cilantro', price_delta: 0 },
        ],
      },
    ];
  }

  // ================= SEAFOOD =================
  if (isSeafood) {
    return [
      {
        name: 'Sauce',
        is_required: false,
        selection_mode: 'single',
        choices: [
          { name: 'Garlic Butter', price_delta: 0 },
          { name: 'Cajun', price_delta: 0 },
          { name: 'Lemon Pepper', price_delta: 0 },
        ],
      },
      {
        name: 'Spice Level',
        is_required: false,
        selection_mode: 'single',
        choices: [
          { name: 'Mild', price_delta: 0 },
          { name: 'Medium', price_delta: 0 },
          { name: 'Hot', price_delta: 0 },
        ],
      },
      {
        name: 'Add Ons',
        is_required: false,
        selection_mode: 'multiple',
        choices: [
          { name: 'Extra Shrimp', price_delta: 4 },
          { name: 'Extra Crab', price_delta: 6 },
          { name: 'Corn', price_delta: 1 },
          { name: 'Potatoes', price_delta: 1 },
        ],
      },
    ];
  }

  // ================= WINGS =================
  if (isWing) {
    return [
      {
        name: 'Flavor',
        is_required: true,
        selection_mode: 'single',
        choices: [
          { name: 'Buffalo', price_delta: 0 },
          { name: 'BBQ', price_delta: 0 },
          { name: 'Lemon Pepper', price_delta: 0 },
        ],
      },
      {
        name: 'Dipping Sauce',
        is_required: false,
        selection_mode: 'multiple',
        choices: [
          { name: 'Ranch', price_delta: 0.75 },
          { name: 'Blue Cheese', price_delta: 0.75 },
        ],
      },
    ];
  }

  // ================= BURGER =================
  if (isBurger) {
    return [
      {
        name: 'Add Ons',
        is_required: false,
        selection_mode: 'multiple',
        choices: [
          { name: 'Add Cheese', price_delta: 1 },
          { name: 'Add Bacon', price_delta: 2 },
          { name: 'Extra Patty', price_delta: 4 },
        ],
      },
    ];
  }

  // ================= SIDES =================
  if (isSide) {
    return [
      {
        name: 'Add Ons',
        is_required: false,
        selection_mode: 'multiple',
        choices: [
          { name: 'Extra Sauce', price_delta: 0.75 },
        ],
      },
    ];
  }

  // ================= DEFAULT =================
  return [
    {
      name: 'Special Instructions',
      is_required: false,
      selection_mode: 'multiple',
      choices: [
        { name: 'Extra Sauce', price_delta: 0.75 },
        { name: 'No Sauce', price_delta: 0 },
      ],
    },
  ];
}
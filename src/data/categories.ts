import { ShopType, StockItem } from '../types';

export interface CategoryDef {
  id: string;
  name: {
    en: string;
    hi: string;
    pa: string;
  };
  iconName: string;
}

export const GENERAL_STORE_CATEGORIES: CategoryDef[] = [
  {
    id: 'tobacco_cigarettes',
    name: {
      en: 'Tobacco & Cigarettes',
      hi: 'तंबाकू और सिगरेट',
      pa: 'ਤੰਬਾਕੂ ਤੇ ਸਿਗਰਟ',
    },
    iconName: 'Flame',
  },
  {
    id: 'cold_drinks',
    name: {
      en: 'Cold Drinks',
      hi: 'कोल्ड ड्रिंक्स',
      pa: 'ਕੋਲਡ ਡ੍ਰਿੰਕਸ',
    },
    iconName: 'Wine',
  },
  {
    id: 'chips_namkeen',
    name: {
      en: 'Chips & Namkeen',
      hi: 'चिप्स और नमकीन',
      pa: 'ਚਿਪਸ ਤੇ ਨਮਕੀਨ',
    },
    iconName: 'Utensils',
  },
  {
    id: 'biscuits_snacks',
    name: {
      en: 'Biscuits & Snacks',
      hi: 'बिस्कुट और स्नैक्स',
      pa: 'ਬਿਸਕੁਟ ਤੇ ਸਨੈਕਸ',
    },
    iconName: 'Cookie',
  },
  {
    id: 'bread_bakery',
    name: {
      en: 'Bread & Bakery',
      hi: 'ब्रेड और बेकरी',
      pa: 'ਬ੍ਰੈੱਡ ਤੇ ਬੇਕਰੀ',
    },
    iconName: 'Sandwich',
  },
  {
    id: 'milk_dairy',
    name: {
      en: 'Milk & Dairy',
      hi: 'दूध और डेयरी',
      pa: 'ਦੁੱਧ ਤੇ ਡੇਅਰੀ',
    },
    iconName: 'Milk',
  },
  {
    id: 'ration',
    name: {
      en: 'Ration (Atta, Dal, Oil)',
      hi: 'राशन (दाल, आटा, तेल)',
      pa: 'ਰਾਸ਼ਨ (ਦਾਲ, ਆਟਾ, ਤੇਲ)',
    },
    iconName: 'Wheat',
  },
  {
    id: 'spices',
    name: {
      en: 'Spices & Masala',
      hi: 'मसाले और नमक',
      pa: 'ਮਸਾਲੇ ਤੇ ਲੂਣ',
    },
    iconName: 'Sparkles',
  },
  {
    id: 'cleaning_supplies',
    name: {
      en: 'Cleaning Supplies (Soap, Surf)',
      hi: 'सफ़ाई का सामान (साबुन, सर्फ)',
      pa: 'ਸਫ਼ਾਈ ਦਾ ਸਮਾਨ (ਸਾਬਣ, ਸਰਫ਼)',
    },
    iconName: 'Droplets',
  },
  {
    id: 'cleaning_tools',
    name: {
      en: 'Cleaning Tools (Brooms, Mops)',
      hi: 'झाड़ू-पोछा व सामान',
      pa: 'ਝਾੜੂ-ਪੋਛਾ ਤੇ ਸਮਾਨ',
    },
    iconName: 'Brush',
  },
];

export const STATIONERY_CATEGORIES: CategoryDef[] = [
  {
    id: 'stationery',
    name: {
      en: 'Stationery (Notebooks, Pens)',
      hi: 'कापियां, पैन व स्टेशनरी',
      pa: 'ਕਾਪੀਆਂ, ਪੈੱਨ ਤੇ ਸਟੇਸ਼ਨਰੀ',
    },
    iconName: 'BookOpen',
  },
  {
    id: 'uniforms',
    name: {
      en: 'Uniforms (School & Coll.)',
      hi: 'स्कूली व कॉलेज वर्दी',
      pa: 'ਸਕੂਲੀ ਵਰਦੀ',
    },
    iconName: 'Shirt',
  },
  {
    id: 'shoes',
    name: {
      en: 'Shoes & Socks',
      hi: 'जूते और मोजे',
      pa: 'ਜੁੱਤੇ ਤੇ ਜੁਰਾਬਾਂ',
    },
    iconName: 'Footprints',
  },
  {
    id: 'first_aid',
    name: {
      en: 'First Aid & Medicines',
      hi: 'दवा-पट्टी व फर्स्ट एड',
      pa: 'ਫਸਟ ਏਡ ਤੇ ਪੱਟੀ',
    },
    iconName: 'HeartPulse',
  },
  {
    id: 'ice_cream',
    name: {
      en: 'Ice Cream & Kulfi',
      hi: 'आइसक्रीम और कुल्फ़ी',
      pa: 'ਆਈਸਕ੍ਰੀਮ ਤੇ ਕੁਲਫ਼ੀ',
    },
    iconName: 'IceCream',
  },
  {
    id: 'general_items',
    name: {
      en: 'General Items & Gifts',
      hi: 'अन्य ज़रूरी सामान',
      pa: 'ਆਮ ਸਮਾਨ ਤੇ ਤੋਹਫ਼ੇ',
    },
    iconName: 'Gift',
  },
];

export function getCategoriesByShopType(shopType: ShopType): CategoryDef[] {
  return shopType === 'stationery' ? STATIONERY_CATEGORIES : GENERAL_STORE_CATEGORIES;
}

// Initial realistic starter items for first-time onboarding
export function getStarterItems(shopType: ShopType): StockItem[] {
  const now = new Date().toISOString();
  if (shopType === 'stationery') {
    return [
      {
        id: 'item_st_1',
        name: 'Classmate 4-Line Notebook',
        category: 'stationery',
        unit: 'piece',
        quantity: 36,
        reorderLevel: 15,
        buyPrice: 32,
        sellPrice: 45,
        packetSize: 6,
        spoilQuickly: false,
        exchangeableOnSpoil: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_st_2',
        name: 'Reynolds 045 Blue Ball Pen',
        category: 'stationery',
        unit: 'piece',
        quantity: 80,
        reorderLevel: 25,
        buyPrice: 7,
        sellPrice: 10,
        packetSize: 20,
        spoilQuickly: false,
        exchangeableOnSpoil: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_st_3',
        name: 'School White Shirt (Size 32)',
        category: 'uniforms',
        unit: 'piece',
        quantity: 12,
        reorderLevel: 5,
        buyPrice: 190,
        sellPrice: 280,
        spoilQuickly: false,
        exchangeableOnSpoil: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_st_4',
        name: 'Action White Canvas PT Shoes (Size 6)',
        category: 'shoes',
        unit: 'pair',
        quantity: 8,
        reorderLevel: 4,
        buyPrice: 320,
        sellPrice: 450,
        spoilQuickly: false,
        exchangeableOnSpoil: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_st_5',
        name: 'Amul Chocobar Ice Cream',
        category: 'ice_cream',
        unit: 'piece',
        quantity: 6,
        reorderLevel: 12,
        buyPrice: 16,
        sellPrice: 20,
        packetSize: 24,
        spoilQuickly: true,
        exchangeableOnSpoil: false, // Pure loss if melted/spoiled
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_st_6',
        name: 'Band-Aid Washproof Strips',
        category: 'first_aid',
        unit: 'packet',
        quantity: 15,
        reorderLevel: 8,
        buyPrice: 22,
        sellPrice: 30,
        packetSize: 10,
        spoilQuickly: false,
        exchangeableOnSpoil: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // General Store Starter Items
  return [
    {
      id: 'item_gs_1',
      name: 'Amul Taaza Toned Milk (500ml)',
      category: 'milk_dairy',
      unit: 'pouch',
      quantity: 5,
      reorderLevel: 15,
      buyPrice: 25.5,
      sellPrice: 27,
      packetSize: 12,
      spoilQuickly: true, // Spoils quickly!
      exchangeableOnSpoil: false, // Pure loss when wasted
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_2',
      name: 'Harvest Gold White Bread (Large)',
      category: 'bread_bakery',
      unit: 'packet',
      quantity: 4,
      reorderLevel: 8,
      buyPrice: 42,
      sellPrice: 50,
      packetSize: 6,
      spoilQuickly: true, // Spoils quickly!
      exchangeableOnSpoil: true, // Can be exchanged with bread delivery boy!
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_3',
      name: 'Dettol Original Bath Soap (75g)',
      category: 'cleaning_supplies',
      unit: 'piece',
      quantity: 14,
      reorderLevel: 10,
      buyPrice: 34,
      sellPrice: 40,
      packetSize: 4, // Soap sold single, but ordered 4-to-a-packet!
      spoilQuickly: false,
      exchangeableOnSpoil: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_4',
      name: 'Parle-G Glucose Biscuits (80g)',
      category: 'biscuits_snacks',
      unit: 'packet',
      quantity: 28,
      reorderLevel: 15,
      buyPrice: 8.5,
      sellPrice: 10,
      packetSize: 24,
      spoilQuickly: false,
      exchangeableOnSpoil: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_5',
      name: 'Lay\'s India\'s Magic Masala (₹20)',
      category: 'chips_namkeen',
      unit: 'packet',
      quantity: 8,
      reorderLevel: 12,
      buyPrice: 16.5,
      sellPrice: 20,
      packetSize: 12,
      spoilQuickly: false,
      exchangeableOnSpoil: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_6',
      name: 'Coca-Cola (750ml Pet Bottle)',
      category: 'cold_drinks',
      unit: 'bottle',
      quantity: 18,
      reorderLevel: 8,
      buyPrice: 35,
      sellPrice: 40,
      packetSize: 12,
      spoilQuickly: false,
      exchangeableOnSpoil: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_7',
      name: 'Tata Salt Vaccum Evaporated (1kg)',
      category: 'spices',
      unit: 'packet',
      quantity: 22,
      reorderLevel: 10,
      buyPrice: 23,
      sellPrice: 28,
      packetSize: 25,
      spoilQuickly: false,
      exchangeableOnSpoil: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_gs_8',
      name: 'Gold Flake Kings Cigarette',
      category: 'tobacco_cigarettes',
      unit: 'packet',
      quantity: 10,
      reorderLevel: 6,
      buyPrice: 165,
      sellPrice: 180,
      packetSize: 10,
      spoilQuickly: false,
      exchangeableOnSpoil: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

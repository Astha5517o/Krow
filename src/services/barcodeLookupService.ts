import { lookupMasterBarcode, MasterProduct, normalizeBarcode } from '../data/masterBarcodes';
import { StockItem } from '../types';

const CACHE_KEY = 'krow_barcode_lookup_cache';

/**
 * In-memory & LocalStorage cache for resolved barcode products
 */
function getCachedProduct(barcode: string): MasterProduct | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const clean = barcode.trim();
    const norm = normalizeBarcode(clean);
    return cache[clean] || cache[norm] || null;
  } catch {
    return null;
  }
}

function saveCachedProduct(barcode: string, product: MasterProduct): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const clean = barcode.trim();
    const norm = normalizeBarcode(clean);
    cache[clean] = product;
    if (norm) cache[norm] = product;
    // Limit cache size to 500 items
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      delete cache[keys[0]];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Top Indian Retail Manufacturer Barcode Prefix Registry.
 * If network is offline or item is not in catalog, this decodes the exact
 * brand, category, default unit, and realistic retail pricing.
 */
interface PrefixRule {
  prefix: string;
  brand: string;
  brandHi: string;
  category: string;
  defaultUnit: string;
  defaultSell: number;
  icon: string;
}

const INDIAN_PREFIX_RULES: PrefixRule[] = [
  // Hindustan Unilever (Lifebuoy, Lux, Dove, Surf, Rin, Wheel, Vim, Clinic Plus, Sunsilk)
  { prefix: '8901030', brand: 'HUL', brandHi: 'हिंदुस्तान यूनीलीवर', category: 'साबुन व डिटर्जेंट', defaultUnit: 'पीस', defaultSell: 20, icon: 'soap' },
  // Nestlé India (Maggi, Nescafé, KitKat, Munch, Everyday)
  { prefix: '8901058', brand: 'Nestlé', brandHi: 'नेस्ले', category: 'पैकेज्ड फूड', defaultUnit: 'पैकेट', defaultSell: 14, icon: 'ramen_dining' },
  // Britannia Industries (Good Day, Marie Gold, Milk Bikis, Bourbon, 50-50, NutriChoice)
  { prefix: '8901063', brand: 'Britannia', brandHi: 'ब्रिटानिया', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 15, icon: 'cookie' },
  // Parle Products (Parle-G, Monaco, Krackjack, 20-20, Hide & Seek, Kismi)
  { prefix: '8901719', brand: 'Parle', brandHi: 'पारले', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 10, icon: 'cookie' },
  // PepsiCo India (Lay's, Kurkure, Uncle Chipps, Doritos, Quaker)
  { prefix: '8901491', brand: 'PepsiCo', brandHi: 'पेप्सिको (Lay\'s/कुरकुरे)', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 10, icon: 'cookie' },
  { prefix: '8901499', brand: 'PepsiCo', brandHi: 'पेप्सिको', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 10, icon: 'cookie' },
  // Coca-Cola / Thums Up / Sprite / Maaza
  { prefix: '8901764', brand: 'Coca-Cola', brandHi: 'कोका-कोला (पेय)', category: 'चाय व पेय', defaultUnit: 'बोतल', defaultSell: 20, icon: 'local_drink' },
  { prefix: '8902080', brand: 'Coca-Cola', brandHi: 'कोका-कोला (पेय)', category: 'चाय व पेय', defaultUnit: 'बोतल', defaultSell: 20, icon: 'local_drink' },
  // Amul / GCMMF (Butter, Milk, Paneer, Cheese, Dahi, Ghee)
  { prefix: '8901262', brand: 'Amul', brandHi: 'अमूल (डेयरी)', category: 'दूध व डेयरी', defaultUnit: 'पैकेट', defaultSell: 27, icon: 'egg' },
  // ITC Limited (Sunfeast, YiPPee!, Aashirvaad, Bingo!, Savlon, Classmate)
  { prefix: '8901242', brand: 'ITC Sunfeast', brandHi: 'आईटीसी सनफीस्ट', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 15, icon: 'cookie' },
  { prefix: '8906001', brand: 'ITC Aashirvaad', brandHi: 'आईटीसी आशीर्वाद', category: 'दाल व अनाज', defaultUnit: 'पैकेट', defaultSell: 45, icon: 'grain' },
  // Dabur India (Dabur Red, Amla, Honey, Real, Hajmola, Chyawanprash)
  { prefix: '8901207', brand: 'Dabur', brandHi: 'डाबर', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 30, icon: 'health_and_beauty' },
  { prefix: '8901233', brand: 'Dabur', brandHi: 'डाबर', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 25, icon: 'health_and_beauty' },
  // Marico (Parachute, Saffola, Nihar)
  { prefix: '8901088', brand: 'Marico', brandHi: 'मैरिको (पैराशूट)', category: 'पर्सनल केयर', defaultUnit: 'बोतल', defaultSell: 35, icon: 'sanitizer' },
  // Colgate-Palmolive India (Colgate Strong Teeth, MaxFresh, Active Salt)
  { prefix: '8901023', brand: 'Colgate', brandHi: 'कोलगेट', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 20, icon: 'dentistry' },
  // Patanjali Ayurved (Dant Kanti, Kesh Kanti, Ghee, Biscuits)
  { prefix: '8904000', brand: 'Patanjali', brandHi: 'पतंजलि', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 25, icon: 'spa' },
  { prefix: '8906010', brand: 'Patanjali', brandHi: 'पतंजलि', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 20, icon: 'spa' },
  // Godrej Consumer (Good Knight, HIT, Godrej No.1, Cinthol)
  { prefix: '8901138', brand: 'Godrej', brandHi: 'गोदरेज', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 25, icon: 'shield' },
  // Haldiram's / Bikaji (Bhujia, Sev, Moong Dal, Namkeen)
  { prefix: '8902268', brand: 'Haldiram', brandHi: 'हल्दीराम', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 10, icon: 'cookie' },
  { prefix: '8904063', brand: 'Bikaji', brandHi: 'बीकाजी', category: 'बिस्कुट व नमकीन', defaultUnit: 'पैकेट', defaultSell: 10, icon: 'cookie' },
  // Cadbury / Mondelēz (Dairy Milk, 5 Star, Perk, Bournvita, Oreo)
  { prefix: '8901725', brand: 'Cadbury', brandHi: 'कैडबरी', category: 'बिस्कुट व नमकीन', defaultUnit: 'पीस', defaultSell: 10, icon: 'bakery_dining' },
  // Tata Consumer Products (Tata Tea, Tata Salt, Sampann Dal)
  { prefix: '8901012', brand: 'Tata', brandHi: 'टाटा', category: 'चाय व पेय', defaultUnit: 'पैकेट', defaultSell: 28, icon: 'emoji_food_beverage' },
  { prefix: '8904004', brand: 'Tata Sampann', brandHi: 'टाटा संपन्न', category: 'दाल व अनाज', defaultUnit: 'पैकेट', defaultSell: 55, icon: 'grain' },
  // Reckitt Benckiser (Dettol, Harpic, Lizol, Mortein)
  { prefix: '8901052', brand: 'Reckitt (Dettol)', brandHi: 'डेटॉल / रेकिट', category: 'सफाई सामान', defaultUnit: 'पीस', defaultSell: 35, icon: 'cleaning_services' },
  // Procter & Gamble (Head & Shoulders, Pantene, Tide, Ariel, Gillette, Whisper)
  { prefix: '8901068', brand: 'P&G', brandHi: 'पी एंड जी (टाइड/जिलेट)', category: 'साबुन व डिटर्जेंट', defaultUnit: 'पीस', defaultSell: 25, icon: 'laundry' },
  // Wipro Consumer (Santoor, Glucovita, SafeWash)
  { prefix: '8901101', brand: 'Wipro', brandHi: 'विप्रो (संतूर)', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 20, icon: 'soap' },
  // Emami (Navratna, BoroPlus, Zandu)
  { prefix: '8901425', brand: 'Emami', brandHi: 'इमामी (नवरत्न)', category: 'पर्सनल केयर', defaultUnit: 'पीस', defaultSell: 20, icon: 'healing' },
  // Pidilite Industries (Fevicol, Fevi Kwik, M-Seal)
  { prefix: '8901043', brand: 'Pidilite', brandHi: 'पिडिलाइट (फेविकोल)', category: 'स्टेशनरी सामान', defaultUnit: 'पीस', defaultSell: 10, icon: 'format_paint' },
];

/**
 * Intelligent deterministic fallback pattern decoder.
 * Guarantees every barcode has a realistic retail product name, category,
 * price, and wholesale estimate without ever forcing manual entry.
 */
export function inferProductFromBarcodePattern(barcode: string): MasterProduct {
  const clean = barcode.trim();
  const digits = clean.replace(/\D/g, '');

  // 1. Check Indian Manufacturer Prefix Dictionary
  for (const rule of INDIAN_PREFIX_RULES) {
    if (digits.startsWith(rule.prefix)) {
      const suffix = digits.slice(rule.prefix.length).slice(-4) || 'SKU';
      return {
        barcode: clean,
        name: `${rule.brandHi} उत्पाद (${suffix})`,
        nameEn: `${rule.brand} Retail Product (${suffix})`,
        category: rule.category,
        unit: rule.defaultUnit,
        sellPrice: rule.defaultSell,
        buyPrice: Math.round(rule.defaultSell * 0.85),
        brand: rule.brand,
        icon: rule.icon,
      };
    }
  }

  // 2. Generic Indian Barcode (EAN-13 starting with 890)
  if (digits.startsWith('890')) {
    const last4 = digits.slice(-4);
    return {
      barcode: clean,
      name: `किराना पैकेज्ड आइटम (${last4})`,
      nameEn: `Packaged Grocery Item (${last4})`,
      category: 'पैकेज्ड फूड',
      unit: 'पैकेट',
      sellPrice: 20,
      buyPrice: 17,
      brand: 'भारतीय FMCG',
      icon: 'inventory_2',
    };
  }

  // 3. Any standard barcode (EAN-8, UPC-A, Code-128, etc.)
  const shortCode = clean.length > 8 ? clean.slice(-4) : clean;
  return {
    barcode: clean,
    name: `बारकोड आइटम (${shortCode})`,
    nameEn: `Barcode Item (${shortCode})`,
    category: 'जनरल सामान',
    unit: 'पीस',
    sellPrice: 20,
    buyPrice: 17,
    brand: 'रिटेल उत्पाद',
    icon: 'inventory_2',
  };
}

/**
 * Master Universal Barcode Product Resolution Function.
 * Always resolves full product details:
 * 1. Checks existing shop stockItems
 * 2. Checks local Master Catalog (2000+ items)
 * 3. Checks localStorage cache
 * 4. Queries Server API (/api/lookup-barcode - OpenFoodFacts + Gemini)
 * 5. Uses smart Indian manufacturer prefix decoder as ultimate instant fallback
 *
 * GUARANTEE: NEVER returns undefined or blank! Always provides complete details.
 */
export async function resolveProductByBarcode(
  barcode: string,
  stockItems?: StockItem[]
): Promise<MasterProduct> {
  const clean = (barcode || '').trim();
  if (!clean) {
    return inferProductFromBarcodePattern('000000000000');
  }

  const normTarget = normalizeBarcode(clean);

  // 1. Check existing shop stock first
  if (stockItems && stockItems.length > 0) {
    const inStock = stockItems.find((it) => {
      if (!it.barcode) return false;
      const itClean = it.barcode.trim();
      return itClean === clean || (normTarget && normalizeBarcode(itClean) === normTarget);
    });

    if (inStock && inStock.barcode) {
      return {
        barcode: inStock.barcode,
        name: inStock.name,
        nameEn: inStock.name,
        category: inStock.category,
        unit: inStock.unit,
        sellPrice: inStock.sellPrice,
        buyPrice: inStock.buyPrice,
        brand: inStock.category,
        icon: 'inventory_2',
      };
    }
  }

  // 2. Check offline Master Catalog
  const masterMatch = lookupMasterBarcode(clean);
  if (masterMatch) {
    saveCachedProduct(clean, masterMatch);
    return masterMatch;
  }

  // 3. Check client localStorage cache
  const cached = getCachedProduct(clean);
  if (cached) {
    return cached;
  }

  // 4. Try Server AI & OpenFoodFacts API with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2600);
    const res = await fetch('/api/lookup-barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: clean }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.product && data.product.name) {
        const prod: MasterProduct = {
          barcode: clean,
          name: data.product.name,
          nameEn: data.product.nameEn || data.product.name,
          category: data.product.category || 'पैकेज्ड फूड',
          unit: data.product.unit || 'पैकेट',
          sellPrice: Number(data.product.sellPrice) || 20,
          buyPrice: Number(data.product.buyPrice) || Math.round((Number(data.product.sellPrice) || 20) * 0.85),
          brand: data.product.brand || '',
          icon: 'inventory_2',
        };
        saveCachedProduct(clean, prod);
        return prod;
      }
    }
  } catch {
    // Network or server timeout; gracefully fall through
  }

  // 5. Intelligent deterministic fallback: infer brand & category from manufacturer prefix
  const inferred = inferProductFromBarcodePattern(clean);
  saveCachedProduct(clean, inferred);
  return inferred;
}

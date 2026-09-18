import { StockItem } from '../types';

// Normalized translation/synonym stems for Hindi/English/Hinglish
const SYNONYM_MAP: Record<string, string[]> = {
  atta: ['आटा', 'गेहूं', 'wheat', 'flour', 'chakki', 'rajdhani atta', 'aashirvaad'],
  'white chane': ['सफेद चना', 'काबुली', 'काबूली', 'छोले', 'चना', 'chole', 'chana', 'kabuli'],
  chane: ['चना', 'चना दाल', 'छोले', 'chole', 'chana'],
  refind: ['रिफाइंड', 'तेल', 'refined', 'oil', 'fortune', 'soya', 'soyabean', 'sunflower'],
  refined: ['रिफाइंड', 'तेल', 'oil', 'fortune'],
  'garam masala': ['गरम मसाला', 'मसाला', 'spices'],
  haldi: ['हल्दी', 'turmeric', 'हल्दी पाउडर'],
  'lal mirch': ['लाल मिर्च', 'मिर्च', 'chilli', 'chili', 'mirch powder'],
  mirch: ['मिर्च', 'chilli', 'लाल मिर्च', 'हरी मिर्च'],
  maida: ['मैदा', 'all purpose flour'],
  ajwain: ['अजवाइन', 'carom'],
  jeera: ['जीरा', 'cumin'],
  dhaniya: ['धनिया', 'coriander'],
  besan: ['बेसन', 'gram flour'],
  sooji: ['सूजी', 'रवा', 'suji', 'rava'],
  chawal: ['चावल', 'rice', 'बासमती', 'basmati'],
  dal: ['दाल', 'arhar', 'toor', 'moong', 'urad', 'masoor', 'chana dal'],
  cheeni: ['चीनी', 'sugar', 'शक्कर'],
  namak: ['नमक', 'salt', 'tata salt'],
  sarson: ['सरसों', 'mustard', 'कड़वा तेल'],
  tel: ['तेल', 'oil'],
  ghee: ['घी', 'desi ghee', 'amul ghee'],
  doodh: ['दूध', 'milk', 'amul'],
  bread: ['ब्रेड', 'पाव'],
  maggi: ['मैगी', 'noodles'],
  biscuit: ['बिस्कुट', 'parle', 'marie', 'good day'],
  chai: ['चाय', 'tea', 'taj mahal', 'red label'],
};

export function normalizeWord(str: string): string {
  return str
    .toLowerCase()
    .replace(/[0-9]+(\.[0-9]+)?\s*(kg|k\.g\.|k g|g|gm|gms|grams|ml|l|ltr|लीटर|किलो|ग्राम)/gi, '')
    .replace(/[0-9]+x[0-9]+/gi, '')
    .replace(/[0-9]+/g, '')
    .replace(/[-_().,/\\*+]/g, ' ')
    .trim();
}

/**
 * Smart matcher that links scanned bill item names with existing stock in the shop
 */
export function matchStockItem(scannedName: string, stockItems: StockItem[]): StockItem | undefined {
  if (!stockItems || stockItems.length === 0) return undefined;

  const cleanScanned = normalizeWord(scannedName);
  const scannedLower = scannedName.toLowerCase();

  // 1. Direct name includes / exact match
  for (const item of stockItems) {
    const itemLower = item.name.toLowerCase();
    const cleanItem = normalizeWord(item.name);

    if (itemLower === scannedLower || cleanItem === cleanScanned) {
      return item;
    }
    if (cleanScanned.length > 2 && cleanItem.includes(cleanScanned)) {
      return item;
    }
    if (cleanItem.length > 2 && cleanScanned.includes(cleanItem)) {
      return item;
    }
  }

  // 2. Check bilingual synonyms
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    const keyMatchesScanned = cleanScanned.includes(key) || synonyms.some((s) => cleanScanned.includes(s.toLowerCase()));

    if (keyMatchesScanned) {
      // Find a stock item that matches the key or any of its synonyms
      const match = stockItems.find((item) => {
        const itemLower = item.name.toLowerCase();
        if (itemLower.includes(key)) return true;
        return synonyms.some((s) => itemLower.includes(s.toLowerCase()));
      });

      if (match) return match;
    }
  }

  // 3. Word token intersection
  const scannedTokens = cleanScanned.split(/\s+/).filter((t) => t.length > 2);
  let bestMatch: StockItem | undefined = undefined;
  let maxMatchedTokens = 0;

  for (const item of stockItems) {
    const itemTokens = normalizeWord(item.name).split(/\s+/).filter((t) => t.length > 2);
    const commonTokens = scannedTokens.filter((st) => itemTokens.some((it) => it.includes(st) || st.includes(it)));

    if (commonTokens.length > maxMatchedTokens) {
      maxMatchedTokens = commonTokens.length;
      bestMatch = item;
    }
  }

  if (maxMatchedTokens > 0) {
    return bestMatch;
  }

  return undefined;
}

/**
 * Automatically infers product category based on product name
 */
export function inferCategory(name: string): string {
  const lower = name.toLowerCase();

  // Spices / मसाले
  if (
    lower.includes('masala') ||
    lower.includes('मसाला') ||
    lower.includes('haldi') ||
    lower.includes('हल्दी') ||
    lower.includes('mirch') ||
    lower.includes('मिर्च') ||
    lower.includes('ajwain') ||
    lower.includes('अजवाइन') ||
    lower.includes('jeera') ||
    lower.includes('जीरा') ||
    lower.includes('dhaniya') ||
    lower.includes('धनिया') ||
    lower.includes('hing') ||
    lower.includes('हींग') ||
    lower.includes('elaichi') ||
    lower.includes('इलायची') ||
    lower.includes('laung') ||
    lower.includes('लौंग') ||
    lower.includes('kali mirch') ||
    lower.includes('काली मिर्च') ||
    lower.includes('tejpatta') ||
    lower.includes('garam')
  ) {
    return 'मसाले';
  }

  // Edible Oil & Ghee / खाद्य तेल व घी
  if (
    lower.includes('oil') ||
    lower.includes('tel') ||
    lower.includes('तेल') ||
    lower.includes('refind') ||
    lower.includes('refined') ||
    lower.includes('रिफाइंड') ||
    lower.includes('sarson') ||
    lower.includes('सरसों') ||
    lower.includes('ghee') ||
    lower.includes('घी') ||
    lower.includes('dalda') ||
    lower.includes('tin') ||
    lower.includes('टिन') ||
    lower.includes('fortune') ||
    lower.includes('फॉर्च्यून')
  ) {
    return 'खाद्य तेल व घी';
  }

  // Pulses & Grains / दाल व अनाज
  if (
    lower.includes('atta') ||
    lower.includes('आटा') ||
    lower.includes('maida') ||
    lower.includes('मैदा') ||
    lower.includes('sooji') ||
    lower.includes('सूजी') ||
    lower.includes('suji') ||
    lower.includes('rava') ||
    lower.includes('रवा') ||
    lower.includes('chana') ||
    lower.includes('chane') ||
    lower.includes('चना') ||
    lower.includes('छोले') ||
    lower.includes('dal') ||
    lower.includes('दाल') ||
    lower.includes('rice') ||
    lower.includes('chawal') ||
    lower.includes('चावल') ||
    lower.includes('besan') ||
    lower.includes('बेसन') ||
    lower.includes('poha') ||
    lower.includes('पोहा')
  ) {
    return 'दाल व अनाज';
  }

  // Milk & Dairy / दूध व डेयरी
  if (
    lower.includes('milk') ||
    lower.includes('doodh') ||
    lower.includes('दूध') ||
    lower.includes('paneer') ||
    lower.includes('पनीर') ||
    lower.includes('dahi') ||
    lower.includes('दही') ||
    lower.includes('curd') ||
    lower.includes('butter') ||
    lower.includes('मक्खन') ||
    lower.includes('amul')
  ) {
    return 'दूध व डेयरी';
  }

  // Biscuits & Snacks / बिस्कुट व नमकीन
  if (
    lower.includes('biscuit') ||
    lower.includes('बिस्कुट') ||
    lower.includes('parle') ||
    lower.includes('पारले') ||
    lower.includes('maggi') ||
    lower.includes('मैगी') ||
    lower.includes('rusk') ||
    lower.includes('टोस्ट') ||
    lower.includes('toast') ||
    lower.includes('namkeen') ||
    lower.includes('नमकीन') ||
    lower.includes('bhujia') ||
    lower.includes('भुजिया')
  ) {
    return 'बिस्कुट व नमकीन';
  }

  // Soaps & Detergents / साबुन व डिटर्जेंट
  if (
    lower.includes('soap') ||
    lower.includes('साबुन') ||
    lower.includes('surf') ||
    lower.includes('detergent') ||
    lower.includes('डिटर्जेंट') ||
    lower.includes('vim') ||
    lower.includes('wheel') ||
    lower.includes('tide') ||
    lower.includes('rin')
  ) {
    return 'साबुन व डिटर्जेंट';
  }

  // Stationery / कॉपियाँ व रजिस्टर
  if (
    lower.includes('pen') ||
    lower.includes('पेन') ||
    lower.includes('pencil') ||
    lower.includes('पेंसिल') ||
    lower.includes('register') ||
    lower.includes('रजिस्टर') ||
    lower.includes('copy') ||
    lower.includes('कॉपी') ||
    lower.includes('notebook')
  ) {
    return 'कॉपियाँ व रजिस्टर';
  }

  return 'जनरल सामान';
}

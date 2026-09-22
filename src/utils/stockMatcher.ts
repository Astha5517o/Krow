import { StockItem } from '../types';
import {
  KaryanaMasterItem,
  searchKaryanaMaster,
  KARYANA_MASTER_ITEMS,
} from '../data/karyanaMasterCatalog';
import { searchStationeryMaster } from '../data/stationeryMasterCatalog';

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

  // 1. पेन, पेंसिल व सुधार सामग्री
  if (
    lower.includes('pen') ||
    lower.includes('पेन') ||
    lower.includes('ballpoint') ||
    lower.includes('likho') ||
    lower.includes('fenko') ||
    lower.includes('trimax') ||
    lower.includes('pilot') ||
    lower.includes('siyahi') ||
    lower.includes('स्याही') ||
    lower.includes('fountain pen') ||
    lower.includes('refill') ||
    lower.includes('रीफिल') ||
    lower.includes('pencil') ||
    lower.includes('पेंसिल') ||
    lower.includes('kacchi pencil') ||
    lower.includes('clutch') ||
    lower.includes('tuk-tuk') ||
    lower.includes('lead') ||
    lower.includes('sikka') ||
    lower.includes('सिक्का') ||
    lower.includes('eraser') ||
    lower.includes('rubber') ||
    lower.includes('रबर') ||
    lower.includes('sharpener') ||
    lower.includes('ghadni') ||
    lower.includes('chhillak') ||
    lower.includes('शार्पनर') ||
    lower.includes('घड़नी') ||
    lower.includes('छिल्लक') ||
    lower.includes('whitener') ||
    lower.includes('व्हाइटनर') ||
    lower.includes('correction') ||
    lower.includes('marker') ||
    lower.includes('मार्कर') ||
    lower.includes('highlighter') ||
    lower.includes('हाइलाइटर')
  ) {
    return 'पेन, पेंसिल व सुधार सामग्री';
  }

  // 2. कॉपियाँ, रजिस्टर व पेपर
  if (
    lower.includes('copy') ||
    lower.includes('कॉपी') ||
    lower.includes('notebook') ||
    lower.includes('नोटबुक') ||
    lower.includes('register') ||
    lower.includes('रजिस्टर') ||
    lower.includes('long book') ||
    lower.includes('bahi-khata') ||
    lower.includes('khata') ||
    lower.includes('bahi') ||
    lower.includes('बही') ||
    lower.includes('hisab') ||
    lower.includes('practical') ||
    lower.includes('drawing') ||
    lower.includes('ड्राइंग') ||
    lower.includes('sketch copy') ||
    lower.includes('a4') ||
    lower.includes('rim') ||
    lower.includes('रीम') ||
    lower.includes('ream') ||
    lower.includes('assignment') ||
    lower.includes('test sheet') ||
    lower.includes('graph') ||
    lower.includes('ग्राफ') ||
    lower.includes('carbon') ||
    lower.includes('कार्बन') ||
    lower.includes('chart paper') ||
    lower.includes('चार्ट') ||
    lower.includes('tracing') ||
    lower.includes('glaze') ||
    lower.includes('crepe') ||
    lower.includes('handmade')
  ) {
    return 'कॉपियाँ, रजिस्टर व पेपर';
  }

  // 3. ज्योमेट्री बॉक्स व स्केल
  if (
    lower.includes('geometry') ||
    lower.includes('ज्योमेट्री') ||
    lower.includes('compass') ||
    lower.includes('prakar') ||
    lower.includes('परकार') ||
    lower.includes('divider') ||
    lower.includes('डिवाइडर') ||
    lower.includes('protractor') ||
    lower.includes('chanda') ||
    lower.includes('चांदा') ||
    lower.includes('set square') ||
    lower.includes('tikona') ||
    lower.includes('तिकोना') ||
    lower.includes('scale') ||
    lower.includes('स्केल') ||
    lower.includes('futti') ||
    lower.includes('फुट्टी') ||
    lower.includes('futta') ||
    lower.includes('फुट्टा') ||
    lower.includes('ruler')
  ) {
    return 'ज्योमेट्री बॉक्स व स्केल';
  }

  // 4. रंग, पेंट व आर्ट क्राफ्ट
  if (
    lower.includes('crayon') ||
    lower.includes('क्रेयॉन') ||
    lower.includes('mom wale') ||
    lower.includes('oil pastel') ||
    lower.includes('pastel') ||
    lower.includes('पेस्टल') ||
    lower.includes('color pencil') ||
    lower.includes('sketch pen') ||
    lower.includes('स्केच') ||
    lower.includes('poster color') ||
    lower.includes('पोस्टर') ||
    lower.includes('water color') ||
    lower.includes('paint') ||
    lower.includes('brush') ||
    lower.includes('kuchi') ||
    lower.includes('कूची') ||
    lower.includes('palette') ||
    lower.includes('पैलेट')
  ) {
    return 'रंग, पेंट व आर्ट क्राफ्ट';
  }

  // 5. गोंद, टेप व कैंची
  if (
    lower.includes('fevicol') ||
    lower.includes('फेविकोल') ||
    lower.includes('fevikwik') ||
    lower.includes('फेविक्विक') ||
    lower.includes('fevistik') ||
    lower.includes('फेविस्टिक') ||
    lower.includes('glue') ||
    lower.includes('gond') ||
    lower.includes('गोंद') ||
    lower.includes('gum') ||
    lower.includes('tape') ||
    lower.includes('टेप') ||
    lower.includes('scissors') ||
    lower.includes('kainchi') ||
    lower.includes('कैंची') ||
    lower.includes('cutter') ||
    lower.includes('कटर')
  ) {
    return 'गोंद, टेप व कैंची';
  }

  // 6. फाइल, फोल्डर व ऑफिस सामान
  if (
    lower.includes('file') ||
    lower.includes('फाइल') ||
    lower.includes('folder') ||
    lower.includes('फोल्डर') ||
    lower.includes('clear book') ||
    lower.includes('stapler') ||
    lower.includes('स्टेपलर') ||
    lower.includes('stepney') ||
    lower.includes('staple pin') ||
    lower.includes('punching') ||
    lower.includes('पंचिंग') ||
    lower.includes('paper clip') ||
    lower.includes('all-pin') ||
    lower.includes('binder clip') ||
    lower.includes('rubber band') ||
    lower.includes('chhalla') ||
    lower.includes('ছल्ला') ||
    lower.includes('sticky note') ||
    lower.includes('post-it') ||
    lower.includes('stamp pad') ||
    lower.includes('angutha')
  ) {
    return 'फाइल, फोल्डर व ऑफिस सामान';
  }

  // Check stationery master catalog match first
  const statMatches = searchStationeryMaster(name, 1);
  if (statMatches.length > 0) {
    const topStat = statMatches[0];
    const topClean = normalizeWord(topStat.name);
    const inputClean = normalizeWord(name);
    if (topClean.includes(inputClean) || inputClean.includes(topClean) || topStat.nameEn.toLowerCase().includes(inputClean)) {
      return topStat.category;
    }
  }

  // Check exact/high confidence match from master grocery catalog
  const masterMatches = searchKaryanaMaster(name, 1);
  if (masterMatches.length > 0) {
    const top = masterMatches[0];
    const topClean = normalizeWord(top.name);
    const inputClean = normalizeWord(name);
    if (topClean.includes(inputClean) || inputClean.includes(topClean) || top.nameEn.toLowerCase().includes(inputClean)) {
      return top.category;
    }
  }

  return 'जनरल सामान';
}

/**
 * Matches a scanned OCR bill line name against Master Catalogs (Stationery & Karyana)
 */
export function matchMasterKaryanaItem(scannedName: string): KaryanaMasterItem | undefined {
  if (!scannedName || scannedName.trim().length < 2) return undefined;

  // 1. Check Stationery Master first
  const statResults = searchStationeryMaster(scannedName, 3);
  const cleanScanned = normalizeWord(scannedName);

  for (const item of statResults) {
    const cleanItemName = normalizeWord(item.name);
    const cleanItemEn = normalizeWord(item.nameEn);

    if (cleanItemName === cleanScanned || cleanItemEn === cleanScanned) {
      return item;
    }
    if (cleanScanned.length > 3 && (cleanItemName.includes(cleanScanned) || cleanItemEn.includes(cleanScanned))) {
      return item;
    }
    if (cleanItemName.length > 3 && cleanScanned.includes(cleanItemName)) {
      return item;
    }
  }

  // 2. Check Karyana Master
  const results = searchKaryanaMaster(scannedName, 3);
  if (results.length === 0) {
    return statResults[0];
  }

  // Check if first result is a strong match
  for (const item of results) {
    const cleanItemName = normalizeWord(item.name);
    const cleanItemEn = normalizeWord(item.nameEn);

    if (cleanItemName === cleanScanned || cleanItemEn === cleanScanned) {
      return item;
    }
    if (cleanScanned.length > 3 && (cleanItemName.includes(cleanScanned) || cleanItemEn.includes(cleanScanned))) {
      return item;
    }
    if (cleanItemName.length > 3 && cleanScanned.includes(cleanItemName)) {
      return item;
    }
  }

  return statResults[0] || results[0];
}

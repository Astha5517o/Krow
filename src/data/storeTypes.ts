import { StoreType, Language } from '../types';
import { translations } from '../translations';

export interface StoreTypeConfig {
  id: StoreType;
  icon: string;
  emoji: string;
  titleKey: 'storeTypeGeneralStoreTitle' | 'storeTypeStationeryTitle' | 'storeTypeUniformTitle' | 'storeTypeGiftShopTitle';
  descKey: 'storeTypeGeneralStoreDesc' | 'storeTypeStationeryDesc' | 'storeTypeUniformDesc' | 'storeTypeGiftShopDesc';
  sampleTags: Record<Language, string[]>;
}

export const STORE_TYPE_CONFIGS: StoreTypeConfig[] = [
  {
    id: 'kirana', // Acts as General Store / Kirana
    icon: 'storefront',
    emoji: '🏪',
    titleKey: 'storeTypeGeneralStoreTitle',
    descKey: 'storeTypeGeneralStoreDesc',
    sampleTags: {
      hi: ['दाल व अनाज', 'खाद्य तेल', 'मसाले', 'साबुन', 'दूध'],
      pa: ['ਦਾਲਾਂ ਤੇ ਅਨਾਜ', 'ਖਾਣ ਵਾਲਾ ਤੇਲ', 'ਮਸਾਲੇ', 'ਸਾਬਣ', 'ਦੁੱਧ'],
      en: ['Pulses & Grains', 'Edible Oil', 'Spices', 'Soaps', 'Milk'],
      ja: ['穀物・豆類', '食用油', '調味料', '石鹸', '乳製品'],
    },
  },
  {
    id: 'stationery',
    icon: 'edit_note',
    emoji: '✏️',
    titleKey: 'storeTypeStationeryTitle',
    descKey: 'storeTypeStationeryDesc',
    sampleTags: {
      hi: ['कॉपियाँ', 'पेन व पेंसिल', 'रंग व क्राफ्ट', 'ऑफिस फाइल्स'],
      pa: ['ਕਾਪੀਆਂ', 'ਪੈੱਨ ਤੇ ਪੈਨਸਿਲ', 'ਰੰਗ', 'ਦਫ਼ਤਰੀ ਫਾਈਲਾਂ'],
      en: ['Notebooks', 'Pens & Pencils', 'Art & Craft', 'Office Files'],
      ja: ['ノート・帳簿', '筆記用具', '画材', '事務ファイル'],
    },
  },
  {
    id: 'uniform',
    icon: 'checkroom',
    emoji: '👔',
    titleKey: 'storeTypeUniformTitle',
    descKey: 'storeTypeUniformDesc',
    sampleTags: {
      hi: ['स्कूल ड्रेस (शर्ट/पैंट)', 'स्कर्ट', 'टाई व बेल्ट', 'जूते व मोज़े', 'ब्लेज़र'],
      pa: ['ਸਕੂਲ ਕਮੀਜ਼ਾਂ/ਪੈਂਟਾਂ', 'ਸਕਰਟਾਂ', 'ਟਾਈ ਤੇ ਬੈਲਟ', 'ਜੁੱਤੇ ਤੇ ਜੁਰਾਬਾਂ', 'ਬਲੇਜ਼ਰ'],
      en: ['School Shirts/Pants', 'Skirts', 'Ties & Belts', 'Shoes & Socks', 'Blazers'],
      ja: ['学生服・シャツ', 'スカート', 'ネクタイ・ベルト', '靴・靴下', 'ブレザー'],
    },
  },
  {
    id: 'gift_shop',
    icon: 'redeem',
    emoji: '🎁',
    titleKey: 'storeTypeGiftShopTitle',
    descKey: 'storeTypeGiftShopDesc',
    sampleTags: {
      hi: ['खिलौने', 'गिफ्ट शोपीस', 'दीवार घड़ियां', 'फोटो फ्रेम', 'ग्रीटिंग कार्ड्स'],
      pa: ['ਖਿਡੌਣੇ', 'ਤੋਹਫ਼ੇ', 'ਕੰਧ ਘੜੀਆਂ', 'ਫੋਟੋ ਫਰੇਮ', 'ਗ੍ਰੀਟਿੰਗ ਕਾਰਡ'],
      en: ['Toys & Games', 'Showpieces', 'Wall Clocks', 'Photo Frames', 'Greeting Cards'],
      ja: ['おもちゃ', '置物・フィギュア', '掛け時計', 'フォトフレーム', 'ギフトカード'],
    },
  },
];

export function getStoreConfig(type: StoreType): StoreTypeConfig {
  const normalized = (type === 'general_store' ? 'kirana' : type) as StoreType;
  return STORE_TYPE_CONFIGS.find((c) => c.id === normalized) || STORE_TYPE_CONFIGS[0];
}

export function getStoreTypeTitle(type: StoreType, lang: Language): string {
  const cfg = getStoreConfig(type);
  return translations[lang][cfg.titleKey];
}

import { WholesalerSupplier, SupplierChannel, SupplierOrderMode, Language } from '../types';

export const DEFAULT_WHOLESALERS: WholesalerSupplier[] = [
  {
    id: 'ws-ration-gupta',
    name: 'गुप्ता गल्ला भंडार (राशन व किराना मंडी)',
    channel: 'ration_mandi',
    orderMode: 'slip',
    phone: '9876543210',
    category: 'दाल, आटा, चावल, तेल, मसाले, चीनी',
    timingOrSchedule: 'पर्चा शाम 7 बजे से पहले भेजें (टेम्पो डिलीवरी)',
    notes: 'थोक गल्ला मंडी — बोरी, कट्टा व पेटी के भाव में पर्चा देना होता है',
  },
  {
    id: 'ws-tobacco-goyal',
    name: 'गोयल सिगरेट व तंबाकू एजेंसी (ITC & Godfrey)',
    channel: 'tobacco_agency',
    orderMode: 'slip',
    phone: '9812345678',
    category: 'सिगरेट, बीड़ी, तंबाकू, माचिस, गुटखा',
    timingOrSchedule: 'एजेंसी पर्चा (WhatsApp / प्रिंट)',
    notes: 'एजेंसी पर डब्बा / खोका / बंडल का इंडेंट पर्चा देना अनिवार्य है',
  },
  {
    id: 'ws-daily-britannia',
    name: 'ब्रिटानिया व बेकरी दैनिक वैन (Daily Salesman)',
    channel: 'daily_salesman',
    orderMode: 'daily_salesman',
    phone: '9823456789',
    category: 'ब्रेड, रस्क, पाव, बन, फ्रूट केक',
    timingOrSchedule: 'रोज़ सुबह 10:30 बजे दुकान पर वैन लेकर आते हैं',
    notes: 'सेल्समैन रोज़ दुकान पर आता है — खाली रैक देखकर तुरंत माल देता है',
  },
  {
    id: 'ws-daily-parle',
    name: 'पारले व ओरियो बिस्कुट वेंडर (Parle & Mondelez)',
    channel: 'daily_salesman',
    orderMode: 'daily_salesman',
    phone: '9834567890',
    category: 'पारले-जी, 20-20, गुड डे, हाइड एंड सीक, ओरियो',
    timingOrSchedule: 'रोज़ दोपहर 12:00 बजे ऑर्डर लेने आते हैं',
    notes: 'बिस्कुट के कार्टन व लड़ी काउंटर पर चेक करवाकर ऑर्डर लेते हैं',
  },
  {
    id: 'ws-daily-namkeen-chips',
    name: 'बालाजी / लेज़ चिप्स व नमकीन वैन (Chips & Namkeen)',
    channel: 'daily_salesman',
    orderMode: 'daily_salesman',
    phone: '9845678901',
    category: 'लेज़, कुरकुरे, आलू भुजिया, बालाजी वेफर्स, हैंगर लड़ी',
    timingOrSchedule: 'रोज़ दोपहर 1:30 बजे वैन आती है',
    notes: 'चिप्स हैंगर व नमकीन जार चेक करके सेल्समैन से नया माल लिया जाता है',
  },
  {
    id: 'ws-dairy-radha',
    name: 'राधा डेयरी सप्लायर (ताज़ा दूध व दही)',
    channel: 'dairy_fresh',
    orderMode: 'daily_salesman',
    phone: '9856789012',
    category: 'दूध, दही, पनीर, छाछ',
    timingOrSchedule: 'रोज़ सुबह 6:00 बजे क्रेट में डिलीवरी',
    notes: 'दैनिक सवेरे क्रेट चेक — क्रेट एक्सचेंज नियम',
  },
];

export function inferWholesalerInfo(category: string, name?: string): {
  channel: SupplierChannel;
  orderMode: SupplierOrderMode;
  suggestedSupplierName: string;
} {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // 1. Tobacco & Cigarettes
  if (
    cat.includes('तंबाकू') ||
    cat.includes('बीड़ी') ||
    cat.includes('सिगरेट') ||
    cat.includes('गुटखा') ||
    cat.includes('पान मसाला') ||
    n.includes('सिगरेट') ||
    n.includes('flake') ||
    n.includes('classic') ||
    n.includes('बीड़ी') ||
    n.includes('माचिस') ||
    n.includes('विमल') ||
    n.includes('कमला')
  ) {
    return {
      channel: 'tobacco_agency',
      orderMode: 'slip',
      suggestedSupplierName: 'गोयल सिगरेट व तंबाकू एजेंसी (ITC & Godfrey)',
    };
  }

  // 2. Bread, Biscuits, Chips, Namkeen (Daily Route Salesman)
  if (
    cat.includes('ब्रेड') ||
    cat.includes('बेकरी') ||
    cat.includes('बिस्कुट') ||
    cat.includes('नमकीन') ||
    cat.includes('चिप्स') ||
    cat.includes('स्नैक्स') ||
    n.includes('ब्रेड') ||
    n.includes('रस्क') ||
    n.includes('पाव') ||
    n.includes('बिस्कुट') ||
    n.includes('पारले') ||
    n.includes('ब्रिटानिया') ||
    n.includes('ओरियो') ||
    n.includes('गुड डे') ||
    n.includes('लेज़') ||
    n.includes('lays') ||
    n.includes('कुरकुरे') ||
    n.includes('भुजिया') ||
    n.includes('वेफर्स')
  ) {
    if (cat.includes('ब्रेड') || n.includes('ब्रेड') || n.includes('रस्क') || n.includes('पाव')) {
      return {
        channel: 'daily_salesman',
        orderMode: 'daily_salesman',
        suggestedSupplierName: 'ब्रिटानिया व बेकरी दैनिक वैन (Daily Salesman)',
      };
    }
    if (cat.includes('चिप्स') || n.includes('चिप्स') || n.includes('कुरकुरे') || n.includes('lays')) {
      return {
        channel: 'daily_salesman',
        orderMode: 'daily_salesman',
        suggestedSupplierName: 'बालाजी / लेज़ चिप्स व नमकीन वैन (Chips & Namkeen)',
      };
    }
    return {
      channel: 'daily_salesman',
      orderMode: 'daily_salesman',
      suggestedSupplierName: 'पारले व ओरियो बिस्कुट वेंडर (Parle & Mondelez)',
    };
  }

  // 3. Dairy & Milk
  if (cat.includes('दूध') || cat.includes('डेयरी') || n.includes('दूध') || n.includes('दही') || n.includes('पनीर')) {
    return {
      channel: 'dairy_fresh',
      orderMode: 'daily_salesman',
      suggestedSupplierName: 'राधा डेयरी सप्लायर (ताज़ा दूध व दही)',
    };
  }

  // 4. Ration, Grains, Grocery Mandi (Send Slip)
  return {
    channel: 'ration_mandi',
    orderMode: 'slip',
    suggestedSupplierName: 'गुप्ता गल्ला भंडार (राशन व किराना मंडी)',
  };
}

export function getChannelBadgeDetails(channel?: SupplierChannel, lang: Language = 'hi'): {
  title: string;
  orderModeText: string;
  icon: string;
  bgColor: string;
  textColor: string;
  badgeBorder: string;
} {
  switch (channel) {
    case 'ration_mandi':
      return {
        title: lang === 'hi' ? 'राशन व किराना मंडी' : lang === 'pa' ? 'ਰਾਸ਼ਨ ਮੰਡੀ' : 'Ration & Groceries Mandi',
        orderModeText: lang === 'hi' ? 'पर्चा भेजें (WhatsApp/प्रिंट)' : lang === 'pa' ? 'ਪਰਚੀ ਭੇਜੋ' : 'Send Slip to Mandi',
        icon: 'receipt_long',
        bgColor: 'bg-[#FFF8E7]',
        textColor: 'text-[#8A5A00]',
        badgeBorder: 'border-[#F0C968]',
      };
    case 'tobacco_agency':
      return {
        title: lang === 'hi' ? 'सिगरेट व तंबाकू एजेंसी' : lang === 'pa' ? 'ਸਿਗਰਟ ਤੇ ਤੰਬਾਕੂ ਏਜੰਸੀ' : 'Tobacco & Cigarette Agency',
        orderModeText: lang === 'hi' ? 'एजेंसी पर्चा (डब्बा/खोका)' : lang === 'pa' ? 'ਏਜੰਸੀ ਪਰਚੀ (ਡੱਬਾ/ਖੋਖਾ)' : 'Send Slip to Agency',
        icon: 'smoke_free',
        bgColor: 'bg-[#FBEAEA]',
        textColor: 'text-[#9E2A2B]',
        badgeBorder: 'border-[#F4A7A8]',
      };
    case 'daily_salesman':
      return {
        title: lang === 'hi' ? 'दैनिक वैन सेल्समैन' : lang === 'pa' ? 'ਰੋਜ਼ਾਨਾ ਵੈਨ ਸੇਲਜ਼ਮੈਨ' : 'Daily Route Salesman',
        orderModeText: lang === 'hi' ? 'दुकान पर ऑर्डर लेने आते हैं' : lang === 'pa' ? 'ਦੁਕਾਨ ਤੇ ਆਰਡਰ ਲੈਂਦੇ ਹਨ' : 'Visits Shop Daily',
        icon: 'local_shipping',
        bgColor: 'bg-[#EBF5EF]',
        textColor: 'text-[#1E4632]',
        badgeBorder: 'border-[#A3D9B5]',
      };
    case 'dairy_fresh':
      return {
        title: lang === 'hi' ? 'डेयरी व ताज़ा सप्लायर' : lang === 'pa' ? 'ਡੇਅਰੀ ਸਪਲਾਇਰ' : 'Dairy & Fresh Supplier',
        orderModeText: lang === 'hi' ? 'दैनिक सुबह डिलीवरी' : lang === 'pa' ? 'ਰੋਜ਼ਾਨਾ ਸਵੇਰੇ ਡਿਲੀਵਰੀ' : 'Daily Morning Delivery',
        icon: 'water_drop',
        bgColor: 'bg-[#EAF4FC]',
        textColor: 'text-[#0E5484]',
        badgeBorder: 'border-[#A4CEF0]',
      };
    default:
      return {
        title: lang === 'hi' ? 'अन्य थोक विक्रेता' : lang === 'pa' ? 'ਹੋਰ ਥੋਕ ਵਪਾਰੀ' : 'General Wholesaler',
        orderModeText: lang === 'hi' ? 'ऑर्डर लिस्ट' : lang === 'pa' ? 'ਆਰਡਰ ਲਿਸਟ' : 'Wholesale Order',
        icon: 'inventory_2',
        bgColor: 'bg-[#F2EFE9]',
        textColor: 'text-[#4F4A42]',
        badgeBorder: 'border-[#D9D3C7]',
      };
  }
}

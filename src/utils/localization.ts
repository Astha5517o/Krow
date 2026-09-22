import { Language, StoreType } from '../types';

export const CATEGORY_MAP: Record<string, Record<Language, string>> = {
  // Kirana
  'दूध व डेयरी': { hi: 'दूध व डेयरी', pa: 'ਦੁੱਧ ਤੇ ਡੇਅਰੀ', en: 'Dairy & Milk', ja: '乳製品・牛乳' },
  'ब्रेड व बेकरी': { hi: 'ब्रेड व बेकरी', pa: 'ਬ੍ਰੈੱਡ ਤੇ ਬੇਕਰੀ', en: 'Bread & Bakery', ja: 'パン・ベーカリー' },
  'दाल व अनाज': { hi: 'दाल व अनाज', pa: 'ਦਾਲਾਂ ਤੇ ਅਨਾਜ', en: 'Pulses & Grains', ja: '豆類・穀物' },
  'खाद्य तेल व घी': { hi: 'खाद्य तेल व घी', pa: 'ਤੇਲ ਤੇ ਘਿਓ', en: 'Edible Oil & Ghee', ja: '食用油・ギー' },
  'मसाले': { hi: 'मसाले', pa: 'ਮਸਾਲੇ', en: 'Spices & Condiments', ja: 'スパイス・調味料' },
  'बिस्कुट व नमकीन': { hi: 'बिस्कुट व नमकीन', pa: 'ਬਿਸਕੁਟ ਤੇ ਨਮਕੀਨ', en: 'Biscuits & Snacks', ja: 'ビスケット・スナック' },
  'चिप्स व कोल्ड ड्रिंक्स': { hi: 'चिप्स व कोल्ड ड्रिंक्स', pa: 'ਚਿਪਸ ਤੇ ਕੋਲਡ ਡ੍ਰਿੰਕਸ', en: 'Chips & Cold Drinks', ja: 'ポテチ・清涼飲料' },
  'तंबाकू व बीड़ी': { hi: 'तंबाकू व बीड़ी', pa: 'ਤੰਬਾਕੂ ਤੇ ਬੀੜੀ', en: 'Tobacco & Paan', ja: 'タバコ・嗜好品' },
  'सफाई का सामान': { hi: 'सफाई का सामान', pa: 'ਸਫ਼ਾਈ ਸਮੱਗਰੀ', en: 'Cleaning Supplies', ja: '日用清掃用品' },
  'साबुन व डिटर्जेंट': { hi: 'साबुन व डिटर्जेंट', pa: 'ਸਾਬਣ ਤੇ ਡਿਟਰਜੈਂਟ', en: 'Soaps & Detergents', ja: '石鹸・洗剤' },

  // Stationery (Core 6 Sections)
  'पेन, पेंसिल व सुधार सामग्री': { hi: 'पेन, पेंसिल व सुधार सामग्री', pa: 'ਪੈੱਨ, ਪੈਨਸਿਲ ਤੇ ਸੁਧਾਰ ਸਮੱਗਰੀ', en: 'Writing & Correction Tools', ja: '筆記具・修正用品' },
  'कॉपियाँ, रजिस्टर व पेपर': { hi: 'कॉपियाँ, रजिस्टर व पेपर', pa: 'ਕਾਪੀਆਂ, ਰਜਿਸਟਰ ਤੇ ਪੇਪਰ', en: 'Notebooks, Registers & Paper', ja: 'ノート・帳簿・用紙' },
  'ज्योमेट्री बॉक्स व स्केल': { hi: 'ज्योमेट्री बॉक्स व स्केल', pa: 'ਜਿਓਮੈਟਰੀ ਬਾਕਸ ਤੇ ਸਕੇਲ', en: 'Geometry Box & Rulers', ja: 'コンパス・定規・測定具' },
  'रंग, पेंट व आर्ट क्राफ्ट': { hi: 'रंग, पेंट व आर्ट क्राफ्ट', pa: 'ਰੰਗ, ਪੇਂਟ ਤੇ ਆਰਟ ਕਰਾਫਟ', en: 'Colors, Paint & Art Craft', ja: '絵の具・画材・工作' },
  'गोंद, टेप व कैंची': { hi: 'गोंद, टेप व कैंची', pa: 'ਗੂੰਦ, ਟੇਪ ਤੇ ਕੈਂਚੀ', en: 'Adhesives, Tapes & Scissors', ja: '接着剤・テープ・ハサミ' },
  'फाइल, फोल्डर व ऑफिस सामान': { hi: 'फाइल, फोल्डर व ऑफिस सामान', pa: 'ਫਾਈਲ, ਫੋਲਡਰ ਤੇ ਦਫ਼ਤਰੀ ਸਮਾਨ', en: 'Files, Folders & Office Desk', ja: 'ファイル・フォルダー・事務用品' },

  // Stationery Legacy & General
  'कॉपियाँ व रजिस्टर': { hi: 'कॉपियाँ व रजिस्टर', pa: 'ਕਾਪੀਆਂ ਤੇ ਰਜਿਸਟਰ', en: 'Notebooks & Registers', ja: 'ノート・帳簿' },
  'पेन व पेंसिल': { hi: 'पेन व पेंसिल', pa: 'ਪੈੱਨ ਤੇ ਪੈਨਸਿਲ', en: 'Pens & Pencils', ja: '筆記具・鉛筆' },
  'स्कूल यूनिफॉर्म': { hi: 'स्कूल यूनिफॉर्म', pa: 'ਸਕੂਲ ਵਰਦੀਆਂ', en: 'School Uniforms', ja: '学生服・制服' },
  'स्कूल जूते व मोज़े': { hi: 'स्कूल जूते व मोज़े', pa: 'ਸਕੂਲ ਜੁੱਤੇ ਤੇ ਜੁਰਾਬਾਂ', en: 'School Shoes & Socks', ja: '学生靴・靴下' },
  'रंग व क्राफ्ट': { hi: 'रंग व क्राफ्ट', pa: 'ਰੰਗ ਤੇ ਕਰਾਫਟ', en: 'Colors & Craft', ja: '絵の具・工作用品' },
  'ऑफिस स्टेशनरी': { hi: 'ऑफिस स्टेशनरी', pa: 'ਦਫ਼ਤਰੀ ਸਟੇਸ਼ਨਰੀ', en: 'Office Stationery', ja: '事務用品・文具' },
  'फर्स्ट एड': { hi: 'फर्स्ट एड', pa: 'ਮੁੱਢਲੀ ਸਹਾਇਤਾ', en: 'First Aid', ja: '救急・衛生用品' },
  'आइसक्रीम व स्नैक्स': { hi: 'आइसक्रीम व स्नैक्स', pa: 'ਆਈਸ ਕਰੀਮ ਤੇ ਸਨੈਕਸ', en: 'Ice Creams & Snacks', ja: 'アイス・軽食' },
  'जनरल सामान': { hi: 'जनरल सामान', pa: 'ਜਨਰਲ ਸਮਾਨ', en: 'General Merchandise', ja: '雑貨・日用品' },

  // Uniform
  'स्कूल यूनिफॉर्म (शर्ट/पैंट)': { hi: 'स्कूल यूनिफॉर्म (शर्ट/पैंट)', pa: 'ਸਕੂਲ ਵਰਦੀਆਂ (ਕਮੀਜ਼/ਪੈਂਟ)', en: 'School Uniform (Shirts/Pants)', ja: '学生服・シャツ/スラックス' },
  'स्कर्ट व ट्यूनिक': { hi: 'स्कर्ट व ट्यूनिक', pa: 'ਸਕਰਟ ਤੇ ਟਿਊਨਿਕ', en: 'Skirts & Tunics', ja: 'スカート・チュニック' },
  'टाई व बेल्ट': { hi: 'टाई व बेल्ट', pa: 'ਟਾਈ ਤੇ ਬੈਲਟ', en: 'Ties & Belts', ja: 'ネクタイ・ベルト' },
  'स्वेटर व ब्लेज़र': { hi: 'स्वेटर व ब्लेज़र', pa: 'ਸਵੈਟਰ ਤੇ ਬਲੇਜ਼ਰ', en: 'Sweaters & Blazers', ja: 'セーター・ブレザー' },
  'हाउस टी-शर्ट व ट्रैकसूट': { hi: 'हाउस टी-शर्ट व ट्रैकसूट', pa: 'ਹਾਊਸ ਟੀ-ਸ਼ਰਟਾਂ ਤੇ ਟਰੈਕਸੂਟ', en: 'House T-Shirts & Tracksuits', ja: '体操服・ジャージ' },
  'बैज व आईडी कार्ड': { hi: 'बैज व आईडी कार्ड', pa: 'ਬੈਜ ਤੇ ਆਈਡੀ ਕਾਰਡ', en: 'Badges & ID Cards', ja: '校章・名札' },
  'जनरल कपड़े': { hi: 'जनरल कपड़े', pa: 'ਜਨਰਲ ਕੱਪੜੇ', en: 'General Apparel', ja: '衣料品全般' },

  // Gift Shop
  'खिलौने व गेम्स': { hi: 'खिलौने व गेम्स', pa: 'ਖਿਡੌਣੇ ਤੇ ਗੇਮਾਂ', en: 'Toys & Games', ja: 'おもちゃ・知育玩具' },
  'गिफ्ट शोपीस व मूर्तियाँ': { hi: 'गिफ्ट शोपीस व मूर्तियाँ', pa: 'ਤੋਹਫ਼ੇ ਤੇ ਮੂਰਤੀਆਂ', en: 'Gift Showpieces & Figurines', ja: '置物・フィギュア' },
  'घड़ियां व वॉल क्लॉक': { hi: 'घड़ियां व वॉल क्लॉक', pa: 'ਘੜੀਆਂ ਤੇ ਕੰਧ ਘੜੀਆਂ', en: 'Clocks & Wall Clocks', ja: '時計・掛け時計' },
  'फोटो फ्रेम व एल्बम': { hi: 'फोटो फ्रेम व एल्बम', pa: 'ਫੋਟੋ ਫਰੇਮ ਤੇ ਐਲਬਮ', en: 'Photo Frames & Albums', ja: 'フォトフレーム・アルバム' },
  'ग्रीटिंग कार्ड व रैपिंग': { hi: 'ग्रीटिंग कार्ड व रैपिंग', pa: 'ਗ੍ਰੀਟਿੰਗ ਕਾਰਡ ਤੇ ਰੈਪਿੰਗ', en: 'Greeting Cards & Wrapping', ja: 'カード・ラッピング' },
  'इलेक्ट्रॉनिक गैजेट्स व लाइट्स': { hi: 'इलेक्ट्रॉनिक गैजेट्स व लाइट्स', pa: 'ਇਲੈਕਟ੍ਰਾਨਿਕ ਗੈਜੇਟਸ ਤੇ ਲਾਈਟਾਂ', en: 'Electronic Gadgets & LED', ja: '小型家電・LEDライト' },
  'परफ्यूम व डिओड्रेंट': { hi: 'परफ्यूम व डिओड्रेंट', pa: 'ਅਤਰ ਤੇ ਡੀਓਡੋਰੈਂਟ', en: 'Perfumes & Deodorants', ja: '香水・コロン' },
  'जनरल गिफ्ट': { hi: 'जनरल गिफ्ट', pa: 'ਜਨਰਲ ਤੋਹਫ਼ੇ', en: 'General Gifts', ja: 'ギフト雑貨全般' },
  'स्कूल बैग व ज्योमेट्री बॉक्स': { hi: 'स्कूल बैग व ज्योमेट्री बॉक्स', pa: 'ਸਕੂਲ ਬੈਗ ਤੇ ਬਾਕਸ', en: 'School Bags & Geometry Boxes', ja: 'ランドセル・文具箱' },
  'फाइल्स व फोल्डर': { hi: 'फाइल्स व फोल्डर', pa: 'ਫਾਈਲਾਂ ਤੇ ਫੋਲਡਰ', en: 'Files & Folders', ja: 'ファイル・フォルダー' },
  'जनरल स्टेशनरी': { hi: 'जनरल स्टेशनरी', pa: 'ਜਨਰਲ ਸਟੇਸ਼ਨਰੀ', en: 'General Stationery', ja: '文房具全般' },
};

export const UNIT_MAP: Record<string, Record<Language, string>> = {
  'पैकेट': { hi: 'पैकेट', pa: 'ਪੈਕੇਟ', en: 'packets', ja: 'パック' },
  'बोरी': { hi: 'बोरी', pa: 'ਬੋਰੀ', en: 'sacks', ja: '袋' },
  'कट्टा': { hi: 'कट्टा', pa: 'ਕੱਟਾ', en: 'bags', ja: 'カッタ袋' },
  'लड़ी': { hi: 'लड़ी', pa: 'ਲੜੀ', en: 'strips', ja: '連' },
  'पेटी': { hi: 'पेटी', pa: 'ਪੇਟੀ', en: 'cartons', ja: '箱' },
  'दर्जन': { hi: 'दर्जन', pa: 'ਦਰਜਨ', en: 'dozens', ja: 'ダース' },
  'किलो': { hi: 'किलो', pa: 'ਕਿਲੋ', en: 'kg', ja: 'kg' },
  'लीटर': { hi: 'लीटर', pa: 'ਲੀਟਰ', en: 'liters', ja: 'L' },
  'पीस': { hi: 'पीस', pa: 'ਪੀਸ', en: 'pcs', ja: '個' },
  'जोड़ी': { hi: 'जोड़ी', pa: 'ਜੋੜੀ', en: 'pairs', ja: '組' },
  'सेट': { hi: 'सेट', pa: 'ਸੈੱਟ', en: 'sets', ja: 'セット' },
  'थैले': { hi: 'थैले', pa: 'ਥੈਲੇ', en: 'bags', ja: '袋' },
  'पाउच': { hi: 'पाउच', pa: 'ਪਾਊਚ', en: 'pouches', ja: 'パウチ' },
  'बोरी (50 kg)': { hi: 'बोरी (50 kg)', pa: 'ਬੋਰੀ (50 ਕਿਲੋ)', en: 'sack (50 kg)', ja: '50kg袋' },
  'बोतल': { hi: 'बोतल', pa: 'ਬੋਤਲ', en: 'bottles', ja: '本' },
};

export const ITEM_NAME_MAP: Record<string, Record<Language, string>> = {
  'अमूल ताजा दूध 500ml': { hi: 'अमूल ताजा दूध 500ml', pa: 'ਅਮੂਲ ਤਾਜ਼ਾ ਦੁੱਧ 500ml', en: 'Amul Taaza Milk 500ml', ja: 'アムール・ターザー牛乳 500ml' },
  'ब्रिटानिया ब्रेड': { hi: 'ब्रिटानिया ब्रेड', pa: 'ਬ੍ਰਿਟਾਨੀਆ ਬ੍ਰੈੱਡ', en: 'Britannia Bread', ja: 'ブリタニア食パン' },
  'टाटा नमक 1kg पैकेट': { hi: 'टाटा नमक 1kg पैकेट', pa: 'ਟਾਟਾ ਲੂਣ 1kg ਪੈਕੇਟ', en: 'Tata Salt 1kg Pack', ja: 'タタ食塩 1kgパック' },
  'राजधानी आटा 10 किलो थैला': { hi: 'राजधानी आटा 10 किलो थैला', pa: 'ਰਾਜਧਾਨੀ ਆਟਾ 10 ਕਿਲੋ ਥੈਲਾ', en: 'Rajdhani Atta 10kg Bag', ja: 'ラージダーニー 小麦粉 10kg袋' },
  'फॉर्च्यून रिफाइंड 1 लीटर पाउच': { hi: 'फॉर्च्यून रिफाइंड 1 लीटर पाउच', pa: 'ਫਾਰਚੂਨ ਰਿਫਾਇੰਡ 1 ਲੀਟਰ ਪਾਊਚ', en: 'Fortune Refined 1L Pouch', ja: 'フォーチュン 精製油 1Lパウチ' },
  'मैगी 70g नूडल्स': { hi: 'मैगी 70g नूडल्स', pa: 'ਮੈਗੀ 70g ਨੂਡਲਜ਼', en: 'Maggi 70g Noodles', ja: 'マギー 70g ヌードル' },
  'राजधानी चना दाल': { hi: 'राजधानी चना दाल', pa: 'ਰਾਜਧਾਨੀ ਚਨਾ ਦਾਲ', en: 'Rajdhani Chana Dal', ja: 'ラージダーニー ひよこ豆' },
  'पारले-जी 5 रुपये पैकेट': { hi: 'पारले-जी 5 रुपये पैकेट', pa: 'ਪਾਰਲੇ-ਜੀ 5 ਰੁਪਏ ਪੈਕੇਟ', en: 'Parle-G Rs 5 Pack', ja: 'パルレ・G ビスケット' },
  'राजधानी चना दाल 1kg': { hi: 'राजधानी चना दाल 1kg', pa: 'ਰਾਜਧਾਨੀ ਚਨਾ ਦਾਲ 1kg', en: 'Rajdhani Chana Dal 1kg', ja: 'ラージダーニー ひよこ豆 1kg' },
  'फॉर्च्यून सरसों तेल 1L': { hi: 'फॉर्च्यून सरसों तेल 1L', pa: 'ਫਾਰਚੂਨ ਸਰ੍ਹੋਂ ਤੇਲ 1L', en: 'Fortune Mustard Oil 1L', ja: 'フォーチュン マスタードオイル 1L' },
};

export const CUSTOMER_NAME_MAP: Record<string, Record<Language, string>> = {
  'रमेश वर्मा (वर्मा मिष्ठान)': { hi: 'रमेश वर्मा (वर्मा मिष्ठान)', pa: 'ਰਮੇਸ਼ ਵਰਮਾ (ਵਰਮਾ ਮਿਠਾਈ)', en: 'Ramesh Verma (Verma Sweets)', ja: 'ラメシュ・ヴェルマ (菓子店)' },
  'सुनील कुमार (टेलर)': { hi: 'सुनील कुमार (टेलर)', pa: 'ਸੁਨੀਲ ਕੁਮਾਰ (ਦਰਜ਼ੀ)', en: 'Sunil Kumar (Tailor)', ja: 'スニール・クマール (仕立屋)' },
  'अनिता दीदी (गली 3)': { hi: 'अनिता दीदी (गली 3)', pa: 'ਅਨੀਤਾ ਦੀਦੀ (ਗਲੀ 3)', en: 'Anita Didi (Street 3)', ja: 'アニタさん (3番街)' },
  'दीपक शर्मा (प्लंबर)': { hi: 'दीपक शर्मा (प्लंबर)', pa: 'ਦੀਪਕ ਸ਼ਰਮਾ (ਪਲੰਬਰ)', en: 'Deepak Sharma (Plumber)', ja: 'ディーパク・シャルマ (配管工)' },
  'महेश भाई (ऑटो वाले)': { hi: 'महेश भाई (ऑटो वाले)', pa: 'ਮਹੇਸ਼ ਭਾਈ (ਆਟੋ ਵਾਲੇ)', en: 'Mahesh Bhai (Auto Driver)', ja: 'マヘシュさん (オート)' },
};

export const SUPPLIER_MAP: Record<string, Record<Language, string>> = {
  'राधा डेयरी सप्लायर': { hi: 'राधा डेयरी सप्लायर', pa: 'ਰਾਧਾ ਡੇਅਰੀ ਸਪਲਾਇਰ', en: 'Radha Dairy Supplier', ja: 'ラーダー酪農卸売' },
  'गुप्ता होलसेल एजेंसी': { hi: 'गुप्ता होलसेल एजेंसी', pa: 'ਗੁਪਤਾ ਹੋਲਸੇਲ ਏਜੰਸੀ', en: 'Gupta Wholesale Agency', ja: 'グプタ総合卸売' },
  'श्री गणेश ट्रेडर्स (होलसेल)': { hi: 'श्री गणेश ट्रेडर्स (होलसेल)', pa: 'ਸ਼੍ਰੀ ਗਣੇਸ਼ ਟਰੇਡਰਜ਼ (ਥੋਕ)', en: 'Shree Ganesh Traders (Wholesale)', ja: 'ガネーシャ卸売商社' },
};

export const NOTE_MAP: Record<string, Record<Language, string>> = {
  'महीने का राशन (आटा, तेल, दाल)': { hi: 'महीने का राशन (आटा, तेल, दाल)', pa: 'ਮਹੀਨੇ ਦਾ ਰਾਸ਼ਨ (ਆਟਾ, ਤੇਲ, ਦਾਲ)', en: 'Monthly ration (Atta, Oil, Dal)', ja: '月間食料品 (粉、油、豆)' },
  'Google Pay से जमा': { hi: 'Google Pay से जमा', pa: 'Google Pay ਰਾਹੀਂ ਜਮ੍ਹਾਂ', en: 'Paid via Google Pay', ja: 'Google Pay入金' },
  'सब्जी मसाला व मैगी': { hi: 'सब्जी मसाला व मैगी', pa: 'ਸਬਜ਼ੀ ਮਸਾਲਾ ਤੇ ਮੈਗੀ', en: 'Sabzi Masala & Maggi', ja: 'スパイス＆マギー' },
  'नकद जमा': { hi: 'नकद जमा', pa: 'ਨਕਦ ਜਮ੍ਹਾਂ', en: 'Cash payment', ja: '現金受取' },
  '2 पैकेट दूध व ब्रेड': { hi: '2 पैकेट दूध व ब्रेड', pa: '2 ਪੈਕੇਟ ਦੁੱਧ ਤੇ ਬ੍ਰੈੱਡ', en: '2 packets milk & bread', ja: '牛乳2パック＆パン' },
  'दूध का पैकेट': { hi: 'दूध का पैकेट', pa: 'ਦੁੱਧ ਦਾ ਪੈਕੇਟ', en: 'Milk packet', ja: '牛乳パック' },
  'तेल व रिफाइंड': { hi: 'तेल व रिफाइंड', pa: 'ਤੇਲ ਤੇ ਰਿਫਾਇੰਡ', en: 'Oil & Refined', ja: '食用油＆精製油' },
  'राशन का सामान': { hi: 'राशन का सामान', pa: 'ਰਾਸ਼ਨ ਦਾ ਸਮਾਨ', en: 'Grocery items', ja: '食料品一式' },
  'दुकान से उधार': { hi: 'दुकान से उधार', pa: 'ਦੁਕਾਨ ਤੋਂ ਉਧਾਰ', en: 'Store credit', ja: '売掛購入 (ツケ)' },
};

export function localizeCategory(cat: string, lang: Language): string {
  if (CATEGORY_MAP[cat] && CATEGORY_MAP[cat][lang]) {
    return CATEGORY_MAP[cat][lang];
  }
  return cat;
}

export function localizeUnit(unit: string, lang: Language): string {
  if (UNIT_MAP[unit] && UNIT_MAP[unit][lang]) {
    return UNIT_MAP[unit][lang];
  }
  return unit;
}

export function localizeItemName(name: string, lang: Language): string {
  if (ITEM_NAME_MAP[name] && ITEM_NAME_MAP[name][lang]) {
    return ITEM_NAME_MAP[name][lang];
  }
  return name;
}

export function localizeCustomerName(name: string, lang: Language): string {
  if (CUSTOMER_NAME_MAP[name] && CUSTOMER_NAME_MAP[name][lang]) {
    return CUSTOMER_NAME_MAP[name][lang];
  }
  return name;
}

export function localizeSupplier(supplier: string, lang: Language): string {
  if (SUPPLIER_MAP[supplier] && SUPPLIER_MAP[supplier][lang]) {
    return SUPPLIER_MAP[supplier][lang];
  }
  return supplier;
}

export function localizeNote(note: string, lang: Language): string {
  if (NOTE_MAP[note] && NOTE_MAP[note][lang]) {
    return NOTE_MAP[note][lang];
  }
  return note;
}

export function getLocalizedCategories(storeType: StoreType, lang: Language): { raw: string; label: string }[] {
  const kiranaRaw = [
    'दूध व डेयरी',
    'ब्रेड व बेकरी',
    'दाल व अनाज',
    'खाद्य तेल व घी',
    'मसाले',
    'बिस्कुट व नमकीन',
    'चिप्स व कोल्ड ड्रिंक्स',
    'तंबाकू व बीड़ी',
    'सफाई का सामान',
    'साबुन व डिटर्जेंट',
    'जनरल सामान',
  ];
  const stationeryRaw = [
    'पेन, पेंसिल व सुधार सामग्री',
    'कॉपियाँ, रजिस्टर व पेपर',
    'ज्योमेट्री बॉक्स व स्केल',
    'रंग, पेंट व आर्ट क्राफ्ट',
    'गोंद, टेप व कैंची',
    'फाइल, फोल्डर व ऑफिस सामान',
  ];
  const uniformRaw = [
    'स्कूल यूनिफॉर्म (शर्ट/पैंट)',
    'स्कर्ट व ट्यूनिक',
    'टाई व बेल्ट',
    'स्कूल जूते व मोज़े',
    'स्वेटर व ब्लेज़र',
    'हाउस टी-शर्ट व ट्रैकसूट',
    'बैज व आईडी कार्ड',
    'जनरल कपड़े',
  ];
  const giftShopRaw = [
    'खिलौने व गेम्स',
    'गिफ्ट शोपीस व मूर्तियाँ',
    'घड़ियां व वॉल क्लॉक',
    'फोटो फ्रेम व एल्बम',
    'ग्रीटिंग कार्ड व रैपिंग',
    'इलेक्ट्रॉनिक गैजेट्स व लाइट्स',
    'परफ्यूम व डिओड्रेंट',
    'जनरल गिफ्ट',
  ];

  let rawList = kiranaRaw;
  if (storeType === 'stationery') {
    rawList = stationeryRaw;
  } else if (storeType === 'uniform') {
    rawList = uniformRaw;
  } else if (storeType === 'gift_shop') {
    rawList = giftShopRaw;
  }

  return rawList.map((r) => ({
    raw: r,
    label: localizeCategory(r, lang),
  }));
}

export function getQuickUnitTags(lang: Language): string[] {
  if (lang === 'en') {
    return ['packet', 'bag (katta)', 'strip (laddi)', 'carton (peti)', 'kg', 'liter', 'dozen', 'piece'];
  }
  if (lang === 'pa') {
    return ['ਪੈਕੇਟ', 'ਕੱਟਾ', 'ਲੜੀ', 'ਬੋਰੀ', 'ਪੇਟੀ', 'ਦਰਜਨ', 'ਕਿਲੋ', 'ਲੀਟਰ'];
  }
  if (lang === 'ja') {
    return ['パック', '大袋', '連', '箱', 'kg', 'リットル', 'ダース', '個'];
  }
  return ['पैकेट', 'कट्टा', 'लड़ी', 'बोरी', 'पेटी', 'दर्जन', 'किलो', 'लीटर'];
}

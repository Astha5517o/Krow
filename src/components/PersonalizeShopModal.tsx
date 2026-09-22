import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Language, StoreType } from '../types';
import { STORE_TYPE_CONFIGS, getStoreConfig } from '../data/storeTypes';

interface PersonalizeShopModalProps {
  isOpen: boolean;
  profile: UserProfile;
  currentUser: User | null;
  language: Language;
  onSave: (updated: Partial<UserProfile>) => Promise<void> | void;
  onClose: () => void;
}

// Preset store emblems if shopkeeper does not have an image logo ready
const PRESET_EMBLEMS = [
  { id: 'kirana_emblem', emoji: '🏪', label: 'किराना', bg: '#2F6B4F' },
  { id: 'medical_emblem', emoji: '💊', label: 'मेडिकल', bg: '#0284C7' },
  { id: 'garment_emblem', emoji: '👕', label: 'कपड़ा', bg: '#D97706' },
  { id: 'stationery_emblem', emoji: '✏️', label: 'स्टेशनरी', bg: '#7C3AED' },
  { id: 'hardware_emblem', emoji: '🔧', label: 'हार्डवेयर', bg: '#475569' },
  { id: 'dairy_emblem', emoji: '🥛', label: 'डेयरी', bg: '#059669' },
];

export const PersonalizeShopModal: React.FC<PersonalizeShopModalProps> = ({
  isOpen,
  profile,
  currentUser,
  language,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const [shopName, setShopName] = useState(profile.shopName || (currentUser?.displayName ? `${currentUser.displayName} की दुकान` : 'मेरी दुकान'));
  const [ownerName, setOwnerName] = useState(profile.ownerName || currentUser?.displayName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [storeType, setStoreType] = useState<StoreType>(profile.storeType || 'kirana');
  const [logoUrl, setLogoUrl] = useState<string>(profile.logoUrl || currentUser?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload & Compression to high quality Data URL
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 5MB raw
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(
        language === 'en'
          ? 'Image file too large. Please select an image under 5MB.'
          : 'फोटो का साइज 5MB से कम होना चाहिए।'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to downscale to 400x400 for snappy cloud sync & storage
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setLogoUrl(compressedDataUrl);
        } else {
          setLogoUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        shopName: shopName.trim() || 'मेरी दुकान',
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        storeType,
        logoUrl: logoUrl.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error saving shop personalization:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStoreConfig = getStoreConfig(storeType);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#262421]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#E4DFD2] animate-scale-up relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          id="close-personalize-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center text-sm font-bold transition-all cursor-pointer z-10"
          type="button"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F0EA] text-[#1E4632] text-[11px] font-bold mb-2">
            <span className="material-symbols-outlined text-sm">storefront</span>
            <span>
              {language === 'en' ? 'Shop Personalization' : 'दुकान की सजावट व ब्रांडिंग'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#262421] font-display">
            {language === 'en' ? 'Personalize Your Shop' : 'अपनी दुकान को पर्सनलाइज़ करें'}
          </h2>
          <p className="text-xs text-[#726C60] mt-0.5 leading-relaxed">
            {language === 'en'
              ? 'Upload your store logo, customize your shop title and select your store category.'
              : 'अपनी दुकान का लोगो अपलोड करें, नाम और श्रेणी चुनें ताकि ग्राहकों को आपकी दुकान की पहचान मिले।'}
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* 1. LOGO UPLOAD SECTION */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4DFD2]">
            <label className="block text-xs font-bold text-[#262421] mb-2 flex items-center justify-between">
              <span>{language === 'en' ? '1. Shop Logo / Brand Photo' : '1. दुकान का लोगो / फ़ोटो अपलोड करें'}</span>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[10px] text-[#C1443B] font-bold hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Remove Logo' : 'लोगो हटाएं'}
                </button>
              )}
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview Container */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-[#2F6B4F]/40 flex items-center justify-center overflow-hidden shadow-xs relative">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Shop Logo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 text-[#726C60]">
                      <span className="material-symbols-outlined text-2xl text-[#2F6B4F]">add_photo_alternate</span>
                      <span className="text-[9px] font-bold mt-0.5">लोगो नहीं है</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-[11px] text-[#2F6B4F] font-bold block sm:hidden text-center hover:underline"
                >
                  {logoUrl ? 'फ़ोटो बदलें' : 'फ़ोटो चुनें'}
                </button>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 flex flex-col gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-3.5 bg-white border border-[#2F6B4F] text-[#2F6B4F] hover:bg-[#E7F0EA] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer flex-1 sm:flex-initial"
                  >
                    <span className="material-symbols-outlined text-base">upload</span>
                    <span>{language === 'en' ? 'Upload Image / Logo' : 'गैलरी से लोगो अपलोड करें'}</span>
                  </button>
                </div>

                {uploadError && (
                  <div className="text-[11px] text-[#C1443B] font-medium">{uploadError}</div>
                )}

                {/* Quick Presets */}
                <div className="text-[10px] text-[#726C60]">
                  <span>{language === 'en' ? 'Or choose a ready emblem:' : 'या बना-बनाया चिह्न चुनें:'}</span>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {PRESET_EMBLEMS.map((emblem) => (
                      <button
                        key={emblem.id}
                        type="button"
                        onClick={() => {
                          // Create an SVG avatar with the chosen emoji as data URL
                          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="30" fill="${emblem.bg}"/><text x="50%" y="54%" font-size="52" text-anchor="middle" dominant-baseline="middle">${emblem.emoji}</text></svg>`;
                          const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                          setLogoUrl(url);
                        }}
                        className="h-7 px-2 bg-white hover:bg-[#E7F0EA] border border-[#E4DFD2] rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all"
                        title={emblem.label}
                      >
                        <span>{emblem.emoji}</span>
                        <span className="text-[10px] font-semibold text-[#262421]">{emblem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. SHOP TITLE / NAME */}
          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1.5">
              <span>{language === 'en' ? '2. Shop Title / Name' : '2. दुकान का नाम (Shop Title)'}</span>
              <span className="text-[#C1443B] ml-1">*</span>
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Sharma Kirana & General Store' : 'उदा. शर्मा किराना एवं जनरल स्टोर'}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E4DFD2] bg-white text-sm font-bold text-[#262421] focus:outline-hidden focus:border-[#2F6B4F] focus:ring-2 focus:ring-[#2F6B4F]/20 shadow-xs"
            />
            {/* Live Header Preview Pill */}
            <div className="mt-2 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#726C60]">
                {language === 'en' ? 'Top bar preview:' : 'दुकान बोर्ड कैसा दिखेगा:'}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E4DFD2] shadow-2xs">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[15px] text-[#2F6B4F]">
                    {selectedStoreConfig.icon}
                  </span>
                )}
                <span className="font-extrabold text-xs text-[#262421] truncate max-w-[150px]">
                  {shopName.trim() || 'मेरी दुकान'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. TYPE OF SHOP (STORE CATEGORY) */}
          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1.5">
              <span>{language === 'en' ? '3. Select Shop Category' : '3. दुकान का प्रकार चुनें'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {STORE_TYPE_CONFIGS.map((cfg) => {
                const isSelected = storeType === cfg.id || (storeType === 'general_store' && cfg.id === 'kirana');
                const titleLabel =
                  cfg.id === 'kirana'
                    ? language === 'en'
                      ? 'Kirana & Grocery'
                      : 'किराना व ग्रॉसरी'
                    : cfg.id === 'stationery'
                    ? language === 'en'
                      ? 'Stationery & Books'
                      : 'स्टेशनरी व पुस्तकें'
                    : cfg.id === 'uniform'
                    ? language === 'en'
                      ? 'Clothing & Garments'
                      : 'कपड़ा व गारमेंट्स'
                    : language === 'en'
                    ? 'Gifts & Toys'
                    : 'गिफ्ट व खिलौने';

                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => setStoreType(cfg.id)}
                    className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#2F6B4F] bg-[#E7F0EA]/80 shadow-xs'
                        : 'border-[#E4DFD2] bg-white hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] ${
                          isSelected ? 'border-[#2F6B4F] bg-[#2F6B4F] text-white' : 'border-[#D9D4C7]'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs text-[#262421]">{titleLabel}</div>
                    <div className="text-[10px] text-[#726C60] line-clamp-1 mt-0.5">
                      {cfg.sampleTags[language]?.[0] || 'दुकान सामान'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. OWNER NAME & WHATSAPP PHONE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {language === 'en' ? 'Owner Name' : 'दुकानदार / मालिक का नाम'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="उदा. राजेश शर्मा"
                className="w-full h-10 px-3 rounded-xl border border-[#E4DFD2] bg-white text-xs font-medium text-[#262421] focus:outline-hidden focus:border-[#2F6B4F]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {language === 'en' ? 'WhatsApp / Phone Number' : 'व्हाट्सएप / मोबाइल नंबर'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="उदा. 9876543210"
                className="w-full h-10 px-3 rounded-xl border border-[#E4DFD2] bg-white text-xs font-medium text-[#262421] focus:outline-hidden focus:border-[#2F6B4F]"
              />
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-3 border-t border-[#E4DFD2] flex flex-col sm:flex-row items-center gap-2">
            <button
              id="save-personalize-shop-btn"
              type="submit"
              disabled={isSaving}
              className="w-full sm:flex-1 h-12 bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>
                {isSaving
                  ? language === 'en'
                    ? 'Saving Shop...'
                    : 'सहेजा जा रहा है...'
                  : language === 'en'
                  ? 'Save & Launch Shop'
                  : 'दुकान सेटअप पूरा करें'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-11 px-4 text-[#726C60] hover:text-[#262421] hover:bg-[#FAF7F0] font-bold rounded-2xl text-xs cursor-pointer transition-colors"
            >
              {language === 'en' ? 'Skip for now' : 'बाद में बदलें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

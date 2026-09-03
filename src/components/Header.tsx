import React, { useState } from 'react';
import { Mic, Globe, Download, Sparkles, Check, ChevronDown, Store, Trash2, Edit3, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';
import { Language, ShopType } from '../types';
import { useBackHandler } from '../hooks/useBackHandler';

interface HeaderProps {
  onOpenVoice: () => void;
  onOpenInstallGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVoice, onOpenInstallGuide }) => {
  const { profile, updateLanguage, setActiveScreen, updateShopProfile, clearAllData } = useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditShopModal, setShowEditShopModal] = useState(false);

  // Close edit shop modal on back button press
  useBackHandler(showEditShopModal, () => setShowEditShopModal(false), 'editShopModal');
  useBackHandler(showProfileMenu, () => setShowProfileMenu(false), 'profileMenu');
  useBackHandler(showLangMenu, () => setShowLangMenu(false), 'langMenu');

  // Shop details form state
  const [editName, setEditName] = useState(profile?.shopName || '');
  const [editType, setEditType] = useState<ShopType>(profile?.shopType || 'general_store');
  const [editPhone, setEditPhone] = useState(profile?.identifier || '');

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'en', label: 'English', native: 'English' },
  ];

  const handleOpenEdit = () => {
    setEditName(profile?.shopName || '');
    setEditType(profile?.shopType || 'general_store');
    setEditPhone(profile?.identifier || '');
    setShowProfileMenu(false);
    setShowEditShopModal(true);
  };

  const handleSaveShopDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile({
      shopName: editName.trim() || (lang === 'hi' ? 'मेरी दुकान' : 'My Shop'),
      shopType: editType,
      identifier: editPhone.trim(),
    });
    setShowEditShopModal(false);
  };

  const handleClearDataConfirm = () => {
    setShowProfileMenu(false);
    if (window.confirm(lang === 'hi' ? 'क्या आप वाकई सारा सामान, ग्राहक और बिक्री रिकॉर्ड साफ़ करना चाहते हैं?' : 'Are you sure you want to clear all items, customers, and sales records?')) {
      clearAllData();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF7F0] border-b border-[#E4DFD2] px-3.5 py-2.5 sm:px-6 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name (Tapping returns to home dashboard) */}
        <button
          onClick={() => setActiveScreen('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
          title="Return to Home Dashboard"
          aria-label="Krow Home Dashboard"
        >
          {/* Logo: cream-colored shopping basket (trapezoid body with curved handle) with small two-leaf sprout on rounded-square dark green background */}
          <div className="w-10 h-10 rounded-xl bg-[#1E4632] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              {/* Curved basket handle */}
              <path
                d="M 32 46 C 32 26, 68 26, 68 46"
                fill="none"
                stroke="#FAF7F0"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Sprout stem */}
              <path d="M 50 31 Q 50 20 50 17" fill="none" stroke="#FAF7F0" strokeWidth="3" strokeLinecap="round" />
              {/* Left sprout leaf */}
              <path d="M 50 24 C 43 23, 39 17, 43 13 C 48 13, 50 21, 50 24 Z" fill="#FAF7F0" />
              {/* Right sprout leaf (accent gold) */}
              <path d="M 50 21 C 56 19, 62 14, 59 10 C 53 10, 50 18, 50 21 Z" fill="#D9A62E" />
              {/* Cream trapezoid basket body */}
              <polygon points="24,45 76,45 69,77 31,77" fill="#FAF7F0" />
              {/* Subtle basket weave */}
              <line x1="31" y1="55" x2="69" y2="55" stroke="#1E4632" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
              <line x1="34" y1="66" x2="66" y2="66" stroke="#1E4632" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl sm:text-2xl text-[#1E4632] tracking-tight">Krow</span>
              <span className="text-[10px] font-semibold bg-[#E7F0EA] text-[#1E4632] px-1.5 py-0.5 rounded-sm">
                {profile?.shopType === 'stationery'
                  ? (lang === 'hi' ? 'स्टेशनरी' : lang === 'pa' ? 'ਸਟੇਸ਼ਨਰੀ' : 'Stationery')
                  : (lang === 'hi' ? 'किराना' : lang === 'pa' ? 'ਕਿਰਿਆਨਾ' : 'Kirana')}
              </span>
            </div>
            <span className="text-[11px] text-[#726C60] font-normal hidden sm:inline-block">
              {t.tagline}
            </span>
          </div>
        </button>

        {/* Right header controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Voice Search Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E7F0EA] text-[#1E4632] hover:bg-[#2F6B4F] hover:text-white transition-colors cursor-pointer relative shadow-xs"
            title={t.voiceSearchTitle}
            aria-label={t.voiceSearchTitle}
          >
            <Mic className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#D9A62E] rounded-full ring-2 ring-[#FAF7F0]" />
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4DFD2] bg-white text-[#262421] text-xs font-semibold hover:border-[#1E4632] transition cursor-pointer shadow-2xs"
              aria-expanded={showLangMenu}
            >
              <Globe className="w-3.5 h-3.5 text-[#2F6B4F]" />
              <span className="font-medium text-xs">
                {lang === 'hi' ? 'हिं' : lang === 'pa' ? 'ਪੰ' : 'EN'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#726C60]" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#E4DFD2] rounded-xl shadow-lg py-1 z-40">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      updateLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#E7F0EA] transition cursor-pointer ${
                      lang === l.code ? 'font-bold text-[#1E4632] bg-[#E7F0EA]/50' : 'text-[#262421]'
                    }`}
                  >
                    <span>{l.native}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-[#2F6B4F]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile & Shop Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-[#1E4632] text-[#FAF7F0] font-bold text-xs flex items-center justify-center hover:opacity-90 transition cursor-pointer shadow-xs"
              title={profile?.shopName || (lang === 'hi' ? 'दुकान' : 'Shop')}
            >
              {profile?.shopName ? profile.shopName.charAt(0).toUpperCase() : 'K'}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#E4DFD2] rounded-2xl shadow-xl p-3 z-40">
                <div className="px-2 py-2 bg-[#FAF7F0] rounded-xl border border-[#E4DFD2]/60 mb-2.5">
                  <p className="text-xs font-bold text-[#1E4632] truncate">
                    {profile?.shopName || (lang === 'hi' ? 'मेरी दुकान' : 'My Shop')}
                  </p>
                  <p className="text-[11px] text-[#726C60] truncate mt-0.5">
                    {profile?.shopType === 'stationery'
                      ? (lang === 'hi' ? 'स्टेशनरी एवं यूनिफॉर्म' : 'Stationery & Uniforms')
                      : (lang === 'hi' ? 'किराना एवं जनरल स्टोर' : 'Kirana & General Store')}
                  </p>
                  {profile?.identifier && (
                    <p className="text-[10px] text-[#A29C8E] mt-0.5">{profile.identifier}</p>
                  )}
                </div>

                {/* Edit Shop Details Action */}
                <button
                  onClick={handleOpenEdit}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#1E4632] bg-white hover:bg-[#E7F0EA] font-semibold transition cursor-pointer border border-[#E4DFD2] mb-1.5"
                >
                  <span className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-[#2F6B4F]" />
                    {lang === 'hi' ? 'दुकान की जानकारी बदलें' : 'Edit Shop Details'}
                  </span>
                </button>

                {/* Clear all data */}
                <button
                  onClick={handleClearDataConfirm}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#C1443B] hover:bg-[#F8E6E4] font-medium transition cursor-pointer border border-dashed border-[#C1443B]/30"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#C1443B]" />
                  <span>{lang === 'hi' ? 'स्टोरेज पूरी तरह साफ़ करें' : 'Clear All Data'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Shop Details Modal */}
      {showEditShopModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#E4DFD2] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4DFD2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E7F0EA] text-[#1E4632] flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E4632]">
                    {lang === 'hi' ? 'दुकान की जानकारी' : 'Shop Information'}
                  </h3>
                  <p className="text-xs text-[#726C60]">
                    {lang === 'hi' ? 'अपनी दुकान का नाम और प्रकार दर्ज करें' : 'Enter your shop name & type'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditShopModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#726C60] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShopDetails} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {lang === 'hi' ? 'दुकान का नाम (Shop Name)' : 'Shop Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. शर्मा किराना स्टोर' : 'e.g. Sharma General Store'}
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {lang === 'hi' ? 'दुकान का प्रकार (Store Type)' : 'Store Category'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('general_store')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center gap-2 ${
                      editType === 'general_store'
                        ? 'border-[#1E4632] bg-[#E7F0EA] text-[#1E4632]'
                        : 'border-[#E4DFD2] bg-white text-[#726C60]'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <span>{lang === 'hi' ? 'किराना व जनरल' : 'Kirana Store'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('stationery')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center gap-2 ${
                      editType === 'stationery'
                        ? 'border-[#1E4632] bg-[#E7F0EA] text-[#1E4632]'
                        : 'border-[#E4DFD2] bg-white text-[#726C60]'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <span>{lang === 'hi' ? 'स्टेशनरी व यूनिफॉर्म' : 'Stationery'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर (वैकल्पिक)' : 'Mobile Number (Optional)'}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditShopModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#726C60] hover:bg-[#FAF7F0] cursor-pointer"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] cursor-pointer transition shadow-xs"
                >
                  {lang === 'hi' ? 'सहेजें' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

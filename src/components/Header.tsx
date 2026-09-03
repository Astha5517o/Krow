import React, { useState } from 'react';
import { Mic, Globe, LogOut, Download, Sparkles, Check, ChevronDown } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';
import { Language } from '../types';

interface HeaderProps {
  onOpenVoice: () => void;
  onOpenInstallGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVoice, onOpenInstallGuide }) => {
  const { profile, logout, updateLanguage, setActiveScreen } = useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'en', label: 'English', native: 'English' },
  ];

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
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#E4DFD2] rounded-xl shadow-lg p-2 z-40">
                <div className="px-2 py-1.5 border-b border-[#E4DFD2] mb-1">
                  <p className="text-xs font-bold text-[#1E4632] truncate">
                    {profile?.shopName || (lang === 'hi' ? 'मेरी दुकान' : lang === 'pa' ? 'ਮੇਰੀ ਦੁਕਾਨ' : 'My Shop')}
                  </p>
                  <p className="text-[11px] text-[#726C60] truncate">{profile?.identifier}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[#C1443B] hover:bg-[#F8E6E4] font-medium transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logoutBtn}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

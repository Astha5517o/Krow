import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { AppLogo } from './AppLogo';
import { getStoreConfig } from '../data/storeTypes';

interface HeaderProps {
  profile: UserProfile;
  onLanguageChange: (lang: Language) => void;
  onOpenProfile: () => void;
  onOpenStoreSelect: () => void;
  onOpenShareStock?: () => void;
  onOpenWelcome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onLanguageChange,
  onOpenProfile,
  onOpenStoreSelect,
  onOpenShareStock,
  onOpenWelcome,
}) => {
  const t = translations[profile.language];
  const [showLangMenu, setShowLangMenu] = useState(false);
  const storeConfig = getStoreConfig(profile.storeType);

  const langNames: Record<Language, string> = {
    hi: 'हिन्दी',
    pa: 'ਪੰਜਾਬੀ',
    en: 'English',
    ja: '日本語',
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E4DFD2] shadow-xs">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
        {/* Logo & Store Name */}
        <div className="flex items-center gap-2 min-w-0">
          <AppLogo
            size="sm"
            showText={true}
            subtitle={profile.language === 'hi' ? 'सरल साधन • व्यापार' : profile.language === 'pa' ? 'ਸਧਾਰਨ ਸਾਧਨ • ਵਪਾਰ' : 'Simple tools'}
            onClick={onOpenWelcome}
          />

          <button
            onClick={onOpenStoreSelect}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#E4DFD2] hover:bg-[#E7F0EA] transition-colors min-w-0"
            type="button"
            title={t[storeConfig.titleKey]}
          >
            <span className="text-xs flex-shrink-0">{storeConfig.emoji}</span>
            <span className="font-bold text-xs sm:text-sm text-[#262421] truncate max-w-[90px] sm:max-w-[120px]">
              {profile.shopName || t[storeConfig.titleKey]}
            </span>
            <span className="material-symbols-outlined text-[#726C60] text-[16px]">
              expand_more
            </span>
          </button>
        </div>

        {/* Language Pill & Profile Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="h-9 px-3 rounded-full bg-[#FFFFFF] border border-[#E4DFD2] flex items-center gap-1 text-xs font-bold text-[#2F6B4F] shadow-2xs hover:bg-[#E7F0EA] transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">translate</span>
              <span>{langNames[profile.language]}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-[#E4DFD2] py-1 z-50">
                {(['hi', 'pa', 'en', 'ja'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange(lang);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between ${
                      profile.language === lang
                        ? 'bg-[#E7F0EA] text-[#2F6B4F] font-bold'
                        : 'text-[#262421] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <span>{langNames[lang]}</span>
                    {profile.language === lang && (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onOpenShareStock && (
            <button
              onClick={onOpenShareStock}
              className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E4DFD2] text-[#7a5900] hover:bg-[#E7F0EA] flex items-center justify-center shadow-2xs active:scale-95 transition-transform"
              title={profile.language === 'en' ? 'Customer Live Catalog & QR' : 'ग्राहक लाइव स्टॉक व QR'}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            </button>
          )}

          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-[#1E4632] text-[#FAF7F0] flex items-center justify-center shadow-xs active:scale-95 transition-transform"
            aria-label={t.profileTitle}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};

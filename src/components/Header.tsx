import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { AppLogo } from './AppLogo';
import { getStoreConfig } from '../data/storeTypes';

interface HeaderProps {
  profile: UserProfile;
  currentUser?: User | null;
  isSyncing?: boolean;
  onLanguageChange: (lang: Language) => void;
  onOpenProfile: () => void;
  onOpenStoreSelect: () => void;
  onOpenShareStock?: () => void;
  onOpenWelcome?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentUser,
  isSyncing = false,
  onLanguageChange,
  onOpenProfile,
  onOpenStoreSelect,
  onOpenShareStock,
  onOpenWelcome,
  onOpenAuth,
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
            onClick={onOpenWelcome}
          />

          <button
            onClick={onOpenStoreSelect}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E4DFD2] hover:bg-[#E7F0EA] transition-colors min-w-0 shadow-2xs"
            type="button"
            title={t[storeConfig.titleKey]}
          >
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Shop Logo"
                className="w-4 h-4 rounded-full object-cover flex-shrink-0 border border-[#E4DFD2]"
              />
            ) : (
              <span className="material-symbols-outlined text-[15px] text-[#2F6B4F] flex-shrink-0">
                {storeConfig.icon}
              </span>
            )}
            <span className="font-bold text-xs sm:text-sm text-[#262421] truncate max-w-[90px] sm:max-w-[130px]">
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

          {!currentUser && onOpenAuth && (
            <button
              id="header-open-auth-btn"
              onClick={onOpenAuth}
              className="h-9 px-2.5 rounded-full bg-[#E7F0EA] border border-[#2F6B4F]/40 hover:bg-[#d5e7da] text-[#1E4632] flex items-center gap-1 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="डेटाबेस बैकअप व लॉगिन"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px] text-[#2F6B4F]">cloud_sync</span>
              <span className="text-[11px] font-bold">लॉगिन</span>
            </button>
          )}

          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-[#1E4632] text-[#FAF7F0] flex items-center justify-center shadow-xs active:scale-95 transition-transform relative overflow-hidden"
            aria-label={t.profileTitle}
            type="button"
            title={currentUser ? `${currentUser.email || 'Google User'} • क्लाउड डेटाबेस सिंक` : t.profileTitle}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="User"
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="material-symbols-outlined text-[20px]">person</span>
            )}
            {currentUser && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  isSyncing ? 'bg-amber-400 animate-spin' : 'bg-[#2F6B4F]'
                }`}
                title={isSyncing ? 'सिंक हो रहा है...' : 'क्लाउड डेटाबेस सक्रिय'}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Home, Package, BookOpen, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';

export const BottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, profile, reorderSuggestions, totalUdhaarOwed } = useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);

  const attentionCount = reorderSuggestions.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4DFD2] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        {/* Home */}
        <button
          onClick={() => setActiveScreen('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer relative ${
            activeScreen === 'home'
              ? 'text-[#1E4632] font-semibold'
              : 'text-[#726C60] hover:text-[#262421]'
          }`}
          aria-label={t.navHome}
        >
          <Home className={`w-5 h-5 ${activeScreen === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-none">{t.navHome}</span>
          {activeScreen === 'home' && (
            <span className="absolute top-1 w-8 h-1 bg-[#1E4632] rounded-full" />
          )}
        </button>

        {/* Stock */}
        <button
          onClick={() => setActiveScreen('stock')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer relative ${
            activeScreen === 'stock'
              ? 'text-[#1E4632] font-semibold'
              : 'text-[#726C60] hover:text-[#262421]'
          }`}
          aria-label={t.navStock}
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${activeScreen === 'stock' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {attentionCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#C1443B] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight">
                {attentionCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-none">{t.navStock}</span>
          {activeScreen === 'stock' && (
            <span className="absolute top-1 w-8 h-1 bg-[#1E4632] rounded-full" />
          )}
        </button>

        {/* Udhaar */}
        <button
          onClick={() => setActiveScreen('udhaar')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer relative ${
            activeScreen === 'udhaar'
              ? 'text-[#1E4632] font-semibold'
              : 'text-[#726C60] hover:text-[#262421]'
          }`}
          aria-label={t.navUdhaar}
        >
          <div className="relative">
            <BookOpen className={`w-5 h-5 ${activeScreen === 'udhaar' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {totalUdhaarOwed > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-[#D9A62E] rounded-full" />
            )}
          </div>
          <span className="text-[11px] leading-none">{t.navUdhaar}</span>
          {activeScreen === 'udhaar' && (
            <span className="absolute top-1 w-8 h-1 bg-[#1E4632] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';

export type TabType = 'home' | 'stock' | 'udhaar';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, language }) => {
  const t = translations[language];

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: t.navHome, icon: 'storefront' },
    { id: 'stock', label: t.navStock, icon: 'inventory_2' },
    { id: 'udhaar', label: t.navUdhaar, icon: 'menu_book' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#E4DFD2] shadow-[0_-2px_12px_rgba(20,40,30,0.05)] pb-safe">
      <div className="max-w-md mx-auto h-16 px-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex-1 max-w-[120px] h-full flex flex-col items-center justify-center touch-manipulation cursor-pointer select-none active:scale-95 transition-transform"
              type="button"
              aria-label={tab.label}
              aria-selected={isActive}
            >
              {/* Material 3 Active Icon Pill Indicator */}
              <div className="relative flex items-center justify-center w-14 h-8 rounded-full transition-all">
                {isActive && (
                  <motion.div
                    layoutId="m3ActiveNavPill"
                    className="absolute inset-0 bg-[#E4EFE8] rounded-full border border-[#23583C]/20 -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span
                  className={`material-symbols-outlined text-[22px] transition-colors ${
                    isActive ? 'text-[#0A2719] fill' : 'text-[#5C6460]'
                  }`}
                >
                  {tab.icon}
                </span>
              </div>

              {/* Text Label (Strict single-line Android 11sp ratio) */}
              <span
                className={`text-[11px] leading-tight tracking-tight mt-0.5 whitespace-nowrap transition-colors ${
                  isActive ? 'font-bold text-[#0A2719]' : 'font-medium text-[#5C6460]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


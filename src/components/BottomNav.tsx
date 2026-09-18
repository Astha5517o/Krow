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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#E4DFD2] shadow-[0_-4px_20px_rgba(38,36,33,0.06)] pb-safe">
      <div className="max-w-md mx-auto h-16 px-3 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              whileTap={{ scale: 0.92 }}
              className={`relative flex flex-col items-center justify-center min-w-[84px] h-12 px-3 rounded-full transition-colors duration-150 touch-manipulation cursor-pointer ${
                isActive
                  ? 'text-[#1E4632] font-bold'
                  : 'text-[#726C60] hover:text-[#262421]'
              }`}
              type="button"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#E7F0EA] rounded-full border border-[#2F6B4F]/20 shadow-2xs -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span
                className={`material-symbols-outlined text-[23px] transition-transform duration-150 ${
                  isActive ? 'fill scale-105' : 'scale-100'
                }`}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] tracking-tight leading-none mt-0.5">
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};


import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  theme?: 'light' | 'dark';
}

/**
 * Krōw Master Brand Logo
 * Unified, canonical single logo used across the entire application:
 * - Refined forest-green squircle with the iconic two-leaf growth sprout mark
 * - Confident, clean typographic wordmark "Krōw" with macron over the 'o'
 * - Clean tagline "Simple tools. Better business."
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  className = '',
  onClick,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const sizeMap = {
    xs: {
      box: 'w-6 h-6 rounded-lg',
      sproutWidth: 16,
      title: 'text-xs',
      sub: 'text-[8px]',
    },
    sm: {
      box: 'w-8 h-8 rounded-xl',
      sproutWidth: 20,
      title: 'text-sm',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-9 h-9 rounded-xl',
      sproutWidth: 22,
      title: 'text-base',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      sproutWidth: 30,
      title: 'text-xl',
      sub: 'text-xs',
    },
    xl: {
      box: 'w-16 h-16 rounded-2xl',
      sproutWidth: 40,
      title: 'text-2xl',
      sub: 'text-xs',
    },
  };

  const current = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title="Krōw — Simple tools. Better business."
    >
      {/* Canonical Brand Squircle Emblem */}
      <div
        className={`${current.box} relative overflow-hidden bg-[#163A2B] flex items-center justify-center flex-shrink-0 shadow-[0_2px_6px_rgba(22,58,43,0.25)] border border-[#2F6B4F]/40 transition-transform active:scale-95`}
      >
        {/* Subtle top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 pointer-events-none" />

        {/* Master Krōw Sprout Emblem */}
        <svg
          width={current.sproutWidth}
          height={current.sproutWidth}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Central Stem */}
          <path
            d="M16 26V13"
            stroke="#E8F2EC"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Left Leaf (Deep Sprout Green) */}
          <path
            d="M16 18C11.5 18 8 15 8 10.5C12.5 10.5 16 13.5 16 18Z"
            fill="#3FA369"
            stroke="#E8F2EC"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Right Leaf (Fresh Sage Green) */}
          <path
            d="M16 15C16 10.5 19.5 7.5 24 7.5C24 12 20.5 15 16 15Z"
            fill="#6BC58D"
            stroke="#E8F2EC"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Typography: Clean Wordmark with Macron on 'o' */}
      {showText && (
        <div className="flex flex-col justify-center leading-none min-w-0">
          <span
            className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-[#163A2B]'} font-display ${current.title}`}
          >
            Krōw
          </span>

          {subtitle !== '' && (
            <span
              className={`font-medium ${isDark ? 'text-[#A3D9B5]' : 'text-[#4A6B56]'} mt-0.5 whitespace-nowrap ${current.sub}`}
            >
              {subtitle || 'Simple tools. Better business.'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

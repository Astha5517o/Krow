import React from 'react';
import { SproutIcon } from './KrowIllustrations';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  showSparkles?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Krōw Brand Identity & Logo
 * Designed directly in harmony with Astha's authentic brand:
 * - Handcrafted deep forest green typography (#163A2B)
 * - Fresh green sprout leaves blooming over the letter 'o'
 * - "Simple tools. Better business." tagline
 * - Tactile, clean squircle emblem with zero distortion
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  showSparkles = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: {
      box: 'w-6 h-6 rounded-lg',
      icon: 14,
      title: 'text-xs',
      sub: 'text-[7px]',
      sprout: 'w-3 h-3',
    },
    sm: {
      box: 'w-8 h-8 rounded-xl',
      icon: 18,
      title: 'text-sm',
      sub: 'text-[8px]',
      sprout: 'w-4 h-4',
    },
    md: {
      box: 'w-9 h-9 rounded-xl',
      icon: 20,
      title: 'text-base',
      sub: 'text-[9px]',
      sprout: 'w-4.5 h-4.5',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      icon: 26,
      title: 'text-xl',
      sub: 'text-[10px]',
      sprout: 'w-6 h-6',
    },
    xl: {
      box: 'w-16 h-16 rounded-2xl',
      icon: 36,
      title: 'text-2xl',
      sub: 'text-xs',
      sprout: 'w-8 h-8',
    },
  };

  const current = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title="Krōw — Simple tools. Better business."
    >
      {/* Precision Brand Squircle Emblem */}
      <div
        className={`${current.box} relative overflow-hidden bg-gradient-to-b from-[#1E4632] to-[#122F22] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(18,47,34,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-[#2F6B4F]/40 transition-transform active:scale-95 group`}
      >
        {/* Subtle Specular Highlight on top edge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Squircle Content: Sprout Leaf Emblem with Letter K */}
        <svg
          viewBox="0 0 32 32"
          className="w-4/5 h-4/5 flex-shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle soft background circle for contrast */}
          <circle cx="16" cy="16" r="14" fill="#163828" opacity="0.6" />

          {/* Letter K stem */}
          <line
            x1="9"
            y1="9"
            x2="9"
            y2="23"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Letter K upper diagonal arm */}
          <line
            x1="9"
            y1="16"
            x2="17"
            y2="9"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Letter K lower diagonal arm */}
          <line
            x1="12"
            y1="13.5"
            x2="18"
            y2="23"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Sprout blooming from top of K arm */}
          <g transform="translate(19, 9)">
            {/* Left Leaf (Fresh Sprout Green) */}
            <path
              d="M0 0C-3 -1 -5 -5 -4 -8C-1 -7 0.5 -4 0 0Z"
              fill="#4E9F6E"
              stroke="#E8F2EC"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            {/* Right Leaf (Bright Sprout Green) */}
            <path
              d="M0 0C1 -4 4 -8 8 -7C8 -3 4 -1 0 0Z"
              fill="#84C497"
              stroke="#E8F2EC"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Modern Wordmark with Sprout over the 'o' */}
      {showText && (
        <div className="flex flex-col justify-center leading-none min-w-0">
          <div className="flex items-center gap-1">
            {/* Styled Krōw Title with Sprout Leaves over 'o' */}
            <span
              className={`font-black tracking-tight text-[#163A2B] font-display flex items-baseline ${current.title}`}
            >
              <span>Kr</span>
              <span className="relative inline-flex items-center justify-center">
                <span>o</span>
                {/* Two sprout leaves over 'o' */}
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                  <svg
                    viewBox="0 0 16 12"
                    className="w-3.5 h-2.5 overflow-visible"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Left leaf */}
                    <path
                      d="M8 11C5 11 1 8.5 2 3.5C5.5 3.5 7.5 7 8 11Z"
                      fill="#3B8B5B"
                    />
                    {/* Right leaf */}
                    <path
                      d="M8 11C9 7 11.5 3.5 15 3.5C15.5 8 12 11 8 11Z"
                      fill="#68BA86"
                    />
                  </svg>
                </span>
              </span>
              <span>w</span>
            </span>

            {/* Subtle App Badge */}
            <span className="text-[9px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-1.5 py-0.2 rounded-md tracking-wider uppercase border border-[#2F6B4F]/15">
              POS
            </span>

            {showSparkles && (
              <span className="text-[10px] text-[#4E9F6E] font-medium select-none ml-0.5" aria-hidden="true">
                ˗ˏˋ
              </span>
            )}
          </div>

          {/* Subtitle / Tagline */}
          {subtitle !== '' && (
            <span
              className={`font-medium text-[#4A6B56] mt-0.5 whitespace-nowrap font-display ${current.sub}`}
            >
              {subtitle || 'Simple tools. Better business.'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

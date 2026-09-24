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
 * Krōw Sovereign Master Retail Brand Mark
 * Conceived with 30 years of identity design mastery:
 * 1. The Monolith Ledger Pillar (Left): Bedrock financial stability, double-entry accuracy, store anchor
 * 2. The Ascending Flight Wing (Top-Right): 40° profit expansion, speed, mint-emerald velocity vector
 * 3. The Raven Head & Razor Beak (Center): Corvid intelligence, razor-sharp accuracy, golden watchful eye
 * 4. The Gliding Tail / Lower Wing (Bottom-Right): Structural equilibrium, platinum balance
 * 5. Monogram Synthesis: The 4 elements lock together in mathematical negative space to form the letter 'K'
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
      iconWidth: 16,
      title: 'text-xs',
      sub: 'text-[8px]',
    },
    sm: {
      box: 'w-8 h-8 rounded-xl',
      iconWidth: 20,
      title: 'text-sm',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-9 h-9 rounded-xl',
      iconWidth: 22,
      title: 'text-base',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      iconWidth: 30,
      title: 'text-xl',
      sub: 'text-xs',
    },
    xl: {
      box: 'w-16 h-16 rounded-2xl',
      iconWidth: 42,
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
      title="Krōw — Smart Retail POS"
    >
      {/* Precision Brand Squircle Emblem */}
      <div
        className={`${current.box} relative overflow-hidden bg-[#0A2719] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(10,39,25,0.22)] border border-[#23583C]/60 transition-transform active:scale-95`}
      >
        {/* Subtle structural top-light */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/25 pointer-events-none" />

        {/* Master Krōw Geometric Sovereign Mark (viewBox 0 0 512 512) */}
        <svg
          width={current.iconWidth}
          height={current.iconWidth}
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <defs>
            <linearGradient id="appLogoWingGrad" x1="200" y1="230" x2="400" y2="76" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="appLogoTailGrad" x1="200" y1="280" x2="370" y2="430" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8F1EC" />
              <stop offset="100%" stopColor="#A5C7B4" />
            </linearGradient>
          </defs>

          {/* 1. Left Vertical Monolith Spine (Pillar of K) */}
          <rect
            x="100"
            y="88"
            width="68"
            height="336"
            rx="34"
            fill="#FFFFFF"
          />

          {/* 2. Primary Ascending Flight Wing (Top Arm of K — Emerald Growth Vector) */}
          <path
            d="M208 196 L356 74 C370 62 392 68 400 86 C406 100 400 114 386 124 L276 220 C258 236 228 238 208 226 Z"
            fill="url(#appLogoWingGrad)"
          />

          {/* 3. The Raven Head & Razor Beak (Vigilant Core & Center of K) */}
          <path
            d="M196 212 C236 200 282 202 316 212 L394 238 L318 264 C280 274 236 274 196 264 Z"
            fill="#FFFFFF"
          />

          {/* The Observant Corvid Eye (Golden Amber Iris, Dark Pupil, Specular Catchlight) */}
          <circle cx="294" cy="238" r="14" fill="#D97706" />
          <circle cx="294" cy="238" r="12" fill="#F59E0B" />
          <circle cx="295" cy="238" r="6" fill="#061C12" />
          <circle cx="297.5" cy="235.5" r="2.2" fill="#FFFFFF" />

          {/* 4. Lower Gliding Tail Wing (Bottom Arm of K — Platinum Equilibrium) */}
          <path
            d="M208 274 C228 266 256 268 272 280 L368 394 C380 408 376 428 360 436 C346 442 332 438 322 426 L208 298 Z"
            fill="url(#appLogoTailGrad)"
          />
        </svg>
      </div>

      {/* Typography: Crisp Neo-Grotesque Master Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center leading-none min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0A2719]'} font-display ${current.title}`}
            >
              Krōw
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-md bg-[#E4EFE8] text-[#0A2719] border border-[#23583C]/25">
              POS
            </span>
          </div>

          {subtitle !== '' && (
            <span
              className={`font-semibold ${isDark ? 'text-[#A3D9B5]' : 'text-[#486B56]'} mt-1 tracking-tight whitespace-nowrap ${current.sub}`}
            >
              {subtitle || 'स्मार्ट रिटेल पीओएस'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

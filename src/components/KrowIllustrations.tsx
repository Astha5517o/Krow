import React from 'react';

/**
 * Sprout Emblem Icon
 * Two organic leaves blooming upwards in fresh greens.
 */
export const SproutIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block flex-shrink-0 ${className}`}
  >
    <path
      d="M12 21V11"
      stroke="#1E4632"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Left Leaf */}
    <path
      d="M12 14.5C8.8 14.5 6 12 6 8.5C9.5 8.5 12 11.2 12 14.5Z"
      fill="#4E9F6E"
      stroke="#1E4632"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Right Leaf */}
    <path
      d="M12 12C12 8.5 14.5 5.5 18 5.5C18 9 15.2 12 12 12Z"
      fill="#84C497"
      stroke="#1E4632"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Krōw Wordmark Logo with Sprout Leaves over the 'o'
 * Exact typographic styling inspired by Astha's design:
 * - Friendly, bold, organic letterforms in deep spruce green (#163A2B)
 * - Two fresh green sprout leaves curving above the letter 'o'
 * - Optional accent sparkles (˗ˏˋ ˎˊ˗)
 */
interface KrowWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSparkles?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export const KrowWordmark: React.FC<KrowWordmarkProps> = ({
  size = 'md',
  showSparkles = true,
  showSubtitle = false,
  subtitle = 'Simple tools. Better business.',
  className = '',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#163A2B';
  const leafDark = isDark ? '#84C497' : '#3B8B5B';
  const leafLight = isDark ? '#B6E2C2' : '#68BA86';
  const sparkleColor = isDark ? '#84C497' : '#4E9F6E';

  const sizeClasses = {
    sm: {
      svg: 'h-7',
      sub: 'text-[9px] tracking-wide',
      wrapper: 'gap-0.5',
    },
    md: {
      svg: 'h-9',
      sub: 'text-[11px] tracking-wider',
      wrapper: 'gap-1',
    },
    lg: {
      svg: 'h-12',
      sub: 'text-xs tracking-wider',
      wrapper: 'gap-1.5',
    },
    xl: {
      svg: 'h-16',
      sub: 'text-sm tracking-widest',
      wrapper: 'gap-2',
    },
    hero: {
      svg: 'h-20 sm:h-24',
      sub: 'text-sm sm:text-base tracking-widest',
      wrapper: 'gap-2.5',
    },
  };

  const current = sizeClasses[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${current.wrapper} ${className}`}>
      <svg
        viewBox="0 0 240 72"
        className={`${current.svg} w-auto overflow-visible`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Krōw"
      >
        <defs>
          <filter id="krowSoftGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#163A2B" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Left Decorative Sparkle Rays ˗ˏˋ */}
        {showSparkles && (
          <g stroke={sparkleColor} strokeWidth="2.8" strokeLinecap="round" opacity="0.85">
            {/* Top Ray */}
            <line x1="16" y1="28" x2="26" y2="33" />
            {/* Middle Ray */}
            <line x1="12" y1="41" x2="24" y2="41" />
            {/* Bottom Ray */}
            <line x1="18" y1="54" x2="27" y2="49" />
          </g>
        )}

        {/* Brand Name Text: Krōw */}
        <g filter="url(#krowSoftGlow)">
          {/* Letter 'K' */}
          <path
            d="M52 23V61M52 44L72 23M58 40L75 61"
            stroke={textColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letter 'r' */}
          <path
            d="M92 35V61M92 44C95 38 102 34 109 36"
            stroke={textColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letter 'o' */}
          <ellipse
            cx="140"
            cy="48"
            rx="15"
            ry="14"
            stroke={textColor}
            strokeWidth="8.5"
            strokeLinecap="round"
          />

          {/* Sprout Blooming above the 'o' (Two Fresh Green Leaves) */}
          <g transform="translate(140, 31)">
            {/* Tiny sprout stem */}
            <path
              d="M0 3V-3"
              stroke={textColor}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Left Leaf */}
            <path
              d="M0 -2.5C-6 -2.5 -11 -7 -10 -13C-4 -12 -0.5 -8 0 -2.5Z"
              fill={leafDark}
              stroke={textColor}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Right Leaf */}
            <path
              d="M0 -2.5C2 -8 7 -14 13 -13C13 -7 7 -2.5 0 -2.5Z"
              fill={leafLight}
              stroke={textColor}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </g>

          {/* Letter 'w' */}
          <path
            d="M172 35L179 61L191 43L203 61L210 35"
            stroke={textColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Right Decorative Sparkle Rays ˎˊ˗ (Hero/Large mode) */}
        {showSparkles && (size === 'lg' || size === 'xl' || size === 'hero') && (
          <g stroke={sparkleColor} strokeWidth="2.8" strokeLinecap="round" opacity="0.85">
            <line x1="228" y1="33" x2="238" y2="28" />
            <line x1="230" y1="41" x2="242" y2="41" />
            <line x1="227" y1="49" x2="236" y2="54" />
          </g>
        )}
      </svg>

      {showSubtitle && (
        <span
          className={`font-semibold text-[#4A6B56] text-center font-display ${current.sub}`}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};

/**
 * Charming Kirana Storefront Line Illustration
 * Directly inspired by the phone screen mockup & Slide 3 illustration:
 * - Green line art with scalloped striped awning
 * - Store shelves filled with jars, goods, cereal packets
 * - Open friendly counter door
 * - Potted plants on sides
 * - Soft pastel fills
 */
interface KiranaStoreIllustrationProps {
  className?: string;
  size?: number | string;
  animated?: boolean;
}

export const KiranaStoreIllustration: React.FC<KiranaStoreIllustrationProps> = ({
  className = '',
  size = 200,
  animated = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 240 210"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${animated ? 'transition-transform duration-300 hover:scale-[1.02]' : ''} ${className}`}
    aria-label="Kirana Store Illustration"
  >
    <defs>
      <linearGradient id="awningGreenGrad" x1="40" y1="30" x2="200" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EBF4EE" />
        <stop offset="100%" stopColor="#DFEDE3" />
      </linearGradient>
      <linearGradient id="wallCreamGrad" x1="45" y1="70" x2="195" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FAF7F0" />
        <stop offset="100%" stopColor="#F5EFE1" />
      </linearGradient>
    </defs>

    {/* Ground Baseline */}
    <line x1="20" y1="185" x2="220" y2="185" stroke="#1E4632" strokeWidth="2.8" strokeLinecap="round" />

    {/* Store Walls Background */}
    <rect x="45" y="70" width="150" height="115" rx="4" fill="url(#wallCreamGrad)" stroke="#1E4632" strokeWidth="2.4" />

    {/* Big Window Display (Left side shelves with products) */}
    <rect x="55" y="80" width="70" height="75" rx="3" fill="#FFFFFF" stroke="#1E4632" strokeWidth="2" />
    {/* Shelves inside window */}
    <line x1="55" y1="105" x2="125" y2="105" stroke="#1E4632" strokeWidth="1.8" />
    <line x1="55" y1="130" x2="125" y2="130" stroke="#1E4632" strokeWidth="1.8" />

    {/* Products on top shelf (Jars & bottles) */}
    <rect x="62" y="88" width="10" height="15" rx="2" fill="#FDF7E7" stroke="#1E4632" strokeWidth="1.5" />
    <circle cx="67" cy="86" r="3" fill="#E4DFD2" stroke="#1E4632" strokeWidth="1.2" />
    <rect x="76" y="90" width="9" height="13" rx="2" fill="#E8F2EC" stroke="#1E4632" strokeWidth="1.5" />
    <rect x="89" y="87" width="11" height="16" rx="2" fill="#FBF0D9" stroke="#1E4632" strokeWidth="1.5" />
    <rect x="104" y="90" width="12" height="13" rx="2" fill="#E8F2EC" stroke="#1E4632" strokeWidth="1.5" />

    {/* Products on middle shelf (Boxes, cereal, snacks) */}
    <rect x="60" y="112" width="13" height="16" rx="1.5" fill="#E7F0EA" stroke="#1E4632" strokeWidth="1.5" />
    <line x1="63" y1="117" x2="70" y2="117" stroke="#2F6B4F" strokeWidth="1.2" />
    <rect x="77" y="110" width="15" height="18" rx="1.5" fill="#FAF7F0" stroke="#1E4632" strokeWidth="1.5" />
    <rect x="96" y="113" width="12" height="15" rx="1.5" fill="#FDF7E7" stroke="#1E4632" strokeWidth="1.5" />
    <rect x="111" y="115" width="10" height="13" rx="1.5" fill="#E8F2EC" stroke="#1E4632" strokeWidth="1.5" />

    {/* Products on lower shelf (Grains, packets) */}
    <path d="M60 148C60 140 68 137 72 137C76 137 84 140 84 148H60Z" fill="#F5EFE1" stroke="#1E4632" strokeWidth="1.4" />
    <path d="M88 148C88 141 96 138 100 138C104 138 112 141 112 148H88Z" fill="#E8F2EC" stroke="#1E4632" strokeWidth="1.4" />
    <rect x="115" y="137" width="8" height="11" rx="1" fill="#FDF7E7" stroke="#1E4632" strokeWidth="1.3" />

    {/* Store Door / Counter Entry (Right side) */}
    <rect x="135" y="80" width="50" height="105" rx="3" fill="#FAF7F0" stroke="#1E4632" strokeWidth="2" />
    {/* Door Glass Panel */}
    <rect x="142" y="88" width="36" height="42" rx="2" fill="#FFFFFF" stroke="#1E4632" strokeWidth="1.6" />
    <line x1="142" y1="109" x2="178" y2="109" stroke="#1E4632" strokeWidth="1.2" strokeDasharray="2 2" />
    {/* Door Handle */}
    <line x1="144" y1="140" x2="144" y2="152" stroke="#1E4632" strokeWidth="2.4" strokeLinecap="round" />
    {/* Bottom door panel lines */}
    <line x1="142" y1="168" x2="178" y2="168" stroke="#1E4632" strokeWidth="1.2" />

    {/* Store Sign Banner above Awning */}
    <rect x="65" y="24" width="110" height="22" rx="4" fill="#FFFFFF" stroke="#1E4632" strokeWidth="2" />
    <text
      x="120"
      y="39"
      textAnchor="middle"
      fill="#1E4632"
      fontSize="12"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="3"
    >
      KROW
    </text>

    {/* Scalloped Striped Awning */}
    <path
      d="M36 46H204L196 74C196 74 186 78 178 74C170 78 160 78 152 74C144 78 134 78 126 74C118 78 108 78 100 74C92 78 82 78 74 74C66 78 56 78 48 74L40 74L36 46Z"
      fill="url(#awningGreenGrad)"
      stroke="#1E4632"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    {/* Awning Stripes */}
    <path d="M56 46L52 75" stroke="#1E4632" strokeWidth="1.6" />
    <path d="M80 46L76 76" stroke="#1E4632" strokeWidth="1.6" />
    <path d="M104 46L102 76" stroke="#1E4632" strokeWidth="1.6" />
    <path d="M128 46L128 76" stroke="#1E4632" strokeWidth="1.6" />
    <path d="M152 46L154 76" stroke="#1E4632" strokeWidth="1.6" />
    <path d="M176 46L180 76" stroke="#1E4632" strokeWidth="1.6" />

    {/* Decorative Awning Scallops */}
    <g fill="#2F6B4F" stroke="#1E4632" strokeWidth="1.2">
      <circle cx="48" cy="74" r="3" fill="#4E9F6E" />
      <circle cx="74" cy="74" r="3" fill="#4E9F6E" />
      <circle cx="100" cy="74" r="3" fill="#4E9F6E" />
      <circle cx="126" cy="74" r="3" fill="#4E9F6E" />
      <circle cx="152" cy="74" r="3" fill="#4E9F6E" />
      <circle cx="178" cy="74" r="3" fill="#4E9F6E" />
    </g>

    {/* Left Potted Plant (Corner greenery) */}
    <g transform="translate(24, 150)">
      {/* Pot */}
      <path d="M4 18L7 34H17L20 18H4Z" fill="#DF8E57" stroke="#1E4632" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Stem and Leaves */}
      <path d="M12 18V6" stroke="#1E4632" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12C6 11 4 4 10 3C13 8 13 11 12 12Z" fill="#4E9F6E" stroke="#1E4632" strokeWidth="1.4" />
      <path d="M12 8C17 7 20 2 15 1C12 5 12 7 12 8Z" fill="#84C497" stroke="#1E4632" strokeWidth="1.4" />
      <path d="M12 16C18 15 21 11 17 9C14 13 13 15 12 16Z" fill="#3B8B5B" stroke="#1E4632" strokeWidth="1.4" />
    </g>

    {/* Right Potted Plant */}
    <g transform="translate(196, 146)">
      {/* Pot */}
      <path d="M5 22L8 38H19L22 22H5Z" fill="#DF8E57" stroke="#1E4632" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Plant Leaves */}
      <path d="M13 22V5" stroke="#1E4632" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 15C7 14 3 8 9 6C13 10 13 14 13 15Z" fill="#4E9F6E" stroke="#1E4632" strokeWidth="1.4" />
      <path d="M13 10C20 9 23 3 17 2C13 6 13 9 13 10Z" fill="#84C497" stroke="#1E4632" strokeWidth="1.4" />
      <path d="M13 19C19 18 23 13 18 12C15 16 14 18 13 19Z" fill="#3B8B5B" stroke="#1E4632" strokeWidth="1.4" />
    </g>

    {/* Floating Friendly Sparkle / Heart Accent */}
    <path
      d="M214 98C214 94 219 90 223 94C227 90 232 94 232 98C232 104 223 110 223 110C223 110 214 104 214 98Z"
      fill="#E68A80"
      stroke="#1E4632"
      strokeWidth="1.2"
    />
  </svg>
);

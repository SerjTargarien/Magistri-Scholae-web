/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/**
 * Intricate golden corner flourish matching the target Magic Academy screenshots.
 */
export const FiligreeCorner: React.FC<{
  position: "tl" | "tr" | "bl" | "br";
  className?: string;
  size?: "sm" | "md" | "lg";
}> = () => null;

/**
 * Ornate golden corner flourish designed specifically for collectible Character Cards.
 */
export const CardCornerOrnament: React.FC<{
  position: "tl" | "tr" | "bl" | "br";
  className?: string;
}> = ({ position, className = "" }) => {
  const posClass =
    position === "tl"
      ? "top-1.5 left-1.5"
      : position === "tr"
      ? "top-1.5 right-1.5 scale-x-[-1]"
      : position === "bl"
      ? "bottom-1.5 left-1.5 scale-y-[-1]"
      : "bottom-1.5 right-1.5 scale-[-1]";

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute w-5 h-5 ${posClass} text-[#f0b61c] select-none z-20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] ${className}`}
      aria-hidden="true"
    >
      <path
        d="M2 28V10C2 5.58172 5.58172 2 10 2H28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 20V11C6 8.23858 8.23858 6 11 6H20"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.85"
        strokeLinecap="round"
      />
      <polygon
        points="5,5 9,5 9,9 5,9"
        fill="currentColor"
        transform="rotate(45 7 7)"
      />
    </svg>
  );
};

/**
 * Eight-pointed golden compass star divider shown between the two columns in CharacterDetail.
 */
export const CompassDivider: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`hidden md:flex flex-col items-center justify-center pointer-events-none select-none ${className}`}
    aria-hidden="true"
  >
    <div className="w-px flex-1 bg-gradient-to-b from-transparent via-[#c59b27]/50 to-[#c59b27]/80" />
    <svg
      viewBox="0 0 64 64"
      className="w-11 h-11 text-[#d4af37] my-1 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] shrink-0"
      fill="none"
    >
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="2 2" />
      {/* 4 Minor points */}
      <polygon
        points="32,12 35,29 52,32 35,35 32,52 29,35 12,32 29,29"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="1"
        transform="rotate(45 32 32)"
      />
      {/* 4 Major points */}
      <polygon
        points="32,4 35.5,28.5 60,32 35.5,35.5 32,60 28.5,35.5 4,32 28.5,28.5"
        fill="#141022"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <polygon
        points="32,8 34,29 56,32 34,35 32,56 30,35 8,32 30,29"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <circle cx="32" cy="32" r="3" fill="#fff3c4" />
    </svg>
  <div className="w-px flex-1 bg-gradient-to-b from-[#c59b27]/80 via-[#c59b27]/50 to-transparent" />
  </div>
);

/**
 * Horizontal golden filigree rule with an eight-pointed compass star in the center.
 */
export const CompassStarDivider: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`flex items-center justify-center w-full gap-2 pointer-events-none select-none ${className}`}
    aria-hidden="true"
  >
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c8a248]/50 to-[#c8a248]/85" />
    <svg
      viewBox="0 0 32 32"
      className="w-4 h-4 text-[#d4af37] shrink-0 drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]"
      fill="none"
    >
      <polygon
        points="16,4 18,14 28,16 18,18 16,28 14,18 4,16 14,14"
        fill="currentColor"
        fillOpacity="0.4"
        transform="rotate(45 16 16)"
      />
      <polygon
        points="16,1 18,14 31,16 18,18 16,31 14,18 1,16 14,14"
        fill="currentColor"
      />
      <circle cx="16" cy="16" r="2" fill="#fff3c4" />
    </svg>
    <div className="h-px flex-1 bg-gradient-to-r from-[#c8a248]/85 via-[#c8a248]/50 to-transparent" />
  </div>
);

/**
 * Magic Academy Castle Silhouette & Heraldic Shield overlay for the CharacterDetail banner.
 */
export const CastleBannerArtwork: React.FC = () => (
  <div
    className="pointer-events-none select-none absolute inset-y-0 right-0 w-72 md:w-96 overflow-hidden flex items-center justify-end pr-5 opacity-90"
    aria-hidden="true"
  >
    {/* Castle spires silhouette */}
    <svg
      viewBox="0 0 420 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full object-cover opacity-45"
      preserveAspectRatio="xMaxYMid slice"
    >
      <path
        d="M0 160L40 160L40 125L50 110L60 125L60 160L85 160L85 95L98 65L111 95L111 160L125 160L125 105L145 105L145 80L158 45L171 80L171 105L190 105L190 70L205 28L220 70L220 115L238 115L238 60L255 15L272 60L272 95L295 95L295 50L308 22L321 50L321 160L420 160V160H0Z"
        fill="#09050d"
      />
      {/* Warm lit castle windows */}
      <rect x="202" y="78" width="4" height="8" rx="2" fill="#f59e0b" fillOpacity="0.6" />
      <rect x="251" y="68" width="4" height="9" rx="2" fill="#f59e0b" fillOpacity="0.7" />
      <rect x="258" y="68" width="4" height="9" rx="2" fill="#f59e0b" fillOpacity="0.7" />
      <rect x="155" y="88" width="4" height="7" rx="2" fill="#f59e0b" fillOpacity="0.5" />
      <rect x="305" y="65" width="4" height="8" rx="2" fill="#f59e0b" fillOpacity="0.6" />
    </svg>

    {/* Ornate Heraldic Shield on the right */}
    <svg
      viewBox="0 0 100 120"
      className="relative z-10 w-20 h-24 md:w-24 md:h-28 text-[#d4af37] opacity-80 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
      fill="none"
    >
      {/* Shield Outer Frame */}
      <path
        d="M12 10C25 14 38 14 50 8C62 14 75 14 88 10V56C88 84 68 102 50 112C32 102 12 84 12 56V10Z"
        fill="#1a0d12"
        fillOpacity="0.75"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M17 15C28 18 39 18 50 13C61 18 72 18 83 15V55C83 79 65 95 50 105C35 95 17 79 17 55V15Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.65"
      />
      {/* Stylized Heraldic Emblem inside Shield */}
      <path
        d="M50 26C42 26 36 32 36 40C36 46 40 50 40 56C40 62 33 66 33 74H67C67 66 60 62 60 56C60 50 64 46 64 40C64 32 58 26 50 26Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="50" cy="40" r="5" fill="currentColor" fillOpacity="0.7" />
      <path d="M30 82H70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

/**
 * Full-screen Warm Obsidian and Candlelit Bronze-Amber radial gradient backdrop.
 */
export const AcademyBackground: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0c080e]"
    aria-hidden="true"
  >
    {/* Primary Candlelit Bronze-Amber radial glow */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 75% 55% at 50% 26%, rgba(145, 92, 30, 0.24) 0%, rgba(64, 36, 20, 0.46) 48%, rgba(12, 8, 14, 0.96) 100%)",
      }}
    />

    {/* Secondary warm bronze ambient glow near bottom */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 65% 45% at 50% 85%, rgba(96, 56, 20, 0.18) 0%, transparent 75%)",
      }}
    />

    {/* Subtle dark obsidian edge vignette */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#08050b]/50 via-transparent to-[#08050b]/75" />
  </div>
);


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import houseCrestPaths from "../utils/houseCrestPaths.json";

export interface HouseCrestProps {
  house: string;
  isAdultWizard?: boolean;
  className?: string;
  variant?: "shield" | "medallion";
}

interface CrestConfig {
  bgFill: string;
  innerRing: string;
  viewBox: string;
  paths: Array<{ id: string; fill: string; d: string }>;
}

const CREST_CONFIGS: Record<string, CrestConfig> = {
  IRATI: {
    // Forest Green & Black/Gold — Golden Boreal Owl
    bgFill: "rgb(9, 77, 44)",
    innerRing: "#14261c",
    viewBox: "355 550 665 530",
    paths: houseCrestPaths.IRATI,
  },
  ALEIXIS: {
    // Garnet & Silver — Ivory Iberian Wolf with Staff
    bgFill: "rgb(133, 19, 21)",
    innerRing: "#e4e4e7",
    viewBox: "1130 545 510 565",
    paths: houseCrestPaths.ALEIXIS,
  },
  URANIA: {
    // Mustard Gold & Blue — Deep Blue Bull
    bgFill: "rgb(212, 154, 12)",
    innerRing: "#1e3a8a",
    viewBox: "375 1115 405 525",
    paths: houseCrestPaths.URANIA,
  },
  CALANTES: {
    // Indigo & White — Ivory Octopus
    bgFill: "rgb(38, 35, 84)",
    innerRing: "#fef9e9",
    viewBox: "695 1395 645 525",
    paths: houseCrestPaths.CALANTES,
  },
  "AL-KHWARIZMI": {
    // Royal Violet & Gold — Spotted Golden Iberian Lynx
    bgFill: "rgb(74, 30, 96)",
    innerRing: "#f0b61c",
    viewBox: "1290 1125 400 495",
    paths: houseCrestPaths["AL-KHWARIZMI"].map((p) => ({
      ...p,
      fill: p.fill === "url(#Gradient1)" ? "rgb(28, 32, 45)" : p.fill,
    })),
  },
  ADULT_WIZARD: {
    // Open Grimoire Book on Gold
    bgFill: "rgb(212, 154, 12)",
    innerRing: "#4a1e60",
    viewBox: "830 1055 385 320",
    paths: houseCrestPaths.ADULT_WIZARD,
  },
};

export const RECOGNIZED_HOUSES = ["IRATI", "ALEIXIS", "URANIA", "CALANTES", "AL-KHWARIZMI"] as const;

/**
 * Checks if the given house has an authentic recognized vector crest
 */
export const hasRecognizedCrest = (house?: string): boolean => {
  if (!house) return false;
  const key = house.trim().toUpperCase();
  return (RECOGNIZED_HOUSES as readonly string[]).includes(key);
};

/**
 * Renders the individual vector Founding House Crest extracted from Escudo Icono Vectorial.svg
 */
export const HouseCrest: React.FC<HouseCrestProps> = ({
  house,
  isAdultWizard = false,
  className = "w-12 h-14",
  variant = "shield",
}) => {
  const key = isAdultWizard ? "ADULT_WIZARD" : (house || "IRATI").toUpperCase();
  const config = CREST_CONFIGS[key] || CREST_CONFIGS.ADULT_WIZARD;

  if (variant === "medallion") {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`select-none shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Metallic Gold Rim */}
        <circle cx="50" cy="50" r="48" fill="#181109" stroke="#f0b61c" strokeWidth="3.5" />
        {/* House Enamel Field */}
        <circle cx="50" cy="50" r="43" fill={config.bgFill} stroke={config.innerRing} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="40" stroke="#f0b61c" strokeWidth="0.9" strokeOpacity="0.65" />

        {/* Vector Emblem from Escudo Icono Vectorial */}
        <svg
          x="14"
          y="14"
          width="72"
          height="72"
          viewBox={config.viewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          {config.paths.map((p) => (
            <path key={p.id} d={p.d} fill={p.fill} />
          ))}
        </svg>
      </svg>
    );
  }

  // Default: Classic Spanish/Heraldic Shield shape inspired by the School Crest
  const shieldPath =
    "M 50 4 C 66 4 82 7 93 12 C 93 42 92 68 82 85 C 73 99 61 107 50 113 C 39 107 27 99 18 85 C 8 68 7 42 7 12 C 18 7 34 4 50 4 Z";
  const innerShieldPath =
    "M 50 9 C 64 9 78 11.5 88 16 C 88 43 87 66 78 81 C 70 94 59 101 50 107 C 41 101 30 94 22 81 C 13 66 12 43 12 16 C 22 11.5 36 9 50 9 Z";

  return (
    <svg
      viewBox="0 0 100 116"
      className={`select-none shrink-0 drop-shadow-[0_5px_12px_rgba(0,0,0,0.85)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Gold Shield Frame */}
      <path
        d={shieldPath}
        fill="#1a1208"
        stroke="#f0b61c"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* House Heraldic Field */}
      <path
        d={innerShieldPath}
        fill={config.bgFill}
        stroke={config.innerRing}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Subtle Inner Gold Filigree Line */}
      <path
        d={innerShieldPath}
        stroke="#f0b61c"
        strokeWidth="0.9"
        strokeOpacity="0.6"
        strokeLinejoin="round"
        transform="scale(0.95) translate(2.6, 2.8)"
      />

      {/* Vector Emblem from Escudo Icono Vectorial */}
      <svg
        x="15"
        y="15"
        width="70"
        height="74"
        viewBox={config.viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {config.paths.map((p) => (
          <path key={p.id} d={p.d} fill={p.fill} />
        ))}
      </svg>
    </svg>
  );
};

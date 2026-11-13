/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CharacterType } from "../model/sheet";
import { HOUSES, HOUSE_ICONS, CHARACTER_TYPES } from "../data/gameData";

export interface CharacterVisualTheme {
  key: string;
  icon: string;
  bgClass: string;
  accentClass: string;
  borderClass: string;
  textClass: string;
}

export const getCharacterVisualTheme = (
  character: { characterType?: CharacterType | null; casa?: string | null }
): CharacterVisualTheme => {
  const type = character.characterType || "student";

  if (type === "adult_wizard") {
    return {
      key: "adult_wizard",
      icon: CHARACTER_TYPES.adult_wizard.icon,
      bgClass: "from-violet-950 to-neutral-950",
      accentClass: "bg-violet-700 hover:bg-violet-600 text-violet-100 border-violet-500/30",
      borderClass: "border-violet-500/20",
      textClass: "text-violet-400",
    };
  }

  // Fallback to student house-based colors
  const houseKey = (character.casa || "IRATI").toUpperCase();
  const houseInfo = HOUSES[houseKey] || HOUSES.IRATI;

  return {
    key: houseInfo.key,
    icon: HOUSE_ICONS[houseKey] || "🏰",
    bgClass: houseInfo.bgClass,
    accentClass: houseInfo.accentClass,
    borderClass: houseInfo.borderClass,
    textClass: houseInfo.textClass,
  };
};

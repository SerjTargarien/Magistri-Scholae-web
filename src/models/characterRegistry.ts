/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CharacterType } from "../model/sheet";

export type EntityArchetypeKey = CharacterType | "familiar";

export interface ArchetypeCapabilities {
  hasStats: boolean;
  hasSpellsPotions: boolean;
  hasStressTracks: boolean;
  hasNotes: boolean;
  hasGallery: boolean;
  hasHouseCrest: boolean;
  hasBondedMaster: boolean;
  hasBondedFamiliar: boolean;
}

export type SectionTabKey = "perfil" | "sesion" | "habilidades" | "hechizos" | "notas" | "galeria";

export interface ArchetypeDefinition {
  key: EntityArchetypeKey;
  icon: string;
  titleKey: string;
  shortLabelKey: string;
  descriptionKey: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  capabilities: ArchetypeCapabilities;
  tabs: SectionTabKey[];
}

export const ARCHETYPES_REGISTRY: Record<EntityArchetypeKey, ArchetypeDefinition> = {
  student: {
    key: "student",
    icon: "🎓",
    titleKey: "characterTypeStudent",
    shortLabelKey: "studentPrefix",
    descriptionKey: "characterTypeStudentDescription",
    badgeBg: "bg-amber-950/70",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/40",
    capabilities: {
      hasStats: true,
      hasSpellsPotions: true,
      hasStressTracks: true,
      hasNotes: true,
      hasGallery: true,
      hasHouseCrest: true,
      hasBondedMaster: false,
      hasBondedFamiliar: true,
    },
    tabs: ["perfil", "sesion", "habilidades", "hechizos", "notas", "galeria"],
  },
  adult_wizard: {
    key: "adult_wizard",
    icon: "🧙",
    titleKey: "characterTypeAdultWizard",
    shortLabelKey: "characterTypeAdultWizardShort",
    descriptionKey: "characterTypeAdultWizardDescription",
    badgeBg: "bg-violet-950/70",
    badgeText: "text-violet-300",
    badgeBorder: "border-violet-500/40",
    capabilities: {
      hasStats: true,
      hasSpellsPotions: true,
      hasStressTracks: true,
      hasNotes: true,
      hasGallery: true,
      hasHouseCrest: false,
      hasBondedMaster: false,
      hasBondedFamiliar: true,
    },
    tabs: ["perfil", "sesion", "habilidades", "hechizos", "notas", "galeria"],
  },
  familiar: {
    key: "familiar",
    icon: "🐾",
    titleKey: "familiarEditorCardTitle",
    shortLabelKey: "familiarSpeciesShort",
    descriptionKey: "familiarEditorCardDescription",
    badgeBg: "bg-emerald-950/70",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    capabilities: {
      hasStats: false,
      hasSpellsPotions: false,
      hasStressTracks: false,
      hasNotes: true,
      hasGallery: true,
      hasHouseCrest: false,
      hasBondedMaster: true,
      hasBondedFamiliar: false,
    },
    tabs: ["perfil", "notas", "galeria"],
  },
};

export const getArchetype = (key: EntityArchetypeKey): ArchetypeDefinition => {
  return ARCHETYPES_REGISTRY[key] || ARCHETYPES_REGISTRY.student;
};

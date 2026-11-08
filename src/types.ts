/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Skill {
  id?: string;
  nombre: string;
  valor: number;
  categoria: string;
}

export interface Spell {
  id: string;
  nombre: string;
  valor: number;
  specialized: boolean;
}

export interface Potion {
  id: string;
  nombre: string;
  valor: number;
  specialized: boolean;
}

export interface CustomField {
  nombre: string;
  valor: string;
}

export interface Club {
  id: string;
  nombre: string;
}

export interface InventoryItem {
  id: string;
  nombre: string;
  cantidad: number;
}

export interface JournalNote {
  id: string;
  titulo: string;
  contenido: string;
  fecha: number;
}

export type CharacterType = "student" | "adult_wizard";

export interface AdultWizardProfile {
  role: string;
  institution: string;
  isTeacher: boolean;
  teachingSubjects: string[];
  formerHouse: string;
  magicalFocus: string;
  reputation: string;
}

export const getCharacterType = (character: Character): CharacterType => {
  return character.characterType || "student";
};

export interface Character {
  id?: number; // IndexedDB primary auto-increment key
  tempId?: string; // For unsaved drafts
  characterType?: CharacterType;
  adultWizardProfile?: AdultWizardProfile;

  // Datos de Alumno
  nombre: string;
  jugador: string;
  edad: string;
  casa: string;
  curso: string;
  puestoClase: string;
  concepto: string;
  lema: string;
  escudoText: string;

  // Complicación y Linaje
  complicaciones: string[];
  linaje: string;
  puntosDestino: number;
  economia: string;

  // Familiar y Varita
  familiarId?: string;
  varitaSintonia: string;

  // Estrés
  estresFisico: number;
  estresFisicoMax: number;
  estresMental: number;
  estresMentalMax: number;
  estresMentalConsecuencia?: string; // Keep for retro-compatibility as optional
  estresSocial: number;
  estresSocialMax: number;

  // Consecuencias de Estrés
  consecuenciasFisicas: string[];
  consecuenciasMentales: string[];
  consecuenciasSociales: string[];

  // Experiencia
  pxs: number;

  // Aspectos
  aspectoTemporal: string[];
  aspectosPersonales: string[]; // List of custom traits/aspects

  // Habilidades
  habilidades: Skill[];

  // Conjuros, Pociones, Clubes, Equipo, Notas
  conjuros: Spell[];
  pociones: Potion[];
  clubes: string;
  clubesList?: Club[];
  equipo: string;
  equipoList?: InventoryItem[];
  notas: string;
  notasList?: JournalNote[];

  // Imágenes (Stored as base64 string/dataURL to work flawlessly offline & serialize for backup)
  avatarImage: string; // base64 / url
  avatarFit?: "cover" | "contain"; // how the avatar fits the card
  galleryImages: string[]; // array of base64 / urls

  // Campos personalizados
  camposPersonalizados: CustomField[];

  createdAt: number;
  updatedAt: number;
}

export interface Familiar {
  id: string;
  nombre: string;
  especie: string;
  descripcion: string;
  imagen?: string;
  imageFit?: "cover" | "contain";
  studentId?: number | string;
  notasList?: JournalNote[];
  galleryImages?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  backupVersion: string;
  app: string;
  exportedAt: string;
  characters: Character[];
  familiars?: Familiar[];
}

export type VisualStyle = "academy" | "classic";



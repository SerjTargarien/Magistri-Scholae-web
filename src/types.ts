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

export const CHARACTER_TYPES = {
  student: {
    key: "student",
    icon: "🎓",
  },
  adult_wizard: {
    key: "adult_wizard",
    icon: "🧙",
  },
} as const;

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
  familiar: string;
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

export interface HouseInfo {
  key: string;
  nombre: string;
  procedencia: string;
  colores: string; // colors styling
  elemento: string;
  totem: string;
  lema: string;
  escudo: string;
  bgClass: string;
  accentClass: string;
  borderClass: string;
  textClass: string;
}

export const HOUSE_ICONS: Record<string, string> = {
  IRATI: "🦉",
  URANIA: "🐂",
  "AL-KHWARIZMI": "😼",
  CALANTES: "🐙",
  ALEIXIS: "🐺",
};

export const HOUSES: Record<string, HouseInfo> = {
  IRATI: {
    key: "IRATI",
    nombre: "Irati",
    procedencia: "Navarra",
    colores: "Verde y Negro",
    elemento: "Aire",
    totem: "Mochuelo boreal",
    lema: "Creer es ver",
    escudo: "IRATI",
    bgClass: "from-emerald-950 to-neutral-950",
    accentClass: "bg-emerald-600 hover:bg-emerald-500 text-emerald-100 border-emerald-500/30",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-400",
  },
  URANIA: {
    key: "URANIA",
    nombre: "Urania",
    procedencia: "Castilla",
    colores: "Mostaza y Azul",
    elemento: "Tierra",
    totem: "Toro",
    lema: "Ni por esperanza ni por miedo",
    escudo: "URANIA",
    bgClass: "from-amber-950 to-neutral-950",
    accentClass: "bg-amber-600 hover:bg-amber-550 text-amber-100 border-amber-550/30",
    borderClass: "border-amber-500/20",
    textClass: "text-amber-400",
  },
  "AL-KHWARIZMI": {
    key: "AL-KHWARIZMI",
    nombre: "Al-Khwarizmi",
    procedencia: "Al-Andalus",
    colores: "Violeta y Oro",
    elemento: "Fuego",
    totem: "Lince",
    lema: "El conocimiento es la puerta",
    escudo: "AL-KHWARIZMI",
    bgClass: "from-violet-950 to-neutral-950",
    accentClass: "bg-violet-600 hover:bg-violet-500 text-violet-100 border-violet-500/30",
    borderClass: "border-violet-500/20",
    textClass: "text-violet-400",
  },
  CALANTES: {
    key: "CALANTES",
    nombre: "Calantes",
    procedencia: "Portugal",
    colores: "Índigo y Blanco",
    elemento: "Agua",
    totem: "Pulpo",
    lema: "El horizonte como límite",
    escudo: "CALANTES",
    bgClass: "from-indigo-950 to-neutral-950",
    accentClass: "bg-indigo-600 hover:bg-indigo-500 text-indigo-100 border-indigo-500/30",
    borderClass: "border-indigo-500/20",
    textClass: "text-indigo-400",
  },
  ALEIXIS: {
    key: "ALEIXIS",
    nombre: "Aleixis",
    procedencia: "Aragón",
    colores: "Plata y Granate",
    elemento: "Metal",
    totem: "Lobo ibérico",
    lema: "Mérito obliga",
    escudo: "ALEIXIS",
    bgClass: "from-rose-950 to-neutral-950",
    accentClass: "bg-rose-600 hover:bg-rose-500 text-rose-100 border-rose-500/30",
    borderClass: "border-rose-500/20",
    textClass: "text-rose-400",
  },
};

export const DEFAULT_SKILLS = [
  // Físicas
  { nombre: "Atletismo", categoria: "Físicas", valor: 0 },
  { nombre: "Físico", categoria: "Físicas", valor: 0 },
  { nombre: "Deportes", categoria: "Físicas", valor: 0 },
  { nombre: "Sigilo", categoria: "Físicas", valor: 0 },
  { nombre: "Prestidigitación", categoria: "Físicas", valor: 0 },
  { nombre: "Duelo", categoria: "Físicas", valor: 0 },
  { nombre: "Supervivencia", categoria: "Físicas", valor: 0 },

  // Mentales
  { nombre: "Investigar", categoria: "Mentales", valor: 0 },
  { nombre: "Percepción", categoria: "Mentales", valor: 0 },
  { nombre: "Voluntad", categoria: "Mentales", valor: 0 },
  { nombre: "Espiritismo", categoria: "Mentales", valor: 0 },
  { nombre: "Empatía", categoria: "Mentales", valor: 0 },

  // Sociales
  { nombre: "Contactos", categoria: "Sociales", valor: 0 },
  { nombre: "Provocar", categoria: "Sociales", valor: 0 },
  { nombre: "Carisma", categoria: "Sociales", valor: 0 },
  { nombre: "Engaño", categoria: "Sociales", valor: 0 },

  // Asignaturas Troncales
  { nombre: "Transmutación", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Pociones", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Historia del mundo mágico", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Herbología", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Astronomía", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Trivium", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Quadrivium", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Cábala", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Simpática", categoria: "Asignaturas Troncales", valor: 0 },
  { nombre: "Hermética", categoria: "Asignaturas Troncales", valor: 0 },

  // Asignaturas Optativas
  { nombre: "Seres mágicos", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Magia druídica", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Arte", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Conocimiento muggle", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Oráculo", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Quimerismo", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Musología", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Numerología", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Espejismo", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Climática", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Entropía", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Cronomancia", categoria: "Asignaturas Optativas", valor: 0 },
  { nombre: "Sanación", categoria: "Asignaturas Optativas", valor: 0 },
];

export interface BackupData {
  backupVersion: string;
  app: string;
  exportedAt: string;
  characters: Character[];
}

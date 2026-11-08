// Game data shared by the screens: houses, house icons, character types, and
// the old app's default skills. Moved out of src/types.ts in R3.2 so the
// hand-written record types can be retired on their own (R3.6). The account
// model takes its default skills from the skill catalogue (src/model/catalogue.ts).

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
    bgClass: "from-emerald-900/90 via-emerald-950 to-neutral-950",
    accentClass: "bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border-emerald-500/30",
    borderClass: "border-emerald-500/30",
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
    bgClass: "from-amber-700/80 via-amber-950/90 to-blue-950",
    accentClass: "bg-amber-600 hover:bg-amber-500 text-amber-100 border-amber-500/30",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
  },
  "AL-KHWARIZMI": {
    key: "AL-KHWARIZMI",
    nombre: "Al-Khwarizmi",
    procedencia: "Al-Ándalus",
    colores: "Violeta y Dorado",
    elemento: "Fuego",
    totem: "Lince ibérico",
    lema: "El conocimiento es la puerta",
    escudo: "AL-KHWARIZMI",
    bgClass: "from-violet-950 via-purple-950/90 to-amber-800/75",
    accentClass: "bg-violet-600 hover:bg-violet-500 text-violet-100 border-violet-500/30",
    borderClass: "border-violet-500/30",
    textClass: "text-violet-400",
  },
  CALANTES: {
    key: "CALANTES",
    nombre: "Calantes",
    procedencia: "Portugal",
    colores: "Añil y Blanco",
    elemento: "Agua",
    totem: "Pulpo",
    lema: "El horizonte como límite",
    escudo: "CALANTES",
    bgClass: "from-indigo-950 via-indigo-900/85 to-slate-300/35",
    accentClass: "bg-indigo-600 hover:bg-indigo-500 text-indigo-100 border-indigo-500/30",
    borderClass: "border-indigo-500/30",
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
    bgClass: "from-rose-950 via-red-950/90 to-zinc-400/40",
    accentClass: "bg-rose-700 hover:bg-rose-600 text-rose-100 border-rose-500/30",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
  },
};

/** The old app's 39 default skills; the account model uses the skill catalogue instead. */
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

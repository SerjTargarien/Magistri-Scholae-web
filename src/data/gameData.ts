// Game data shared by the screens: houses, house icons and character types
// (backend/domain/tests/test_contracts.py checks the types against the server).
// Default skills come from the skill catalogue (src/model/catalogue.ts).

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

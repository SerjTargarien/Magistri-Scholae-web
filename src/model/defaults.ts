// Blank new sheets in the server's model (R3.2). The server stores what the
// app sends and fills in nothing, so these defaults live here. They match the
// old app's (src/utils/characterFactory.ts) apart from the fields the owner
// removed (motto, shield text, the old single-text fields) and the new skill
// catalogue: destiny 3, stress maximum 3 for students and 5 for adults, age 11,
// house Irati and year "1º" for students, every applicable default skill at 0.
import { DEFAULT_SKILL_CATALOGUE, skillApplies, type SkillCatalogue } from "./catalogue";
import { newItemId, type CharacterSheet, type CharacterType, type FamiliarSheet, type SkillEntry } from "./sheet";

/**
 * The player's own default skills, saved on this device by "save as default
 * skills" (the buttons move to it in R3.4). Old presets under
 * "fate_wizardry_custom_default_skills" and "magistri_default_skills_preset"
 * belong to the old app and are not read.
 */
export const SKILL_PRESET_KEY = "magistri_skill_preset";

type PresetEntry = Omit<SkillEntry, "id">;

export function readSkillPreset(storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage): PresetEntry[] | undefined {
  try {
    const parsed = JSON.parse(storage?.getItem(SKILL_PRESET_KEY) ?? "null");
    return Array.isArray(parsed) && parsed.length ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function saveSkillPreset(skills: readonly SkillEntry[], storage: Pick<Storage, "setItem"> = localStorage) {
  storage.setItem(SKILL_PRESET_KEY, JSON.stringify(skills.map(({ id: _id, ...entry }) => entry)));
}

/** The skills a new character starts with: the preset if there is one, else every applicable catalogue skill at 0. */
export function startingSkills(catalogue: SkillCatalogue, character: Pick<CharacterSheet, "characterType" | "edad">,
  preset: readonly PresetEntry[] | undefined = readSkillPreset()): SkillEntry[] {
  const skills = new Map(catalogue.habilidades.map(s => [s.id, s]));
  const categories = new Set(catalogue.categorias.filter(c => !c.archivada).map(c => c.id));
  if (preset) {
    const seen = new Set<string>();
    return preset.filter(entry => {
      const key = entry.catalogo ?? `own:${entry.nombre?.trim().toLowerCase()}`;
      const valid = entry.catalogo ? skills.has(entry.catalogo) && !skills.get(entry.catalogo)!.archivada
        : !!entry.nombre?.trim() && !!entry.categoria && categories.has(entry.categoria);
      if (!valid || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(entry => ({ ...entry, valor: Math.min(5, Math.max(0, Math.round(entry.valor ?? 0))), id: newItemId() }));
  }
  return catalogue.habilidades
    .filter(s => !s.archivada && categories.has(s.categoria) && skillApplies(s, character))
    .map(s => ({ id: newItemId(), catalogo: s.id, valor: 0 }));
}

export function newCharacterSheet(type: CharacterType = "student", catalogue: SkillCatalogue = DEFAULT_SKILL_CATALOGUE,
  preset?: readonly PresetEntry[]): CharacterSheet {
  const student = type === "student";
  const base: CharacterSheet = {
    characterType: type,
    nombre: "", jugador: "", concepto: "", linaje: "", economia: "", varitaSintonia: "",
    ...(student ? { edad: 11, casa: "IRATI", curso: "1º", puestoClase: "" } : { casa: "" }),
    puntosDestino: 3, pxs: 0,
    estresFisico: 0, estresFisicoMax: student ? 3 : 5,
    estresMental: 0, estresMentalMax: student ? 3 : 5,
    estresSocial: 0, estresSocialMax: student ? 3 : 5,
    aspectosPersonales: [], complicaciones: [], aspectoTemporal: [],
    consecuenciasFisicas: [], consecuenciasMentales: [], consecuenciasSociales: [],
    conjuros: [], pociones: [], clubesList: [], equipoList: [], notasList: [], camposPersonalizados: [],
    avatarFit: "cover", galleryImages: [],
    ...(student ? {} : { adultWizardProfile: { role: "", institution: "", formerHouse: "", magicalFocus: "", reputation: "", isTeacher: false, teachingSubjects: [] } }),
  };
  return { ...base, habilidades: startingSkills(catalogue, base, preset ?? readSkillPreset()) };
}

export function newFamiliarSheet(): FamiliarSheet {
  return { nombre: "", especie: "", descripcion: "", imageFit: "cover", notasList: [], galleryImages: [] };
}

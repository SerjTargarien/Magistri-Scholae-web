// Blank new sheets in the server's model (R3.2). The server stores what the
// app sends and fills in nothing, so these defaults live here. They match the
// retired local app's apart from the fields the owner
// removed (motto, shield text, the old single-text fields) and the new skill
// catalogue: destiny 3, stress maximum 3 for students and 5 for adults, age 11,
// house Irati and year "1º" for students, every applicable default skill at 0.
import { DEFAULT_SKILL_CATALOGUE, skillApplies, type SkillCatalogue } from "./catalogue";
import { newItemId, type CharacterSheet, type CharacterType, type FamiliarSheet, type SkillEntry } from "./sheet";

/**
 * The skills a new character starts with: every applicable catalogue skill the
 * GM marked «inicial» (all, unless the GM turned some off), at 0. Only the GM
 * decides this, for the whole campaign (owner decision, 8 November 2026); the
 * old per-device preset is gone.
 */
export function startingSkills(catalogue: SkillCatalogue, character: Pick<CharacterSheet, "characterType" | "edad">): SkillEntry[] {
  const categories = new Set(catalogue.categorias.filter(c => !c.archivada).map(c => c.id));
  return catalogue.habilidades
    .filter(s => !s.archivada && s.inicial !== false && categories.has(s.categoria) && skillApplies(s, character))
    .map(s => ({ id: newItemId(), catalogo: s.id, valor: 0 }));
}

export function newCharacterSheet(type: CharacterType = "student", catalogue: SkillCatalogue = DEFAULT_SKILL_CATALOGUE): CharacterSheet {
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
    ...(student ? {} : { adultWizardProfile: { role: "", institution: "", formerHouse: "", reputation: "", isTeacher: false, teachingSubjects: [] } }),
  };
  return { ...base, habilidades: startingSkills(catalogue, base) };
}

export function newFamiliarSheet(): FamiliarSheet {
  return { nombre: "", especie: "", descripcion: "", imageFit: "cover", notasList: [], galleryImages: [] };
}

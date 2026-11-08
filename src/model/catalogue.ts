// The campaign's skill catalogue (R3.2; backend/domain/catalogue.py). A
// linked skill takes its name, category and position from the catalogue; a
// skill the player invents has its own name and a catalogue category.
import { API_SCHEMA } from "../contracts/fieldRegistry.generated";
import type { CharacterSheet, SkillEntry } from "./sheet";

export type Language = "es" | "en";

export interface CatalogueName { readonly es: string; readonly en?: string }
export interface SkillCategory {
  readonly id: string;
  readonly nombre: CatalogueName;
  readonly esoterica?: boolean;
  readonly archivada?: boolean;
}
export interface CatalogueSkill {
  readonly id: string;
  readonly nombre: CatalogueName;
  readonly categoria: string;
  /** Hidden for characters older than this, and for adult wizards (Magia intuitiva: 14). */
  readonly edadMaxima?: number;
  readonly archivada?: boolean;
}
export interface SkillCatalogue {
  readonly categorias: readonly SkillCategory[];
  readonly habilidades: readonly CatalogueSkill[];
}

/** The catalogue every new campaign starts with, from the server's contract. */
export const DEFAULT_SKILL_CATALOGUE: SkillCatalogue = API_SCHEMA.defaultSkillCatalogue;

export const catalogueName = (name: CatalogueName, lang: Language): string =>
  (lang === "en" && name.en) || name.es;

export function skillCategoryId(entry: SkillEntry, catalogue: SkillCatalogue): string | undefined {
  if (entry.catalogo) return catalogue.habilidades.find(s => s.id === entry.catalogo)?.categoria;
  return entry.categoria;
}

export function skillName(entry: SkillEntry, catalogue: SkillCatalogue, lang: Language): string {
  if (!entry.catalogo) return entry.nombre ?? "";
  const skill = catalogue.habilidades.find(s => s.id === entry.catalogo);
  return skill ? catalogueName(skill.nombre, lang) : "";
}

export function isEsoteric(entry: SkillEntry, catalogue: SkillCatalogue): boolean {
  const category = skillCategoryId(entry, catalogue);
  return !!catalogue.categorias.find(c => c.id === category)?.esoterica;
}

/** Whether a skill applies to this character (Magia intuitiva disappears above 14). */
export function skillApplies(skill: CatalogueSkill, character: Pick<CharacterSheet, "characterType" | "edad">): boolean {
  if (skill.edadMaxima === undefined) return true;
  if (character.characterType === "adult_wizard") return false;
  return character.edad === undefined || character.edad <= skill.edadMaxima;
}

/**
 * The character's skills grouped by catalogue category, in catalogue order:
 * linked skills in catalogue position, then the player's own skills in the
 * order they were added. Skills that do not apply to the character are left
 * out (their stored value is kept).
 */
export function skillsByCategory(skills: readonly SkillEntry[], catalogue: SkillCatalogue,
  character: Pick<CharacterSheet, "characterType" | "edad">): { category: SkillCategory; skills: SkillEntry[] }[] {
  const position = new Map(catalogue.habilidades.map((s, i) => [s.id, i]));
  const byId = new Map(catalogue.habilidades.map(s => [s.id, s]));
  return catalogue.categorias.filter(c => !c.archivada).map(category => {
    const linked = skills.filter(e => e.catalogo && byId.get(e.catalogo)?.categoria === category.id && skillApplies(byId.get(e.catalogo)!, character))
      .sort((a, b) => position.get(a.catalogo!)! - position.get(b.catalogo!)!);
    const own = skills.filter(e => !e.catalogo && e.categoria === category.id);
    return { category, skills: [...linked, ...own] };
  });
}

/**
 * The catalogue skills of a category this character could add with the + list:
 * not archived, applicable (Magia intuitiva only up to 14) and not yet on the sheet.
 */
export function missingSkills(skills: readonly SkillEntry[], catalogue: SkillCatalogue,
  character: Pick<CharacterSheet, "characterType" | "edad">, categoryId: string): CatalogueSkill[] {
  const linked = new Set(skills.map(e => e.catalogo).filter(Boolean));
  return catalogue.habilidades.filter(s => s.categoria === categoryId && !s.archivada && !linked.has(s.id) && skillApplies(s, character));
}

/**
 * A sheet's own (not catalogue) skills, as a comparable key. Only the GM creates,
 * renames, moves or removes them (owner decision, 8 November 2026; the server's
 * catalogue.own_skills); players change their values.
 */
export function ownSkillsKey(skills: readonly SkillEntry[] | undefined): string {
  return JSON.stringify((skills ?? []).filter(e => !e.catalogo).map(e => [e.id, e.nombre, e.categoria]).sort());
}

/**
 * The server's catalogue rules for a character's skills (backend/domain/catalogue.py):
 * links and categories exist, knowledge only in esoteric categories, no skill
 * twice. `only` limits the checks to the entries a save touched.
 */
export function checkSkills(skills: readonly SkillEntry[] | undefined, catalogue: SkillCatalogue, only?: ReadonlySet<string>):
  { code: string; path: string; rule: string } | undefined {
  const categories = new Map(catalogue.categorias.map(c => [c.id, c]));
  const linked = new Map(catalogue.habilidades.map(s => [s.id, s]));
  const catalogueNames = new Set(catalogue.habilidades.flatMap(s => Object.values(s.nombre)).filter(Boolean).map(n => n!.trim().toLocaleLowerCase()));
  const links = new Map<string, number>(), names = new Map<string, number>();
  for (const entry of skills ?? []) {
    if (entry.catalogo) links.set(entry.catalogo, (links.get(entry.catalogo) ?? 0) + 1);
    else if (entry.nombre) names.set(entry.nombre.trim().toLocaleLowerCase(), (names.get(entry.nombre.trim().toLocaleLowerCase()) ?? 0) + 1);
  }
  for (const entry of skills ?? []) {
    if (only && !only.has(entry.id)) continue;
    const path = `habilidades/${entry.id}`;
    let category: SkillCategory | undefined;
    if (entry.catalogo) {
      const skill = linked.get(entry.catalogo);
      if (!skill) return { code: "unknown_skill", path: `${path}/catalogo`, rule: "catalogue" };
      if (links.get(entry.catalogo)! > 1) return { code: "duplicate_skill", path, rule: "unique" };
      category = categories.get(skill.categoria);
    } else {
      category = categories.get(entry.categoria ?? "");
      if (!category) return { code: "unknown_category", path: `${path}/categoria`, rule: "catalogue" };
      const name = (entry.nombre ?? "").trim().toLocaleLowerCase();
      if (names.get(name)! > 1 || catalogueNames.has(name)) return { code: "duplicate_skill", path: `${path}/nombre`, rule: "unique" };
    }
    if (entry.conocimiento && !category?.esoterica) return { code: "knowledge_not_allowed", path: `${path}/conocimiento`, rule: "esotericOnly" };
  }
  return undefined;
}

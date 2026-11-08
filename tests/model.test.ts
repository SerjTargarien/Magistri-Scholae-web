// The account data model (R3.2): defaults, rules and the skill catalogue.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SKILL_CATALOGUE, isEsoteric, skillName, skillsByCategory, type SkillCatalogue } from "../src/model/catalogue";
import { newCharacterSheet, newFamiliarSheet, readSkillPreset, saveSkillPreset, SKILL_PRESET_KEY, startingSkills } from "../src/model/defaults";
import { checkSheet, nearLimit, ruleAt, usage } from "../src/model/rules";
import type { SkillEntry } from "../src/model/sheet";

const memory = () => {
  const store = new Map<string, string>();
  return { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), store };
};

test("a new student matches the old defaults and passes every rule once named", () => {
  const sheet = newCharacterSheet("student", DEFAULT_SKILL_CATALOGUE, undefined);
  assert.equal(sheet.characterType, "student");
  assert.deepEqual([sheet.edad, sheet.casa, sheet.curso, sheet.puntosDestino, sheet.pxs], [11, "IRATI", "1º", 3, 0]);
  assert.deepEqual([sheet.estresFisicoMax, sheet.estresMentalMax, sheet.estresSocialMax], [3, 3, 3]);
  assert.equal(sheet.adultWizardProfile, undefined);
  for (const removed of ["lema", "escudoText", "notas", "clubes", "equipo", "estresMentalConsecuencia"]) assert.ok(!(removed in sheet));
  const skills = sheet.habilidades!;
  assert.equal(skills.length, 48);
  assert.ok(skills.every(s => s.catalogo && s.valor === 0));
  assert.equal(new Set(skills.map(s => s.id)).size, 48);
  assert.ok(skills.some(s => s.catalogo === "magia-intuitiva"));
  assert.deepEqual(checkSheet("character", { ...sheet }), [{ path: "nombre", rule: "required" }]);
  assert.deepEqual(checkSheet("character", { ...sheet, nombre: "Luna" }), []);
});

test("a new adult wizard has stress maximums of 5, a profile and no Magia intuitiva", () => {
  const sheet = newCharacterSheet("adult_wizard", DEFAULT_SKILL_CATALOGUE, undefined);
  assert.deepEqual([sheet.estresFisicoMax, sheet.estresMentalMax, sheet.estresSocialMax], [5, 5, 5]);
  assert.equal(sheet.edad, undefined);
  assert.equal(sheet.casa, "");
  assert.deepEqual(sheet.adultWizardProfile?.teachingSubjects, []);
  assert.equal(sheet.habilidades!.length, 47);
  assert.ok(!sheet.habilidades!.some(s => s.catalogo === "magia-intuitiva"));
  assert.deepEqual(checkSheet("character", { ...sheet, nombre: "Silvio" }), []);
});

test("a new familiar passes every rule once named", () => {
  const sheet = newFamiliarSheet();
  assert.deepEqual(checkSheet("familiar", { ...sheet, nombre: "Ámbar", especie: "Mochuelo" }), []);
  assert.deepEqual(checkSheet("familiar", { ...sheet, nombre: "Ámbar" }), [{ path: "especie", rule: "required" }]);
});

test("the skill preset is kept per device in the new shape, and bad entries are dropped", () => {
  const storage = memory();
  const preset: SkillEntry[] = [
    { id: "a", catalogo: "atletismo", valor: 2 },
    { id: "b", nombre: "Cetrería", categoria: "fisicas", valor: 9 },
    { id: "c", catalogo: "missing", valor: 1 },
    { id: "d", nombre: "Sin categoría", valor: 1 },
    { id: "e", catalogo: "atletismo", valor: 4 },
  ];
  saveSkillPreset(preset, storage);
  assert.ok(!storage.store.get(SKILL_PRESET_KEY)!.includes('"id"'));
  const read = readSkillPreset(storage);
  const skills = startingSkills(DEFAULT_SKILL_CATALOGUE, { characterType: "student", edad: 11 }, read);
  assert.deepEqual(skills.map(({ id: _id, ...rest }) => rest), [
    { catalogo: "atletismo", valor: 2 },
    { nombre: "Cetrería", categoria: "fisicas", valor: 5 },
  ]);
  assert.equal(readSkillPreset(memory()), undefined);
  assert.equal(readSkillPreset({ getItem: () => "{broken" }), undefined);
});

test("skills are grouped in catalogue order, own skills last, and Magia intuitiva disappears above 14", () => {
  const skills: SkillEntry[] = [
    { id: "own", nombre: "Alquimia", categoria: "conocimientos-magicos", valor: 1 },
    { id: "astro", catalogo: "astronomia", valor: 2 },
    { id: "intuitiva", catalogo: "magia-intuitiva", valor: 3 },
    { id: "cabala", catalogo: "cabala", valor: 1, conocimiento: "medio" },
  ];
  const young = skillsByCategory(skills, DEFAULT_SKILL_CATALOGUE, { characterType: "student", edad: 14 });
  const knowledge = young.find(g => g.category.id === "conocimientos-magicos")!;
  assert.deepEqual(knowledge.skills.map(s => s.id), ["intuitiva", "astro", "own"]);
  const older = skillsByCategory(skills, DEFAULT_SKILL_CATALOGUE, { characterType: "student", edad: 15 });
  assert.deepEqual(older.find(g => g.category.id === "conocimientos-magicos")!.skills.map(s => s.id), ["astro", "own"]);
  assert.equal(young.map(g => g.category.id).join(), "fisicas,mentales,sociales,conocimientos-magicos,magia-elemental,magia-esoterica");
  assert.equal(skillName(skills[1], DEFAULT_SKILL_CATALOGUE, "en"), "Astronomy");
  assert.equal(skillName(skills[0], DEFAULT_SKILL_CATALOGUE, "en"), "Alquimia");
  assert.ok(isEsoteric(skills[3], DEFAULT_SKILL_CATALOGUE));
  assert.ok(!isEsoteric(skills[1], DEFAULT_SKILL_CATALOGUE));
});

test("a GM catalogue change moves linked skills on every sheet", () => {
  const moved: SkillCatalogue = { ...DEFAULT_SKILL_CATALOGUE,
    habilidades: DEFAULT_SKILL_CATALOGUE.habilidades.map(s => (s.id === "arte" ? { ...s, categoria: "sociales" } : s)) };
  const groups = skillsByCategory([{ id: "x", catalogo: "arte", valor: 1 }], moved, { characterType: "student", edad: 12 });
  assert.deepEqual(groups.find(g => g.category.id === "sociales")!.skills.map(s => s.id), ["x"]);
});

test("rules come from the server's field list", () => {
  assert.equal(ruleAt("character", "nombre")?.maxLength, 80);
  assert.deepEqual([ruleAt("character", "puntosDestino")?.minimum, ruleAt("character", "puntosDestino")?.maximum], [0, 10]);
  assert.equal(ruleAt("character", "pxs")?.maximum, 1000000);
  assert.equal(ruleAt("character", "habilidades/any-id/valor")?.maximum, 5);
  assert.deepEqual(ruleAt("character", "consecuenciasFisicas/any-id/gravedad")?.choices, ["leve", "moderada", "grave"]);
  assert.equal(ruleAt("character", "galleryImages")?.maxItems, 50);
  assert.equal(ruleAt("character", "lema"), undefined);
  assert.equal(usage(ruleAt("character", "nombre"), "x".repeat(72)), 0.9);
  assert.ok(nearLimit(ruleAt("character", "nombre"), "x".repeat(72)));
  assert.ok(!nearLimit(ruleAt("character", "nombre"), "x".repeat(71)));
  assert.ok(nearLimit(ruleAt("character", "galleryImages"), Array(45).fill({ id: "g" })));
});

test("checkSheet reports what the server would refuse", () => {
  const sheet = { ...newCharacterSheet("student", DEFAULT_SKILL_CATALOGUE, undefined), nombre: "Luna" };
  const problems = (data: Record<string, unknown>) => checkSheet("character", { ...sheet, ...data }).map(p => p.rule);
  assert.deepEqual(problems({ nombre: "x".repeat(81) }), ["maxLength"]);
  assert.deepEqual(problems({ estresFisico: 4 }), ["notAboveMaximum"]);
  assert.deepEqual(problems({ puntosDestino: 2.5 }), ["integer"]);
  assert.deepEqual(problems({ casa: "Hogwarts" }), ["choice"]);
  assert.deepEqual(problems({ lema: "old" }), ["unknownField"]);
  assert.deepEqual(problems({ habilidades: [{ id: "s", valor: 1 }] }), ["linkedOrOwn"]);
  assert.deepEqual(problems({ aspectosPersonales: [{ id: "a", value: " " }] }), ["required"]);
  assert.deepEqual(checkSheet("familiar", { nombre: "Ámbar", especie: "Mochuelo", notasList: [{ id: "n", titulo: "", contenido: "", fecha: 1 }] })
    .map(p => p.rule), ["requireOneOf"]);
});

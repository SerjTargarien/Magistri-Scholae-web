// The account data model (R3.2): defaults, rules and the skill catalogue.
import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogueName, DEFAULT_SKILL_CATALOGUE, isEsoteric, linkOwnSkills, missingSkills, nameClash, newSkillId, ownSkillsKey, skillName, skillsByCategory, type SkillCatalogue } from "../src/model/catalogue";
import { newCharacterSheet, newFamiliarSheet, startingSkills } from "../src/model/defaults";
import { checkSheet, nearLimit, ruleAt, usage } from "../src/model/rules";
import type { SkillEntry } from "../src/model/sheet";

test("a new student matches the old defaults and passes every rule once named", () => {
  const sheet = newCharacterSheet("student", DEFAULT_SKILL_CATALOGUE);
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
  const sheet = newCharacterSheet("adult_wizard", DEFAULT_SKILL_CATALOGUE);
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

test("the + list offers the category's catalogue skills the character lacks; own skills compare by id, name and category", () => {
  const student = { characterType: "student" as const, edad: 11 };
  const skills = startingSkills(DEFAULT_SKILL_CATALOGUE, student).filter(s => s.catalogo !== "empatia" && s.catalogo !== "magia-intuitiva");
  assert.deepEqual(missingSkills(skills, DEFAULT_SKILL_CATALOGUE, student, "sociales").map(s => s.id), ["empatia"]);
  assert.deepEqual(missingSkills(skills, DEFAULT_SKILL_CATALOGUE, student, "conocimientos-magicos").map(s => s.id), ["magia-intuitiva"]);
  assert.deepEqual(missingSkills(skills, DEFAULT_SKILL_CATALOGUE, { characterType: "student", edad: 15 }, "conocimientos-magicos"), []);
  assert.deepEqual(missingSkills(skills, DEFAULT_SKILL_CATALOGUE, student, "fisicas"), []);
  const own: SkillEntry[] = [{ id: "o", nombre: "Cetrería", categoria: "fisicas", valor: 1 }, { id: "l", catalogo: "duelo", valor: 2 }];
  assert.equal(ownSkillsKey(own), ownSkillsKey([{ ...own[0], valor: 4 }]));  // values may change
  assert.notEqual(ownSkillsKey(own), ownSkillsKey([{ ...own[0], nombre: "Halconería" }]));
  assert.notEqual(ownSkillsKey(own), ownSkillsKey([own[1]]));
  assert.equal(ownSkillsKey(undefined), "[]");
});

test("the GM's list: «inicial», new ids, unique names and own skills becoming links", () => {
  const catalogue: SkillCatalogue = {
    ...DEFAULT_SKILL_CATALOGUE,
    habilidades: DEFAULT_SKILL_CATALOGUE.habilidades.map(s => (s.id === "sigilo" ? { ...s, inicial: false } : s)),
  };
  const linked = startingSkills(catalogue, { characterType: "student", edad: 11 }).map(s => s.catalogo);
  assert.equal(linked.length, 47);
  assert.ok(!linked.includes("sigilo"));
  assert.equal(newSkillId("Cetrería del Norte!", catalogue), "cetreria-del-norte");
  assert.equal(newSkillId("Sigilo", catalogue), "sigilo-2");
  assert.equal(newSkillId("¡¡!!", catalogue), "habilidad");
  assert.equal(nameClash(catalogue), undefined);
  const clash = { ...catalogue, habilidades: [...catalogue.habilidades, { id: "x", nombre: { es: "EMPATÍA" }, categoria: "fisicas" }] };
  assert.equal(nameClash(clash)?.id, "x");
  const result = linkOwnSkills([
    { id: "a", catalogo: "duelo", valor: 1 }, { id: "b", nombre: "duelo", categoria: "fisicas", valor: 4 },
    { id: "c", nombre: "Cábala", categoria: "mentales", valor: 2, conocimiento: "medio" }, { id: "d", nombre: "Cetrería", categoria: "fisicas", valor: 1 },
  ], catalogue);
  assert.deepEqual(result, [
    { id: "a", catalogo: "duelo", valor: 4 },
    { id: "c", catalogo: "cabala", valor: 2, conocimiento: "medio" },
    { id: "d", nombre: "Cetrería", categoria: "fisicas", valor: 1 },
  ]);
  assert.equal(linkOwnSkills([{ id: "d", nombre: "Cetrería", categoria: "fisicas", valor: 1 }], catalogue), undefined);
  // A name in one language shows in both interfaces.
  assert.equal(catalogueName({ es: "Cetrería" }, "en"), "Cetrería");
  assert.equal(catalogueName({ en: "Falconry" }, "es"), "Falconry");
  assert.equal(catalogueName({ es: "Sigilo", en: "Stealth" }, "en"), "Stealth");
  assert.equal(catalogueName({ es: "", en: "" }, "es"), "");
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
  const sheet = { ...newCharacterSheet("student", DEFAULT_SKILL_CATALOGUE), nombre: "Luna" };
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

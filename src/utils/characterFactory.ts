/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Character, CharacterType, DEFAULT_SKILLS, Skill } from "../types";

export const getInitialDefaultSkills = (): Skill[] => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("fate_wizardry_custom_default_skills");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((sk: any) => ({
            nombre: sk.nombre,
            categoria: sk.categoria || "Asignaturas Troncales",
            valor: sk.valor || 0,
          }));
        }
      }
    }
  } catch (e) {
    console.error("Error reading custom default skills:", e);
  }
  return DEFAULT_SKILLS.map((sk) => ({ ...sk, valor: 0 }));
};

export const createDefaultCharacter = (
  type: CharacterType = "student"
): Omit<Character, "id" | "createdAt" | "updatedAt"> => {
  if (type === "adult_wizard") {
    return {
      characterType: "adult_wizard",
      nombre: "",
      jugador: "",
      edad: "",
      casa: "",
      curso: "",
      puestoClase: "",
      concepto: "",
      lema: "",
      escudoText: "",
      complicaciones: [],
      linaje: "",
      puntosDestino: 3,
      economia: "",
      familiar: "",
      varitaSintonia: "",
      estresFisico: 0,
      estresFisicoMax: 5,
      estresMental: 0,
      estresMentalMax: 5,
      estresSocial: 0,
      estresSocialMax: 5,
      consecuenciasFisicas: [],
      consecuenciasMentales: [],
      consecuenciasSociales: [],
      pxs: 0,
      aspectoTemporal: [],
      aspectosPersonales: [],
      habilidades: getInitialDefaultSkills(),
      conjuros: [],
      pociones: [],
      clubes: "",
      clubesList: [],
      equipo: "",
      equipoList: [],
      notas: "",
      notasList: [],
      avatarImage: "",
      avatarFit: "cover",
      galleryImages: [],
      camposPersonalizados: [],
      adultWizardProfile: {
        role: "",
        institution: "",
        isTeacher: false,
        teachingSubjects: [],
        formerHouse: "",
        magicalFocus: "",
        reputation: "",
      },
    };
  }

  return {
    characterType: "student",
    nombre: "",
    jugador: "",
    edad: "11 años",
    casa: "IRATI",
    curso: "1º",
    puestoClase: "",
    concepto: "",
    lema: "Creer es ver",
    escudoText: "IRATI",
    complicaciones: [],
    linaje: "",
    puntosDestino: 3,
    economia: "",
    familiar: "",
    varitaSintonia: "",
    estresFisico: 0,
    estresFisicoMax: 3,
    estresMental: 0,
    estresMentalMax: 3,
    estresSocial: 0,
    estresSocialMax: 3,
    consecuenciasFisicas: [],
    consecuenciasMentales: [],
    consecuenciasSociales: [],
    pxs: 0,
    aspectoTemporal: [],
    aspectosPersonales: [],
    habilidades: getInitialDefaultSkills(),
    conjuros: [],
    pociones: [],
    clubes: "",
    clubesList: [],
    equipo: "",
    equipoList: [],
    notas: "",
    notasList: [],
    avatarImage: "",
    avatarFit: "cover",
    galleryImages: [],
    camposPersonalizados: [],
  };
};

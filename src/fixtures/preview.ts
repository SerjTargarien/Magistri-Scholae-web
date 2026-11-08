import { createDefaultCharacter } from "../utils/characterFactory";
import { DEFAULT_SKILLS } from "../data/gameData";
import type { Character, Familiar } from "../types";
import type { ViewerProjection } from "../storage/contracts";

// Fictional content only. Override the factory's local skill preference so the
// mock never copies user-authored presets into its initial entity records.
export function previewData(): { characters: Character[]; familiars: Familiar[] } {
  const createdAt = 1_790_000_000_000;
  const character = (id: number, nombre: string, type: "student" | "adult_wizard"): Character => ({
    ...createDefaultCharacter(type), id, nombre, jugador: "Demo", createdAt, updatedAt: createdAt,
    habilidades: DEFAULT_SKILLS.map(s => ({ ...s })),
    notasList: [{ id: `demo-note-${id}`, titulo: "Demo journal / Diario de ejemplo", contenido: "Fictional academy expedition / Expedición ficticia de la academia", fecha: createdAt }],
  });
  return {
    characters: [
      { ...character(41, "Luna de Bruma", "student"), familiarId: "demo-owl" },
      character(87, "Profesor Silvio Niebla", "adult_wizard"),
    ],
    familiars: [
      { id: "demo-owl", nombre: "Ámbar", especie: "Mochuelo / Owl", descripcion: "Familiar ficticio / Fictional familiar", studentId: 41, createdAt, updatedAt: createdAt },
      { id: "demo-fox", nombre: "Chispa", especie: "Zorro / Fox", descripcion: "Sin vínculo / Unbonded", createdAt, updatedAt: createdAt },
    ],
  };
}

// Contract examples for future projected screens. The current full local editor
// does not consume these; client simulation is never production authorization.
export const sharedReaderExample: ViewerProjection<Character> = {
  kind: "viewer-projection", id: "demo-shared", revision: "demo-1",
  fields: { nombre: "Luna de Bruma" },
  capabilities: { readablePaths: ["nombre"], writablePaths: [] },
};

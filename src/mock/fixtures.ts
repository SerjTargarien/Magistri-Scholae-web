// Fictional demo data for the in-browser mock server (R3.3), in the server's
// model: two students, an adult wizard and two familiars, covering every tab.
// Nothing here is real data or a real account.
import { DEFAULT_SKILL_CATALOGUE } from "../model/catalogue";
import type { CharacterSheet, FamiliarSheet, SkillEntry } from "../model/sheet";
import { gradientPng } from "./png";

export type DemoRole = "gm" | "player" | "reader";

export interface DemoUser { id: string; username: string; displayName: string; role: DemoRole }
export interface DemoSheet {
  id: string;
  kind: "character" | "familiar";
  assignedPlayerId: string;
  archived: boolean;
  revision: number;
  fields: CharacterSheet | FamiliarSheet;
  bondId?: string;
  /** Paths only the GM sees (the GM can hide fields even from the assigned player). */
  gmOnly: string[];
  /** Paths the assigned player hides from shared readers. */
  restricted: string[];
  /** Users who may read this sheet without editing it. */
  sharedWith: string[];
  gmNote: { content: string; revision: number };
}

export const CAMPAIGN = { id: "demo-campaign", name: "Universo de demostración", policyRevision: 1 };

export const USERS: Record<DemoRole, DemoUser> = {
  gm: { id: "demo-gm", username: "demo_gm", displayName: "Directora (demo)", role: "gm" },
  player: { id: "demo-player", username: "demo_player", displayName: "Jugadora (demo)", role: "player" },
  reader: { id: "demo-reader", username: "demo_reader", displayName: "Lector (demo)", role: "reader" },
};

const CREATED = Date.UTC(2026, 8, 14, 9, 30);
const day = 24 * 60 * 60 * 1000;

/** Demo images by asset ID, generated once per page load. */
export function demoAssets(): Record<string, string> {
  return {
    "00000000-0000-4000-8000-000000000001": gradientPng(150, 200, [46, 16, 101], [180, 120, 40]),
    "00000000-0000-4000-8000-000000000002": gradientPng(160, 120, [10, 60, 70], [200, 190, 140]),
    "00000000-0000-4000-8000-000000000003": gradientPng(160, 120, [90, 20, 30], [230, 160, 90]),
    "00000000-0000-4000-8000-000000000004": gradientPng(120, 120, [20, 70, 50], [190, 170, 110]),
  };
}
const [PORTRAIT, GALLERY_A, GALLERY_B, OWL] = Object.keys(demoAssets());

function skills(values: Record<string, number>, extra: SkillEntry[] = []): SkillEntry[] {
  return [...DEFAULT_SKILL_CATALOGUE.habilidades.map(s => ({ id: `skill-${s.id}`, catalogo: s.id, valor: values[s.id] ?? 0 })), ...extra];
}
const LUNA_SKILLS = { investigar: 3, percepcion: 2, sigilo: 2, herbologia: 3, astronomia: 1, empatia: 1, "seres-magicos": 2 };
const text = (prefix: string, values: string[]) => values.map((value, i) => ({ id: `${prefix}-${i + 1}`, value }));

const luna: CharacterSheet = {
  characterType: "student", nombre: "Luna de Bruma", jugador: "Demo", edad: 15, casa: "IRATI", curso: "3", puestoClase: "Prefecta",
  concepto: "Rastreadora de nieblas con un cuaderno prohibido", linaje: "Familia de herbolarias del Pirineo", economia: "Modesta",
  varitaSintonia: "Avellano y pluma de mochuelo",
  complicaciones: text("comp", ["Debe un favor al bibliotecario", "Insomnio en luna llena"]),
  aspectosPersonales: text("asp", ["Curiosa hasta el exceso", "Lealtad a la casa Irati", "Mapas en la memoria"]),
  aspectoTemporal: text("temp", ["Empapada por la tormenta"]),
  puntosDestino: 3, pxs: 12, estresFisico: 1, estresFisicoMax: 3, estresMental: 2, estresMentalMax: 4, estresSocial: 0, estresSocialMax: 3,
  consecuenciasFisicas: [{ id: "cons-1", descripcion: "Tobillo torcido", gravedad: "leve" }],
  consecuenciasMentales: [{ id: "cons-2", descripcion: "Pesadillas recurrentes", gravedad: "moderada" }],
  consecuenciasSociales: [],
  habilidades: skills(LUNA_SKILLS),
  conjuros: [{ id: "spell-1", nombre: "Lumen", valor: 2, specialized: true }, { id: "spell-2", nombre: "Velo de niebla", valor: 1, specialized: false }],
  pociones: [{ id: "potion-1", nombre: "Tónico de vigilia", valor: 2, specialized: false }, { id: "potion-2", nombre: "Bálsamo de ortiga", valor: 1, specialized: true }],
  clubesList: [{ id: "club-1", nombre: "Club de Astronomía" }, { id: "club-2", nombre: "Coro de la Torre" }],
  equipoList: [{ id: "item-1", nombre: "Cuaderno de campo", cantidad: 1 }, { id: "item-2", nombre: "Frascos vacíos", cantidad: 6 },
    { id: "item-3", nombre: "Capa impermeable", cantidad: 1 }],
  notasList: [
    { id: "note-1", titulo: "Primera expedición", contenido: "Encontramos huellas de lince junto al lago helado.", fecha: CREATED + 3 * day },
    { id: "note-2", titulo: "Clase de herbología", contenido: "La mandrágora dorada solo florece de noche.", fecha: CREATED + 9 * day },
  ],
  camposPersonalizados: [{ id: "custom-1", nombre: "Patronus", valor: "Garza" }, { id: "custom-2", nombre: "Asignatura favorita", valor: "Astronomía" }],
  avatarImage: PORTRAIT, avatarFit: "cover",
  galleryImages: [{ id: "gallery-1", value: GALLERY_A }, { id: "gallery-2", value: GALLERY_B }],
};

const diego: CharacterSheet = {
  ...luna, nombre: "Diego Marés", casa: "CALANTES", curso: "2", puestoClase: "",
  concepto: "Navegante que habla con las corrientes", avatarImage: "", galleryImages: [], notasList: [],
};

const professor: CharacterSheet = {
  ...luna, characterType: "adult_wizard", nombre: "Profesor Silvio Niebla", edad: 52, casa: "", curso: "", puestoClase: "",
  concepto: "Archivero de la academia que sabe demasiado", avatarImage: "", galleryImages: [{ id: "gallery-1", value: GALLERY_B }],
  adultWizardProfile: { role: "Archivero mayor", institution: "Academia Magistri Scholae", isTeacher: true,
    teachingSubjects: text("subject", ["Historia del mundo mágico", "Cábala"]), formerHouse: "URANIA", magicalFocus: "Runas y archivos",
    reputation: "Respetado y temido" },
  habilidades: skills(LUNA_SKILLS).filter(s => s.catalogo !== "magia-intuitiva"),
};

const amber: FamiliarSheet = {
  nombre: "Ámbar", especie: "Mochuelo boreal", descripcion: "Observa en silencio desde la torre norte.", imagen: OWL, imageFit: "cover",
  notasList: [{ id: "fnote-1", titulo: "Vuelo nocturno", contenido: "Trajo una pluma plateada.", fecha: CREATED + 5 * day }],
  galleryImages: [{ id: "fgallery-1", value: GALLERY_A }],
};
const spark: FamiliarSheet = { nombre: "Chispa", especie: "Zorro", descripcion: "Sin vínculo todavía.", imageFit: "cover", notasList: [], galleryImages: [] };

const sheet = (id: string, kind: DemoSheet["kind"], fields: DemoSheet["fields"], extra: Partial<DemoSheet> = {}): DemoSheet => ({
  id, kind, fields: structuredClone(fields), assignedPlayerId: USERS.player.id, archived: false, revision: 1,
  gmOnly: [], restricted: [], sharedWith: [], gmNote: { content: "", revision: 0 }, ...extra,
});

/** A fresh copy of the demo world. */
export function demoSheets(): DemoSheet[] {
  return [
    // Luna: the GM keeps the family's money secret even from her player; her
    // player hides her lineage and journal from shared readers.
    sheet("demo-luna", "character", luna, { bondId: "demo-amber", gmOnly: ["economia"], restricted: ["linaje", "notasList"],
      sharedWith: [USERS.reader.id], gmNote: { content: "Sabe más de lo que cuenta sobre el lago.", revision: 1 } }),
    sheet("demo-diego", "character", diego),
    // A GM character: players cannot see it at all.
    sheet("demo-professor", "character", professor, { assignedPlayerId: USERS.gm.id, gmOnly: ["adultWizardProfile/reputation"] }),
    sheet("demo-amber", "familiar", amber, { bondId: "demo-luna" }),
    sheet("demo-spark", "familiar", spark),
  ];
}

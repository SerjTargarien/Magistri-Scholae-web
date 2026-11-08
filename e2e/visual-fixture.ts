// Fixed, fictional records for the screenshot tests (release R3.1). Every
// field the screens can show has a value, so a change to how any part of a
// screen renders shows up in a picture. The records are written in the shape
// the app stores today; R3.2 converts this file to the server's model, and the
// screenshots must stay identical through that change.
import { deflateSync, crc32 } from "node:zlib";
import type { Page } from "@playwright/test";
import { DEFAULT_SKILLS } from "../src/data/gameData";

const CREATED = Date.UTC(2026, 8, 14, 9, 30); // 14 Sep 2026, fixed
const day = 24 * 60 * 60 * 1000;

/** A deterministic diagonal two-colour gradient PNG, as a data URL. */
function gradientPng(width: number, height: number, from: [number, number, number], to: [number, number, number]) {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const k = (x / width + y / height) / 2;
      for (let c = 0; c < 3; c++) row[1 + x * 3 + c] = Math.round(from[c] + (to[c] - from[c]) * k);
    }
    rows.push(row);
  }
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

const portrait = gradientPng(150, 200, [46, 16, 101], [180, 120, 40]);
const galleryA = gradientPng(160, 120, [10, 60, 70], [200, 190, 140]);
const galleryB = gradientPng(160, 120, [90, 20, 30], [230, 160, 90]);
const owl = gradientPng(120, 120, [20, 70, 50], [190, 170, 110]);

const skills = (values: Record<string, number>) =>
  DEFAULT_SKILLS.map((skill, i) => ({ id: `skill-${i}`, ...skill, valor: values[skill.nombre] ?? 0 }));

const student = {
  id: 41,
  characterType: "student",
  nombre: "Luna de Bruma",
  jugador: "Demo",
  edad: "15",
  casa: "IRATI",
  curso: "3",
  puestoClase: "Prefecta",
  concepto: "Rastreadora de nieblas con un cuaderno prohibido",
  lema: "Creer es ver",
  escudoText: "Mochuelo sobre campo verde",
  complicaciones: ["Debe un favor al bibliotecario", "Insomnio en luna llena"],
  linaje: "Familia de herbolarias del Pirineo",
  puntosDestino: 3,
  economia: "Modesta",
  familiarId: "demo-owl",
  varitaSintonia: "Avellano y pluma de mochuelo",
  estresFisico: 1,
  estresFisicoMax: 3,
  estresMental: 2,
  estresMentalMax: 4,
  estresSocial: 0,
  estresSocialMax: 3,
  consecuenciasFisicas: ["Tobillo torcido"],
  consecuenciasMentales: ["Pesadillas recurrentes"],
  consecuenciasSociales: [],
  pxs: 12,
  aspectoTemporal: ["Empapada por la tormenta"],
  aspectosPersonales: ["Curiosa hasta el exceso", "Lealtad a la casa Irati", "Mapas en la memoria"],
  habilidades: skills({ Investigar: 3, Percepción: 2, Sigilo: 2, Herbología: 3, Astronomía: 1, Empatía: 1, "Seres mágicos": 2 }),
  conjuros: [
    { id: "spell-1", nombre: "Lumen", valor: 2, specialized: true },
    { id: "spell-2", nombre: "Velo de niebla", valor: 1, specialized: false },
  ],
  pociones: [
    { id: "potion-1", nombre: "Tónico de vigilia", valor: 2, specialized: false },
    { id: "potion-2", nombre: "Bálsamo de ortiga", valor: 1, specialized: true },
  ],
  clubes: "",
  clubesList: [{ id: "club-1", nombre: "Club de Astronomía" }, { id: "club-2", nombre: "Coro de la Torre" }],
  equipo: "",
  equipoList: [
    { id: "item-1", nombre: "Cuaderno de campo", cantidad: 1 },
    { id: "item-2", nombre: "Frascos vacíos", cantidad: 6 },
    { id: "item-3", nombre: "Capa impermeable", cantidad: 1 },
  ],
  notas: "",
  notasList: [
    { id: "note-1", titulo: "Primera expedición", contenido: "Encontramos huellas de lince junto al lago helado.", fecha: CREATED + 3 * day },
    { id: "note-2", titulo: "Clase de herbología", contenido: "La mandrágora dorada solo florece de noche.", fecha: CREATED + 9 * day },
  ],
  avatarImage: portrait,
  avatarFit: "cover",
  galleryImages: [galleryA, galleryB],
  camposPersonalizados: [{ nombre: "Patronus", valor: "Garza" }, { nombre: "Asignatura favorita", valor: "Astronomía" }],
  createdAt: CREATED,
  updatedAt: CREATED + 9 * day,
};

// A second student without a portrait, so the list shows the house placeholder.
const secondStudent = {
  ...student,
  id: 42,
  nombre: "Diego Marés",
  casa: "CALANTES",
  curso: "2",
  puestoClase: "",
  concepto: "Navegante que habla con las corrientes",
  lema: "El horizonte como límite",
  familiarId: undefined,
  avatarImage: "",
  galleryImages: [],
  notasList: [],
  createdAt: CREATED + day,
  updatedAt: CREATED + day,
};

const adult = {
  ...student,
  id: 87,
  characterType: "adult_wizard",
  nombre: "Profesor Silvio Niebla",
  edad: "52",
  casa: "",
  curso: "",
  puestoClase: "",
  concepto: "Archivero de la academia que sabe demasiado",
  lema: "",
  familiarId: undefined,
  adultWizardProfile: {
    role: "Archivero mayor",
    institution: "Academia Magistri Scholae",
    isTeacher: true,
    teachingSubjects: ["Historia del mundo mágico", "Cábala"],
    formerHouse: "URANIA",
    magicalFocus: "Runas y archivos",
    reputation: "Respetado y temido",
  },
  avatarImage: "",
  galleryImages: [galleryB],
  createdAt: CREATED + 2 * day,
  updatedAt: CREATED + 2 * day,
};

export const visualFixture = {
  characters: [student, secondStudent, adult],
  familiars: [
    {
      id: "demo-owl", nombre: "Ámbar", especie: "Mochuelo boreal", descripcion: "Observa en silencio desde la torre norte.",
      imagen: owl, imageFit: "cover", studentId: 41,
      notasList: [{ id: "fnote-1", titulo: "Vuelo nocturno", contenido: "Trajo una pluma plateada.", fecha: CREATED + 5 * day }],
      galleryImages: [galleryA], createdAt: CREATED, updatedAt: CREATED + 5 * day,
    },
    {
      id: "demo-fox", nombre: "Chispa", especie: "Zorro", descripcion: "Sin vínculo todavía.",
      createdAt: CREATED + day, updatedAt: CREATED + day,
    },
  ],
};

/** Replaces the mock database's records with the fixture. The app must have opened it once. */
export async function seedMockDatabase(page: Page) {
  await page.evaluate(async (data) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("MagistriScholaeMockDB");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["characters", "familiars"], "readwrite");
      const characters = tx.objectStore("characters");
      const familiars = tx.objectStore("familiars");
      characters.clear();
      familiars.clear();
      for (const record of data.characters) characters.put(JSON.parse(JSON.stringify(record)));
      for (const record of data.familiars) familiars.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, visualFixture);
}

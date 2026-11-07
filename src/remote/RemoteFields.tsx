import { useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/imageCompressor";
import { TRANSLATIONS, type Language } from "../localization";
import { remoteText } from "./text";
import { SaveQueue, pathValue } from "./saveQueue";

export type Spec = { type: string; choices?: readonly string[]; fields?: Record<string, Spec> };

export function RemoteFields({ queue, registry, lang, upload, locked }: {
  queue: SaveQueue; registry: Record<string, Spec>; lang: Language; upload: (path: string, data: string) => void; locked: boolean;
}) {
  const t = remoteText[lang];
  const base = TRANSLATIONS[lang] as unknown as Record<string, string>;
  const labels: Record<string, string> = { value: t.content, titulo: t.title, contenido: t.content, fecha: lang === "es" ? "Fecha" : "Date",
    avatarImage: lang === "es" ? "Retrato" : "Portrait", imagen: lang === "es" ? "Retrato" : "Portrait",
    galleryImages: base.galeria, adultWizardProfile: base.characterTypeAdultWizard,
    avatarFit: lang === "es" ? "Ajuste del retrato" : "Portrait fit", imageFit: lang === "es" ? "Ajuste de imagen" : "Image fit" };
  const extra: Record<string, [string, string]> = {
    estresFisicoMax: ["Maximum physical stress", "Estrés físico máximo"], estresMentalMax: ["Maximum mental stress", "Estrés mental máximo"], estresSocialMax: ["Maximum social stress", "Estrés social máximo"],
    characterType: ["Archetype", "Arquetipo"], role: ["Role", "Profesión"], institution: ["Institution", "Institución"], formerHouse: ["Former house", "Antigua casa"], magicalFocus: ["Magical focus", "Especialidad mágica"], reputation: ["Reputation", "Reputación"], isTeacher: ["Teacher", "Docente"], teachingSubjects: ["Teaching subjects", "Asignaturas impartidas"],
    valor: ["Value", "Valor"], categoria: ["Category", "Categoría"], conjuros: ["Spells", "Conjuros"], pociones: ["Potions", "Pociones"], clubesList: ["Clubs", "Clubes"], equipoList: ["Equipment", "Equipo"], cantidad: ["Quantity", "Cantidad"], camposPersonalizados: ["Custom fields", "Campos personalizados"], notasList: ["Journal", "Diario"], especie: ["Species", "Especie"], descripcion: ["Description", "Descripción"],
  };
  for (const [key, values] of Object.entries(extra)) labels[key] = values[lang === "en" ? 0 : 1];
  const fields = queue.fields;
  function render(spec: Spec, path: string, title: string): React.ReactNode {
    const value = pathValue(fields, path);
    const writable = queue.sheet.capabilities.writablePaths.includes(path);
    const id = `field-${path.replaceAll("/", "-")}`;
    if (spec.type === "object") {
      const children = Object.entries(spec.fields!).map(([key, s]) => render(s, `${path}/${key}`, labels[key] || base[key] || key));
      if (!children.some(Boolean)) return null;
      return <fieldset key={path} className="remote-section"><legend>{title}</legend>{children}</fieldset>;
    }
    if (spec.type === "items") {
      const entries = (Array.isArray(value) ? value : []) as Record<string, any>[];
      const addable = queue.sheet.capabilities.collectionPaths.includes(path);
      if (!entries.length && !addable && value === undefined) return null;
      return <fieldset key={path} className="remote-section"><legend>{title}</legend>{entries.map(entry => <div className="remote-item" key={entry.id}>
        {Object.entries(spec.fields!).map(([key, s]) => render(s, `${path}/${entry.id}/${key}`, labels[key] || base[key] || key))}
        {queue.sheet.capabilities.removablePaths.includes(`${path}/${entry.id}`) && <button disabled={locked || queue.busy} onClick={() => queue.edit(`${path}/${entry.id}`, null)}>{t.remove}</button>}
      </div>)}{addable && <button disabled={locked || queue.busy} onClick={() => {
        const entry = Object.fromEntries(Object.entries(spec.fields!).map(([key, s]) => [key, s.type === "number" ? (key === "fecha" ? Date.now() : 0) : s.type === "boolean" ? false : s.choices?.[0] ?? ""]));
        queue.edit(`${path}/${crypto.randomUUID()}`, entry);
      }}>{t.add} {title}</button>}</fieldset>;
    }
    if (value === undefined && !writable) return null;
    if (spec.type === "media") return <ImageField key={path} path={path} value={value} title={title} lang={lang} disabled={locked || queue.busy || !writable} upload={upload} remove={() => queue.edit(path, null)} />;
    return <label key={path} htmlFor={id} className="remote-field"><span>{title}{!writable ? ` · ${t.readonly}` : ""}</span>
      {spec.choices ? <select id={id} disabled={locked || !writable} value={value ?? ""} onChange={e => queue.edit(path, e.target.value)}>
        {value === undefined && <option value="">—</option>}{spec.choices.map(choice => <option key={choice} value={choice}>{({ student: base.characterTypeStudent, adult_wizard: base.characterTypeAdultWizard, cover: lang === "es" ? "Rellenar" : "Fill", contain: lang === "es" ? "Ajustar" : "Fit" } as Record<string, string>)[choice] || base[choice] || choice}</option>)}
      </select> : spec.type === "boolean" ? <input id={id} type="checkbox" disabled={locked || !writable} checked={value === true} onChange={e => queue.edit(path, e.target.checked)} />
        : spec.type === "number" && path.endsWith("/fecha") ? <input id={id} type="datetime-local" disabled={locked || !writable} value={typeof value === "number" ? new Date(value - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} onChange={e => { const timestamp = new Date(e.target.value).getTime(); if (Number.isFinite(timestamp)) queue.edit(path, timestamp); }} />
        : spec.type === "number" ? <input id={id} type="number" disabled={locked || !writable} value={value ?? ""} onChange={e => { if (e.target.value !== "" && Number.isFinite(e.target.valueAsNumber)) queue.edit(path, e.target.valueAsNumber); }} />
          : <textarea id={id} rows={path.includes("contenido") || path === "notas" ? 4 : 1} disabled={locked || !writable} value={value ?? ""} onChange={e => queue.edit(path, e.target.value)} />}
    </label>;
  }
  return <div>{Object.entries(registry).map(([key, spec]) => render(spec, key, labels[key] || base[key] || key))}</div>;
}

function ImageField({ path, value, title, lang, disabled, upload, remove }: {
  path: string; value: unknown; title: string; lang: Language; disabled: boolean; upload: (path: string, data: string) => void; remove: () => void;
}) {
  const t = remoteText[lang];
  const [source, setSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<{ x: number; y: number; width: number; height: number }>();
  const [error, setError] = useState("");
  return <div className="remote-field"><span>{title}</span>
    {typeof value === "string" && value && <img className="remote-image" src={`/api/v1/assets/${encodeURIComponent(value)}`} alt={title} />}
    {!disabled && <><label>{t.upload}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => {
      const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
      if (file.size > 4 * 1024 * 1024) { setError(t.imageTooLarge); return; }
      const reader = new FileReader(); reader.onload = () => { setSource(String(reader.result)); setCrop({ x: 0, y: 0 }); setZoom(1); setError(""); };
      reader.readAsDataURL(file);
    }} /></label>{!!value && <button onClick={remove}>{t.remove}</button>}</>}
    {source && !disabled && <div role="dialog" aria-label={t.crop} className="remote-crop"><p>{t.cropHelp}</p><div className="remote-crop-area"><Cropper image={source} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)} /></div>
      <input aria-label="Zoom" type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} />
      <button onClick={async () => { if (!area) return; try { const result = await getCroppedImg(source, area); upload(path, result.split(",")[1]); setSource(""); } catch { setError(t.failed); } }}>{t.crop}</button>
      <button onClick={() => setSource("")}>{t.cancel}</button></div>}{error && <p role="alert">{error}</p>}
  </div>;
}

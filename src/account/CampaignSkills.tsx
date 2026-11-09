// «Habilidades de la campaña» (C2, owner decision of 8 November 2026): the GM's
// screen for the campaign's skill list. A campaign is the GM's universe, so both
// tables share it (decision 9). The GM renames skills, marks which ones new
// characters start with («Inicial») and adds skills, always in the language of
// their interface (never asked for the other one); the changes are saved together. Nothing is deleted here; moving skills
// between categories, reordering, archiving and new categories stay in R4.
import { useEffect, useState } from "react";
import { ArrowLeft, ListChecks, Plus, Save, Undo2 } from "lucide-react";
import { TRANSLATIONS, type Language } from "../localization";
import { catalogueName, nameClash, newSkillId, type SkillCatalogue } from "../model/catalogue";
import { Switch } from "../components/Toggle";

export const CAMPAIGN_SKILLS_TEXT: Record<Language, {
  title: string; intro: string; initial: string; initialHint: string; newSkill: string; add: string;
  save: string; discard: string; unsaved: string; duplicate: string; blank: string; ageLimit: string;
  saved: string; conflict: string; failed: string; open: string; openHint: string;
}> = {
  es: {
    title: "Habilidades de la campaña",
    intro: "La lista de habilidades de este universo, compartida por todas sus mesas. Las marcadas como «Inicial» aparecen en los personajes nuevos; los jugadores añaden las demás con «+ Añadir de la lista». Solo tú puedes cambiar esta lista.",
    initial: "Inicial",
    initialHint: "Los personajes nuevos empiezan con esta habilidad",
    newSkill: "Nueva habilidad en esta categoría…",
    add: "Añadir",
    save: "Guardar cambios",
    discard: "Descartar",
    unsaved: "Hay cambios sin guardar.",
    duplicate: "Hay dos habilidades con el mismo nombre: «{name}».",
    blank: "Cada habilidad necesita un nombre.",
    ageLimit: "hasta {age} años",
    saved: "Lista de habilidades guardada.",
    conflict: "Otra persona cambió la lista de habilidades; se ha vuelto a cargar. Repite el cambio.",
    failed: "No se pudo guardar la lista de habilidades.",
    open: "Abrir la lista",
    openHint: "Qué habilidades tiene este universo y con cuáles empiezan los personajes nuevos.",
  },
  en: {
    title: "Campaign skills",
    intro: "This universe's skill list, shared by all its tables. Skills marked «Starting» appear on new characters; players add the rest with «+ Add from the list». Only you can change this list.",
    initial: "Starting",
    initialHint: "New characters start with this skill",
    newSkill: "New skill in this category…",
    add: "Add",
    save: "Save changes",
    discard: "Discard",
    unsaved: "There are unsaved changes.",
    duplicate: "Two skills share the name «{name}».",
    blank: "Every skill needs a name.",
    ageLimit: "up to age {age}",
    saved: "Skill list saved.",
    conflict: "Someone else changed the skill list; it has been reloaded. Please repeat your change.",
    failed: "The skill list could not be saved.",
    open: "Open the list",
    openHint: "Which skills this universe has, and which ones new characters start with.",
  },
};

export interface CampaignSkillsProps {
  lang: Language;
  catalogue: SkillCatalogue;
  /** Saves the whole list; resolves false when it was not saved (the app shows why). */
  onSave: (next: SkillCatalogue) => Promise<boolean>;
  onBack: () => void;
}

const inputClass = "w-full text-xs bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none";

export function CampaignSkills({ lang, catalogue, onSave, onBack }: CampaignSkillsProps) {
  const t = TRANSLATIONS[lang];
  const s = CAMPAIGN_SKILLS_TEXT[lang];
  const [draft, setDraft] = useState<SkillCatalogue>(catalogue);
  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [warnUnsaved, setWarnUnsaved] = useState(false);
  // A save, or a reload after someone else's change, replaces the draft.
  useEffect(() => { setDraft(catalogue); setWarnUnsaved(false); }, [catalogue]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(catalogue);
  const clash = nameClash(draft);
  const blank = draft.habilidades.some(skill => !catalogueName(skill.nombre, lang).trim());
  const problem = blank ? s.blank : clash ? s.duplicate.replace("{name}", catalogueName(clash.nombre, lang)) : "";

  const rename = (id: string, name: string) =>
    setDraft(d => ({ ...d, habilidades: d.habilidades.map(skill => (skill.id === id ? { ...skill, nombre: { ...skill.nombre, [lang]: name } } : skill)) }));
  const setInitial = (id: string, inicial: boolean) =>
    setDraft(d => ({ ...d, habilidades: d.habilidades.map(skill => (skill.id === id ? { ...skill, inicial } : skill)) }));
  const add = (categoryId: string) => {
    const name = newNames[categoryId]?.trim();
    if (!name) return;
    setDraft(d => ({ ...d, habilidades: [...d.habilidades, { id: newSkillId(name, d), nombre: { [lang]: name }, categoria: categoryId }] }));
    setNewNames(prev => ({ ...prev, [categoryId]: "" }));
  };
  const save = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-28" id="campaign-skills-screen">
      <div className="flex justify-between items-center mb-6 border-b border-violet-500/15 pb-4 gap-3">
        <button
          id="btn-campaign-skills-back"
          onClick={() => (dirty ? setWarnUnsaved(true) : onBack())}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <ListChecks className="w-5 h-5 text-amber-500 shrink-0" />
          <h1 className="font-magic text-base md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber text-right">{s.title}</h1>
        </div>
      </div>

      <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-6">{s.intro}</p>

      <div className="space-y-6">
        {draft.categorias.filter(c => !c.archivada).map(category => (
          <div key={category.id} className="glass-panel p-5 rounded-xl border border-violet-500/15" id={`catalogue-category-${category.id}`}>
            <h2 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-3">
              {catalogueName(category.nombre, lang)}
            </h2>
            <div className="space-y-2">
              {draft.habilidades.filter(skill => skill.categoria === category.id && !skill.archivada).map(skill => (
                <div key={skill.id} id={`catalogue-skill-${skill.id}`}
                  className="grid grid-cols-[auto_1fr] gap-3 items-center bg-neutral-950/30 border border-neutral-900 rounded-lg px-3 py-2">
                  <span title={s.initialHint}>
                    <Switch id={`chk-initial-${skill.id}`} inline checked={skill.inicial !== false}
                      onChange={on => setInitial(skill.id, on)}
                      label={s.initial} labelClassName="text-[10px] font-mono uppercase tracking-wider text-neutral-300" />
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      id={`input-skill-name-${skill.id}`}
                      type="text"
                      maxLength={60}
                      value={skill.nombre[lang] ?? ""}
                      placeholder={catalogueName(skill.nombre, lang)}
                      onChange={e => rename(skill.id, e.target.value)}
                      className={inputClass}
                    />
                    {skill.edadMaxima !== undefined && (
                      <span className="text-[9px] text-neutral-500 font-mono">{s.ageLimit.replace("{age}", String(skill.edadMaxima))}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3 max-w-md">
              <input
                id={`input-new-catalogue-skill-${category.id}`}
                type="text"
                maxLength={60}
                placeholder={s.newSkill}
                value={newNames[category.id] ?? ""}
                onChange={e => setNewNames(prev => ({ ...prev, [category.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(category.id); } }}
                className={inputClass}
              />
              <button
                id={`btn-add-catalogue-skill-${category.id}`}
                type="button"
                onClick={() => add(category.id)}
                className="px-3 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-800 text-violet-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span className="text-[10px]">{s.add}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {(dirty || problem) && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 border-t border-amber-500/30 px-4 py-3" id="campaign-skills-bar">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2">
            <p className={`text-xs font-mono flex-1 ${problem || warnUnsaved ? "text-rose-300" : "text-amber-200"}`}>{problem || s.unsaved}</p>
            <div className="flex gap-2">
              <button
                id="btn-campaign-skills-discard"
                type="button"
                onClick={() => { setDraft(catalogue); setWarnUnsaved(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-mono cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {s.discard}
              </button>
              <button
                id="btn-campaign-skills-save"
                type="button"
                disabled={!dirty || !!problem || saving}
                onClick={() => void save()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold font-mono cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {s.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

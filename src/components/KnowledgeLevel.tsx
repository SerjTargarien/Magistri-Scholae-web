// The knowledge level of an esoteric skill (owner decision, 8 November 2026):
// none, básico (alteración), medio (destrucción) or avanzado (creación),
// independent of the skill's value. Set by whoever can edit the sheet, like the
// value. Shared by the creation form and the character sheet.
import type { Language } from "../localization";
import type { EsotericKnowledge } from "../model/sheet";

export const KNOWLEDGE_LEVELS: readonly EsotericKnowledge[] = ["basico", "medio", "avanzado"];

const TEXT: Record<Language, { label: string; none: string } & Record<EsotericKnowledge, string>> = {
  es: { label: "Conocimiento", none: "Sin conocimiento", basico: "Básico (alteración)", medio: "Medio (destrucción)", avanzado: "Avanzado (creación)" },
  en: { label: "Knowledge", none: "No knowledge", basico: "Basic (alteration)", medio: "Medium (destruction)", avanzado: "Advanced (creation)" },
};

const TAG: Record<EsotericKnowledge, string> = {
  basico: "border-sky-500/30 text-sky-300 bg-sky-950/40",
  medio: "border-amber-500/30 text-amber-300 bg-amber-950/40",
  avanzado: "border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-950/40",
};

export function KnowledgeLevel({ skillId, value, editable, lang, onChange }: {
  skillId: string; value?: EsotericKnowledge; editable: boolean; lang: Language; onChange: (level: EsotericKnowledge | undefined) => void;
}) {
  const t = TEXT[lang];
  if (editable)
    return (
      <select
        id={`select-knowledge-${skillId}`}
        aria-label={t.label}
        value={value ?? ""}
        onChange={e => onChange((e.target.value || undefined) as EsotericKnowledge | undefined)}
        className="w-full text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-violet-500 cursor-pointer"
      >
        <option value="">{t.none}</option>
        {KNOWLEDGE_LEVELS.map(level => <option key={level} value={level}>{t[level]}</option>)}
      </select>
    );
  if (!value) return null;
  return (
    <span id={`tag-knowledge-${skillId}`} title={t.label}
      className={`inline-block text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 ${TAG[value]}`}>
      {t[value]}
    </span>
  );
}

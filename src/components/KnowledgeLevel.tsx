// The knowledge level of an esoteric skill (owner decision, 8 November 2026):
// none, básico (alteración), medio (destrucción) or avanzado (creación),
// independent of the skill's value. Set by whoever can edit the sheet, like the
// value. Shared by the creation form and the character sheet.
import type { Language } from "../localization";
import type { EsotericKnowledge } from "../model/sheet";
import { TagMenu } from "./TagMenu";

export const KNOWLEDGE_LEVELS: readonly EsotericKnowledge[] = ["basico", "medio", "avanzado"];

// The tag shows the level's word; what it allows (alteración, destrucción,
// creación) is a second line in the menu only (owner, 9 November 2026).
type Texts = { label: string; none: string; empty: string } & Record<EsotericKnowledge, string> & Record<`${EsotericKnowledge}Hint`, string>;
const TEXT: Record<Language, Texts> = {
  es: { label: "Conocimiento", none: "Sin conocimiento", empty: "Ninguno", basico: "Básico", medio: "Medio", avanzado: "Avanzado",
    basicoHint: "Alteración", medioHint: "Destrucción", avanzadoHint: "Creación" },
  en: { label: "Knowledge", none: "No knowledge", empty: "None", basico: "Basic", medio: "Medium", avanzado: "Advanced",
    basicoHint: "Alteration", medioHint: "Destruction", avanzadoHint: "Creation" },
};

const TONE: Record<EsotericKnowledge, string> = {
  basico: "border-sky-500/30 text-sky-300 bg-sky-950/40",
  medio: "border-amber-500/30 text-amber-300 bg-amber-950/40",
  avanzado: "border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-950/40",
};

/** A tag menu (product-design.md, Controls) for whoever may edit, a plain tag for readers. */
export function KnowledgeLevel({ skillId, value, editable, lang, onChange }: {
  skillId: string; value?: EsotericKnowledge; editable: boolean; lang: Language; onChange: (level: EsotericKnowledge | undefined) => void;
}) {
  const t = TEXT[lang];
  return (
    <TagMenu<EsotericKnowledge | "">
      id={editable ? `btn-knowledge-${skillId}` : `tag-knowledge-${skillId}`}
      title={t.label}
      value={value}
      emptyLabel={t.empty}
      editable={editable}
      options={[{ value: "", label: t.none }, ...KNOWLEDGE_LEVELS.map((level) => ({ value: level, label: t[level], hint: t[`${level}Hint`], tone: TONE[level] }))]}
      onChange={(level) => onChange(level || undefined)}
    />
  );
}

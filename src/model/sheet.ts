// The data model of a character and a familiar, exactly as the server stores
// it (R3.2). Every type here is derived from the server's field list
// (fieldRegistry.generated.ts), so a field is declared once, in
// backend/domain/fields.py. The old hand-written types in src/types.ts stay
// until each screen moves to this model (R3.4) and are deleted in R3.6.
//
// Every field is optional: what the server sends is the viewer's projection,
// and a hidden field is absent, never blank. Capabilities say whether an
// absent field is hidden or simply empty.
import type { ServerFields } from "../contracts/api-v1";

export type CharacterSheet = ServerFields<"character">;
export type FamiliarSheet = ServerFields<"familiar">;

type Entry<T> = T extends readonly (infer E)[] ? E : never;
type CharacterList<K extends keyof CharacterSheet> = Entry<NonNullable<CharacterSheet[K]>>;

export type CharacterType = NonNullable<CharacterSheet["characterType"]>;
export type House = NonNullable<CharacterSheet["casa"]>;
export type ImageFit = NonNullable<CharacterSheet["avatarFit"]>;
export type AdultWizardProfile = NonNullable<CharacterSheet["adultWizardProfile"]>;

/** Aspects, complications, temporary aspects and subjects taught: one text each. */
export type TextEntry = CharacterList<"aspectosPersonales">;
export type ConsequenceEntry = CharacterList<"consecuenciasFisicas">;
export type Severity = NonNullable<ConsequenceEntry["gravedad"]>;
export type SkillEntry = CharacterList<"habilidades">;
export type EsotericKnowledge = NonNullable<SkillEntry["conocimiento"]>;
export type SpellEntry = CharacterList<"conjuros">;
export type PotionEntry = CharacterList<"pociones">;
export type ClubEntry = CharacterList<"clubesList">;
export type EquipmentEntry = CharacterList<"equipoList">;
export type CustomFieldEntry = CharacterList<"camposPersonalizados">;
export type JournalEntry = CharacterList<"notasList">;
export type GalleryEntry = CharacterList<"galleryImages">;
export type FamiliarJournalEntry = Entry<NonNullable<FamiliarSheet["notasList"]>>;

/** A new list entry's permanent ID. It matches the server's item ID pattern. */
export const newItemId = (): string => crypto.randomUUID();

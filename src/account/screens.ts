// What the account app (src/App.tsx) gives each screen (R3.4 switch).
// Screens read the server's model (src/model/sheet.ts) through a SheetStore
// and change it only through store.edit(path, value) and the callbacks below.
// They never build whole records for existing sheets.
import type { ApiSheetProjection } from "../contracts/api-v1";
import type { Language } from "../localization";
import type { SkillCatalogue } from "../model/catalogue";
import type { CharacterSheet, CharacterType, FamiliarSheet } from "../model/sheet";
import type { SheetStore } from "../store/sheetStore";

export type Toast = (type: "success" | "error", text: string) => void;

/**
 * Uploads an image (a data URL from the cropper or compressor) into a media
 * field of the open sheet, e.g. "avatarImage", "imagen" or
 * "galleryImages/<id>/value" (a gallery entry must exist first: create it with
 * store.edit("galleryImages/<id>", { value: "" })). Resolves once the store
 * holds the server's new copy; rejects with the server's error.
 */
export type UploadImage = (path: string, dataUrl: string) => Promise<void>;

export interface CharacterDetailProps {
  lang: Language;
  /** The open character. Re-rendered by the app whenever the store changes. */
  store: SheetStore;
  catalogue: SkillCatalogue;
  /** Familiars this viewer can see, for the bonded-familiar card and the bond picker. */
  familiars: ApiSheetProjection[];
  onBack: () => void;
  /** GM only; absent for everyone else (no one deletes). */
  onArchive?: () => void;
  onSelectFamiliar?: (familiarId: string) => void;
  /** Bonds this character to a familiar, or unbonds it (null). */
  onBondFamiliar?: (familiarId: string | null) => Promise<void>;
  /** GM only: adds a typed skill to the campaign's list; resolves with its catalogue id. */
  onAddCatalogueSkill?: (categoryId: string, name: string) => Promise<string>;
  onOpenCreateFamiliar?: () => void;
  onUploadImage: UploadImage;
}

export interface CharacterFormProps {
  lang: Language;
  newCharacterType: CharacterType;
  catalogue: SkillCatalogue;
  /** The viewer is the campaign's GM: only the GM types new skills (players pick from the catalogue). */
  isGM?: boolean;
  /** GM only: adds a typed skill to the campaign's list; resolves with its catalogue id. */
  onAddCatalogueSkill?: (categoryId: string, name: string) => Promise<string>;
  /**
   * Creates the character. `avatar` is the cropped portrait (data URL), uploaded
   * after creation; `familiarId` is a familiar created from the form, bonded after.
   * Rejects with the server's error (ApiFailure, with details naming the rule).
   */
  onSave: (fields: CharacterSheet, avatar?: string, familiarId?: string) => Promise<void>;
  /** Creates a familiar from the form's familiar dialog; resolves with its id and name. */
  onCreateFamiliar: (fields: FamiliarSheet, image?: string) => Promise<{ id: string; nombre: string }>;
  onCancel: () => void;
}

export interface FamiliarDetailProps {
  lang: Language;
  /** The open familiar. Re-rendered by the app whenever the store changes. */
  store: SheetStore;
  /** Characters this viewer can see, for the bonded-master card and the bond picker. */
  characters: ApiSheetProjection[];
  onBack: () => void;
  /** GM only; absent for everyone else. */
  onArchive?: () => void;
  onSelectCharacter: (characterId: string) => void;
  /** Bonds this familiar to a character, or unbonds it (null). */
  onBondMaster: (characterId: string | null) => Promise<void>;
  onUploadImage: UploadImage;
  onShowToast: Toast;
}

export interface FamiliarEditorProps {
  lang: Language;
  /** Creates a new familiar (the editor only creates; existing familiars are edited on their sheet); `image` (data URL) is uploaded after creation. Resolves with its id. */
  onCreate: (fields: FamiliarSheet, image?: string) => Promise<string>;
  onUploadImage: UploadImage;
  onBack: () => void;
  onShowToast: Toast;
  /** Rendered as a dialog inside the creation form (today's isModal layout). */
  isModal?: boolean;
}

export interface CharacterListProps {
  lang: Language;
  characters: ApiSheetProjection[];
  familiars: ApiSheetProjection[];
  onSelectCharacter: (id: string) => void;
  onSelectFamiliar: (id: string) => void;
  onAddCharacter: () => void;
  onOpenSettings: () => void;
  onShowToast: Toast;
}

export interface AccountInfo {
  displayName: string;
  username: string;
  campaignId: string;
  campaigns: { id: string; name: string }[];
  onChangeCampaign: (campaignId: string) => void;
  onLogout: () => void;
  /** The campaign's GM only: opens «Habilidades de la campaña». */
  onOpenCampaignSkills?: () => void;
}

export interface SettingsScreenProps {
  lang: Language;
  /** Absent while the interface is Spanish only (the language card is hidden). */
  onLanguageChange?: (lang: Language) => void;
  onBack: () => void;
  account: AccountInfo;
}

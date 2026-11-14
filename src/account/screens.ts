// What the account app (src/App.tsx) gives each screen (R3.4 switch).
// Screens read the server's model (src/model/sheet.ts) through a SheetStore
// and change it only through store.edit(path, value) and the callbacks below.
// They never build whole records for existing sheets.
import type { ApiSheetProjection, ApiTable } from "../contracts/api-v1";
import type { FilterState } from "../components/FilterBar";
import type { SheetStatusProps } from "../components/SheetStatusBar";
import type { Language } from "../localization";
import type { SkillCatalogue } from "../model/catalogue";
import type { CharacterSheet, CharacterType, FamiliarSheet } from "../model/sheet";
import type { SheetStore } from "../store/sheetStore";
import type { NotesApi } from "./notes";

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
  /** The viewer's private notes about this sheet («Notas privadas», below the Bitácora). */
  notes?: NotesApi;
  /** The Máster only: the campaign's partidas, and placing this character in one (or none) (R4 b). */
  partidas?: ApiTable[];
  onSetPartida?: (tableId: string | null) => Promise<void>;
  /** Drafts, proposals and the active switch (R4 c). */
  status?: SheetStatusProps;
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
  /** Creates the character; a familiar confirmed in the form's dialog is created and linked with it (nothing is created on «Cancelar»). */
  onSave: (fields: CharacterSheet, avatar?: string, familiar?: PendingFamiliar) => Promise<void>;
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
  /** The viewer's private notes about this familiar («Notas privadas», below its notes). */
  notes?: NotesApi;
  /** Drafts, proposals and the active switch (R4 c). */
  status?: SheetStatusProps;
}

/** A familiar confirmed in the creation form's dialog, created only when the character is saved. */
export interface PendingFamiliar { fields: FamiliarSheet; image?: string }

export interface FamiliarEditorProps {
  lang: Language;
  /** Creates a new familiar (the editor only creates; existing familiars are edited on their sheet); `image` (data URL) is uploaded after creation. Resolves with its id. */
  onCreate: (fields: FamiliarSheet, image?: string) => Promise<string>;
  onUploadImage: UploadImage;
  onBack: () => void;
  onShowToast: Toast;
  /** Rendered as a dialog inside the creation form (today's isModal layout). */
  isModal?: boolean;
  /** Values to start from (the creation form's dialog, reopened). */
  initial?: PendingFamiliar;
  /** The save button's label, when it does not save (the creation form's «Confirmar familiar»). */
  confirmLabel?: string;
}

export interface CharacterListProps {
  lang: Language;
  characters: ApiSheetProjection[];
  familiars: ApiSheetProjection[];
  onSelectCharacter: (id: string) => void;
  onSelectFamiliar: (id: string) => void;
  onAddCharacter: () => void;
  onOpenSettings: () => void;
  /** «Mis notas»: all of the viewer's private notes. */
  onOpenNotes?: () => void;
  /** The campaign's Máster only: «Habilidades de la campaña» (owner, 13 November 2026; moves to the Biblioteca in R5). */
  onOpenCampaignSkills?: () => void;
  /** The campaign's Máster only: «Partidas de la campaña» (R4 b). */
  onOpenPartidas?: () => void;
  /** The Máster only: the campaign's partidas, for each card's tag and the filter. Players never get them. */
  partidas?: ApiTable[];
  /** The filter bar's search, filters and sort order, kept by the app while moving between screens. */
  filter: FilterState;
  onFilterChange: (next: FilterState) => void;
  onShowToast: Toast;
}

export interface AccountInfo {
  displayName: string;
  username: string;
  campaignId: string;
  campaigns: { id: string; name: string }[];
  onChangeCampaign: (campaignId: string) => void;
  onLogout: () => void;
}

export interface SettingsScreenProps {
  lang: Language;
  /** Absent while the interface is Spanish only (the language card is hidden). */
  onLanguageChange?: (lang: Language) => void;
  onBack: () => void;
  account: AccountInfo;
  /** The site administrator only: opens «Administración» (R4 a). */
  onOpenAdmin?: () => void;
}

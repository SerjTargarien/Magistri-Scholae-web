/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The account app (R3.4 switch): the real screens on the account server.
// Sheets are read and saved through one SheetStore each, kept alive while
// signed in so leaving a sheet never drops unsent changes. The layout,
// background, loading screen and DEMO banner are the old app's, unchanged.
import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ApiSheetProjection, ApiUser, EntityKind } from "./contracts/api-v1";
import { Language, TRANSLATIONS } from "./localization";
import { DEFAULT_SKILL_CATALOGUE, newSkillId, type SkillCatalogue } from "./model/catalogue";
import type { CharacterSheet, CharacterType, FamiliarSheet } from "./model/sheet";
import { ApiFailure, RemoteClient, apiTransport, entityPath } from "./remote/client";
import { SheetStore } from "./store/sheetStore";
import type { VisualStyle } from "./types";
import { CampaignChooser, SignIn } from "./account/SignIn";
import { SaveStatus } from "./account/SaveStatus";
import { CharacterList } from "./components/CharacterList";
import { CharacterDetail } from "./components/CharacterDetail";
import { CharacterForm } from "./components/CharacterForm";
import { CharacterTypeSelect } from "./components/CharacterTypeSelect";
import { FamiliarEditor } from "./components/FamiliarEditor";
import { FamiliarDetail } from "./components/FamiliarDetail";
import { SettingsScreen } from "./components/SettingsScreen";
import { CAMPAIGN_SKILLS_TEXT, CampaignSkills } from "./account/CampaignSkills";
import { AcademyBackground } from "./components/AcademyOrnaments";
import { Loader, CheckCircle } from "lucide-react";

const DEMO = import.meta.env.VITE_MOCK_SERVER === "true";
// Demo builds only; the condition is replaced at build time.
const DemoPanel = DEMO ? lazy(() => import("./mock/panel")) : undefined;
const CAMPAIGN_KEY = "magistri_campaign";
const LIST_PAGE = 100; // the server's maximum page size (backend/domain/views.py pagination)

type Screen = "LIST" | "DETAIL" | "FAMILIAR_DETAIL" | "TYPE_SELECT" | "FORM" | "FAMILIAR_EDITOR" | "SETTINGS" | "CAMPAIGN_SKILLS";
/** A campaign the viewer belongs to, with their own role there (null: an administrator who is not a member). */
type Campaign = { id: string; name: string; role?: "gm" | "player" | null };

/** Reads the data URL's base64 part, as the asset endpoint expects. */
const base64Of = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);

export default function App() {
  const [screen, setScreen] = useState<Screen>("LIST");
  const [boot, setBoot] = useState(true);
  const [user, setUser] = useState<ApiUser>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string>("");
  const [catalogue, setCatalogue] = useState<SkillCatalogue>(DEFAULT_SKILL_CATALOGUE);
  const [catalogueRevision, setCatalogueRevision] = useState(1);
  const [characters, setCharacters] = useState<ApiSheetProjection[]>([]);
  const [familiars, setFamiliars] = useState<ApiSheetProjection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedFamiliarId, setSelectedFamiliarId] = useState<string | null>(null);
  const [familiarEditorOrigin, setFamiliarEditorOrigin] = useState<"LIST" | "TYPE_SELECT" | "DETAIL" | "FAMILIAR_DETAIL">("TYPE_SELECT");
  const [newCharacterType, setNewCharacterType] = useState<CharacterType>("student");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const stores = useRef(new Map<string, SheetStore>());
  // Demo builds only: lets the browser tests wait until every change has been saved.
  if (DEMO) (window as unknown as { __magistriSaved?: () => boolean }).__magistriSaved = () => [...stores.current.values()].every(s => s.state === "saved");

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("magistri_scholae_lang");
    return saved === "es" || saved === "en" ? saved : "es";
  });
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(() => {
    const saved = localStorage.getItem("magistri_scholae_style");
    return saved === "academy" || saved === "classic" ? saved : "academy";
  });
  const t = TRANSLATIONS[lang];
  const showToast = useCallback((type: "success" | "error", text: string) => setToastMessage({ type, text }), []);

  const clearSession = useCallback(() => {
    for (const store of stores.current.values()) store.dispose();
    stores.current.clear();
    setUser(undefined); setCampaigns([]); setCampaignId(""); setCharacters([]); setFamiliars([]);
    setSelectedCharId(null); setSelectedFamiliarId(null); setScreen("LIST");
  }, []);
  const client = useMemo(() => new RemoteClient(apiTransport, () => { clearSession(); showToast("error", t.storageLoadError); }), []);

  // Restore the session on start (finishing a sign-out that could not reach the server).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await client.token();
        if (localStorage.getItem("magistri_logout_pending")) {
          try { await client.request("auth/logout", "POST", {}); } catch (e) { if (!(e instanceof ApiFailure && e.status === 401)) throw e; }
          localStorage.removeItem("magistri_logout_pending");
        } else {
          const account = await client.request<ApiUser>("auth/me", "GET", undefined, true);
          if (active) setUser(account);
        }
      } catch (e) {
        if (active && !(e instanceof ApiFailure && e.status === 401)) showToast("error", t.storageLoadError);
      } finally { if (active) setBoot(false); }
    })();
    return () => { active = false; };
  }, [client]);

  // Campaigns: the remembered one, or the only one.
  useEffect(() => {
    if (!user) return;
    client.request<{ items: Campaign[] }>("campaigns?limit=100").then(result => {
      setCampaigns(result.items);
      const remembered = localStorage.getItem(CAMPAIGN_KEY);
      const chosen = result.items.find(c => c.id === remembered) ?? (result.items.length === 1 ? result.items[0] : undefined);
      setCampaignId(chosen?.id ?? "");
    }).catch(() => showToast("error", t.storageLoadError));
  }, [user, client]);

  const loadLists = useCallback(async () => {
    if (!campaignId) return;
    // The server returns at most LIST_PAGE sheets per request; read every page.
    const list = async (kind: EntityKind) => {
      const items: ApiSheetProjection[] = [];
      for (let offset = 0; ; offset += LIST_PAGE) {
        const page = await client.request<{ items: ApiSheetProjection[] }>(`${kind === "character" ? "characters" : "familiars"}?campaignId=${campaignId}&limit=${LIST_PAGE}&offset=${offset}`);
        items.push(...page.items);
        if (page.items.length < LIST_PAGE) return { items };
      }
    };
    try {
      const [chars, fams] = await Promise.all([list("character"), list("familiar")]);
      // Archived sheets leave the list (the GM restores them from R4's screens).
      setCharacters(chars.items.filter(s => !s.archived));
      setFamiliars(fams.items.filter(s => !s.archived));
    } catch {
      showToast("error", t.storageLoadError);
    }
  }, [campaignId, client]);

  useEffect(() => {
    if (!campaignId) return;
    localStorage.setItem(CAMPAIGN_KEY, campaignId);
    setLoading(true);
    Promise.all([
      client.request<{ catalogue: SkillCatalogue; revision: number }>(`campaigns/${campaignId}/skill-catalogue`)
        .then(r => { setCatalogue(r.catalogue); setCatalogueRevision(r.revision); }),
      loadLists(),
    ]).catch(() => showToast("error", t.storageLoadError)).finally(() => setLoading(false));
  }, [campaignId, client, loadLists]);

  // Connection and returning to the tab.
  useEffect(() => {
    const connection = () => { for (const store of stores.current.values()) store.setOnline(navigator.onLine); };
    const visible = () => { if (document.visibilityState === "visible") { void loadLists(); for (const store of stores.current.values()) void store.refresh(); } };
    const unload = (e: BeforeUnloadEvent) => { if ([...stores.current.values()].some(s => s.busy)) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("online", connection); window.addEventListener("offline", connection);
    document.addEventListener("visibilitychange", visible); window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("online", connection); window.removeEventListener("offline", connection);
      document.removeEventListener("visibilitychange", visible); window.removeEventListener("beforeunload", unload);
    };
  }, [loadLists]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  /** The store for a sheet, created on first use and kept while signed in. */
  const storeFor = useCallback((sheet: ApiSheetProjection) => {
    let store = stores.current.get(sheet.id);
    if (!store) {
      const path = entityPath(sheet);
      store = new SheetStore(sheet, {
        read: () => client.request<ApiSheetProjection>(path),
        patch: body => client.request<ApiSheetProjection>(path, "PATCH", body),
      }, rerender);
      store.setOnline(navigator.onLine);
      stores.current.set(sheet.id, store);
    }
    return store;
  }, [client]);

  const openStore = (id: string | null, list: ApiSheetProjection[]) => {
    const known = id ? stores.current.get(id) ?? list.find(s => s.id === id) : undefined;
    if (!known) return undefined;
    return known instanceof SheetStore ? known : storeFor(known);
  };
  const characterStore = openStore(selectedCharId, characters);
  const familiarStore = openStore(selectedFamiliarId, familiars);
  // Opening a sheet re-reads it, so a list a few seconds old never shows stale data.
  useEffect(() => { if (selectedCharId) void stores.current.get(selectedCharId)?.refresh(); }, [selectedCharId]);
  useEffect(() => { if (selectedFamiliarId) void stores.current.get(selectedFamiliarId)?.refresh(); }, [selectedFamiliarId]);

  /** Waits until the store has nothing left to send, so an upload or bond uses the current revision. */
  const settle = async (store: SheetStore) => {
    for (let i = 0; i < 20 && (store.pending.size || store.state === "saving" || store.state === "unsaved"); i++) {
      await store.flush();
      if (store.pending.size) await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const mutate = async (store: SheetStore, action: string, body: object) => {
    await settle(store);
    const send = () => client.mutation<ApiSheetProjection>(`${entityPath(store.sheet)}/${action}`, { expectedRevision: store.sheet.revision, ...body })();
    let result: ApiSheetProjection;
    try {
      result = await send();
    } catch (e) {
      if (!(e instanceof ApiFailure && e.code === "revision_conflict")) throw e;
      await store.refresh();
      result = await send();
    }
    store.accept(result);
    return result;
  };

  const uploadImage = (store: SheetStore) => async (path: string, dataUrl: string) => {
    try {
      await mutate(store, "assets", { path, imageBase64: base64Of(dataUrl) });
    } catch (e) {
      showToast("error", t.imageUploadError);
      throw e;
    }
  };

  // The campaign's skill list (C2): the GM saves it whole; a stale revision reloads it.
  const isCampaignGM = campaigns.find(c => c.id === campaignId)?.role === "gm";
  const saveCatalogue = async (next: SkillCatalogue): Promise<boolean> => {
    const text = CAMPAIGN_SKILLS_TEXT[lang];
    const path = `campaigns/${campaignId}/skill-catalogue`;
    try {
      const saved = await client.request<{ catalogue: SkillCatalogue; revision: number }>(path, "POST", { expectedRevision: catalogueRevision, catalogue: next });
      setCatalogue(saved.catalogue); setCatalogueRevision(saved.revision);
      // Own skills matching a new name became links on the server.
      for (const store of stores.current.values()) void store.refresh();
      void loadLists();
      return true;
    } catch (e) {
      if (e instanceof ApiFailure && e.status === 409) {
        const fresh = await client.request<{ catalogue: SkillCatalogue; revision: number }>(path).catch(() => undefined);
        if (fresh) { setCatalogue(fresh.catalogue); setCatalogueRevision(fresh.revision); }
        showToast("error", text.conflict);
      } else showToast("error", text.failed);
      return false;
    }
  };
  // Typed on one character's sheet or form: the skill joins the list but is not
  // «inicial» (others pick it with +); the GM can tick it on the list screen.
  const addCatalogueSkill = async (categoryId: string, name: string): Promise<string> => {
    const id = newSkillId(name, catalogue);
    if (!await saveCatalogue({ ...catalogue, habilidades: [...catalogue.habilidades, { id, nombre: { es: name }, categoria: categoryId, inicial: false }] }))
      throw new Error("skill list not saved");
    return id;
  };

  const bond = async (store: SheetStore, targetId: string | null) => {
    const target = targetId ? [...characters, ...familiars].find(s => s.id === targetId) : undefined;
    await mutate(store, "bond", { targetId, ...(target ? { targetRevision: stores.current.get(target.id)?.sheet.revision ?? target.revision } : {}) });
    for (const other of stores.current.values()) if (other !== store) void other.refresh();
    await loadLists();
    showToast("success", t.familiarSavedToast);
  };

  const archive = async (store: SheetStore) => {
    await mutate(store, "manage", { archived: true });
    store.dispose();
    stores.current.delete(store.sheet.id);
    setSelectedCharId(null); setSelectedFamiliarId(null); setScreen("LIST");
    await loadLists();
  };

  const create = async <T extends CharacterSheet | FamiliarSheet>(kind: EntityKind, fields: T, image?: { path: string; dataUrl: string }) => {
    const created = await client.mutation<ApiSheetProjection>(kind === "character" ? "characters" : "familiars", { campaignId, fields })();
    const store = storeFor(created);
    if (image) await uploadImage(store)(image.path, image.dataUrl).catch(() => {});
    return store;
  };

  const handleSaveForm = async (fields: CharacterSheet, avatar?: string, familiarId?: string) => {
    const store = await create("character", fields, avatar ? { path: "avatarImage", dataUrl: avatar } : undefined);
    if (familiarId) await bond(store, familiarId).catch(() => showToast("error", t.errorStoringStudent));
    await loadLists();
    setSelectedCharId(store.sheet.id);
    setScreen("DETAIL");
  };

  const createFamiliar = async (fields: FamiliarSheet, image?: string) => {
    const store = await create("familiar", fields, image ? { path: "imagen", dataUrl: image } : undefined);
    await loadLists();
    return store;
  };

  const logout = async () => {
    localStorage.setItem("magistri_logout_pending", "1");
    clearSession(); client.clear();
    try { await client.request("auth/logout", "POST", {}); localStorage.removeItem("magistri_logout_pending"); }
    catch (e) { if (e instanceof ApiFailure && e.status === 401) localStorage.removeItem("magistri_logout_pending"); }
  };

  const handleLanguageChange = (newLang: Language) => { setLang(newLang); localStorage.setItem("magistri_scholae_lang", newLang); };
  const handleStyleChange = (newStyle: VisualStyle) => { setVisualStyle(newStyle); localStorage.setItem("magistri_scholae_style", newStyle); };
  const panel = DemoPanel && localStorage.getItem("magistri_demo_panel") !== "off"
    ? <Suspense fallback={null}><DemoPanel lang={lang} /></Suspense> : null;

  if (!boot && !user) return <>{panel}<SignIn client={client} lang={lang} onSignedIn={account => setUser(account)} /></>;
  if (!boot && user && campaigns.length !== 1 && !campaignId)
    return <>{panel}<CampaignChooser lang={lang} campaigns={campaigns} onChoose={setCampaignId} onLogout={() => void logout()} /></>;

  const isGM = (store?: SheetStore) => !!store?.sheet.capabilities.isGM;

  return (
    <div
      className="min-h-screen bg-[#0a0514] text-neutral-200 font-sans selection:bg-violet-900/50 selection:text-amber-300 pb-12"
      id="academy-app-root"
      data-style={visualStyle}
    >
      {DEMO && (
        <div id="mock-mode-banner" role="status" className="relative z-40 bg-amber-950 text-amber-100 border-b border-amber-500/40 px-4 py-2 text-center text-sm">
          {t.mockModeBanner}
        </div>
      )}
      {panel}
      {visualStyle === "academy" ? (
        <AcademyBackground />
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0514]">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-violet-900/30 rounded-full blur-[120px]"></div>
        </div>
      )}

      {boot || loading ? (
        <div className="flex flex-col justify-center items-center h-screen gap-4" id="app-loading-screen">
          <Loader className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="font-magic text-sm tracking-widest text-neutral-400 uppercase animate-pulse">
            {t.loadingMessage}
          </span>
        </div>
      ) : (
        <main className="relative z-10 w-full">
          {screen === "LIST" && (
            <CharacterList
              lang={lang}
              visualStyle={visualStyle}
              characters={characters}
              familiars={familiars}
              onSelectCharacter={id => { setSelectedCharId(id); setScreen("DETAIL"); }}
              onSelectFamiliar={id => { setSelectedFamiliarId(id); setScreen("FAMILIAR_DETAIL"); }}
              onAddCharacter={() => setScreen("TYPE_SELECT")}
              onOpenSettings={() => setScreen("SETTINGS")}
              onShowToast={showToast}
            />
          )}

          {screen === "DETAIL" && characterStore && (
            <CharacterDetail
              key={characterStore.sheet.id}
              lang={lang}
              visualStyle={visualStyle}
              store={characterStore}
              catalogue={catalogue}
              familiars={familiars}
              onBack={() => { setSelectedCharId(null); setScreen("LIST"); void loadLists(); }}
              onArchive={isGM(characterStore) ? () => void archive(characterStore) : undefined}
              onSelectFamiliar={id => { setSelectedFamiliarId(id); setScreen("FAMILIAR_DETAIL"); }}
              onBondFamiliar={familiarId => bond(characterStore, familiarId)}
              onAddCatalogueSkill={isCampaignGM ? addCatalogueSkill : undefined}
              onOpenCreateFamiliar={() => { setSelectedFamiliarId(null); setFamiliarEditorOrigin("DETAIL"); setScreen("FAMILIAR_EDITOR"); }}
              onUploadImage={uploadImage(characterStore)}
            />
          )}

          {screen === "FAMILIAR_DETAIL" && familiarStore && (
            <FamiliarDetail
              key={familiarStore.sheet.id}
              lang={lang}
              visualStyle={visualStyle}
              store={familiarStore}
              characters={characters}
              onBack={() => { setSelectedFamiliarId(null); setScreen("LIST"); void loadLists(); }}
              onEditInEditor={id => { setSelectedFamiliarId(id); setFamiliarEditorOrigin("FAMILIAR_DETAIL"); setScreen("FAMILIAR_EDITOR"); }}
              onArchive={isGM(familiarStore) ? () => void archive(familiarStore) : undefined}
              onSelectCharacter={id => { setSelectedCharId(id); setScreen("DETAIL"); }}
              onBondMaster={characterId => bond(familiarStore, characterId)}
              onUploadImage={uploadImage(familiarStore)}
              onShowToast={showToast}
            />
          )}

          {screen === "TYPE_SELECT" && (
            <CharacterTypeSelect
              lang={lang}
              onSelectType={type => { setNewCharacterType(type); setScreen("FORM"); }}
              onOpenFamiliarEditor={() => { setSelectedFamiliarId(null); setFamiliarEditorOrigin("TYPE_SELECT"); setScreen("FAMILIAR_EDITOR"); }}
              onCancel={() => setScreen("LIST")}
            />
          )}

          {screen === "FAMILIAR_EDITOR" && (
            <FamiliarEditor
              key={familiarStore?.sheet.id ?? "new"}
              lang={lang}
              visualStyle={visualStyle}
              store={familiarStore}
              familiars={familiars}
              onOpenFamiliar={id => setSelectedFamiliarId(id)}
              onArchive={familiarStore && isGM(familiarStore) ? () => void archive(familiarStore) : undefined}
              onCreate={async (fields, image) => {
                const store = await createFamiliar(fields, image);
                setSelectedFamiliarId(store.sheet.id);
                return store.sheet.id;
              }}
              onUploadImage={familiarStore ? uploadImage(familiarStore) : async () => {}}
              onBack={() => {
                void loadLists();
                if (familiarEditorOrigin === "FAMILIAR_DETAIL" && selectedFamiliarId) setScreen("FAMILIAR_DETAIL");
                else if (familiarEditorOrigin === "DETAIL" && selectedCharId) setScreen("DETAIL");
                else if (familiarEditorOrigin === "TYPE_SELECT") { setSelectedFamiliarId(null); setScreen("TYPE_SELECT"); }
                else { setSelectedFamiliarId(null); setScreen("LIST"); }
              }}
              onShowToast={showToast}
            />
          )}

          {screen === "FORM" && (
            <CharacterForm
              lang={lang}
              newCharacterType={newCharacterType}
              isGM={isCampaignGM}
              onAddCatalogueSkill={isCampaignGM ? addCatalogueSkill : undefined}
              catalogue={catalogue}
              onSave={handleSaveForm}
              onCreateFamiliar={async (fields, image) => {
                const store = await createFamiliar(fields, image);
                return { id: store.sheet.id, nombre: String(store.sheet.fields.nombre ?? "") };
              }}
              onCancel={() => setScreen("LIST")}
            />
          )}

          {screen === "SETTINGS" && user && (
            <SettingsScreen
              lang={lang}
              visualStyle={visualStyle}
              onStyleChange={handleStyleChange}
              onLanguageChange={handleLanguageChange}
              onBack={() => setScreen("LIST")}
              account={{
                displayName: user.displayName || user.username,
                username: user.username,
                campaignId,
                campaigns,
                onChangeCampaign: id => { for (const store of stores.current.values()) store.dispose(); stores.current.clear(); setCampaignId(id); setScreen("LIST"); },
                onLogout: () => void logout(),
                onOpenCampaignSkills: isCampaignGM ? () => setScreen("CAMPAIGN_SKILLS") : undefined,
              }}
            />
          )}

          {screen === "CAMPAIGN_SKILLS" && isCampaignGM && (
            <CampaignSkills
              lang={lang}
              catalogue={catalogue}
              onSave={async next => {
                const ok = await saveCatalogue(next);
                if (ok) showToast("success", CAMPAIGN_SKILLS_TEXT[lang].saved);
                return ok;
              }}
              onBack={() => setScreen("SETTINGS")}
            />
          )}
        </main>
      )}

      <SaveStatus lang={lang} store={screen === "DETAIL" ? characterStore : screen === "FAMILIAR_DETAIL" || screen === "FAMILIAR_EDITOR" ? familiarStore : undefined} />

      {toastMessage && (
        <div
          id="app-global-toast"
          className={`fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-xl border-2 shadow-2xl animate-fade-in flex items-start gap-3 text-xs leading-relaxed ${
            toastMessage.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/95 border-rose-500/40 text-rose-200"
          }`}
        >
          <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${toastMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`} />
          <div className="flex-1 font-sans font-medium">{toastMessage.text}</div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-base font-mono hover:text-amber-400 opacity-60 hover:opacity-100 transition-opacity ml-2 shrink-0 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiSheetProjection, ApiUser, EntityKind, PersonalNoteView } from "../contracts/api-v1";
import { API_SCHEMA } from "../contracts/fieldRegistry.generated";
import { ARCHETYPES_REGISTRY } from "../models/characterRegistry";
import { TRANSLATIONS, type Language } from "../localization";
import { ApiFailure, RemoteClient, entityPath } from "./client";
import { SaveQueue, pathValue } from "./saveQueue";
import { RemoteFields, type Spec } from "./RemoteFields";
import { remoteText } from "./text";
import "./remote.css";

type Campaign = { id: string; name: string; policyRevision: number };
type Run = <T>(job: () => Promise<T>, done?: (result: T) => void) => void;

export default function RemoteApp() {
  const [lang, setLang] = useState<Language>(() => localStorage.getItem("magistri_scholae_lang") === "en" ? "en" : "es");
  const [style, setStyle] = useState(() => localStorage.getItem("magistri_scholae_style") === "classic" ? "classic" : "academy");
  const [user, setUser] = useState<ApiUser>();
  const [boot, setBoot] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaign, setCampaign] = useState("");
  const [sheets, setSheets] = useState<ApiSheetProjection[]>([]);
  const [kind, setKind] = useState<EntityKind>("character");
  const [selected, setSelected] = useState<ApiSheetProjection>();
  const [notesOpen, setNotesOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const activeQueue = useRef<SaveQueue | undefined>(undefined);
  const session = useRef(0);
  const action = useRef<(() => Promise<void>) | null>(null);
  const t = remoteText[lang];
  const base = TRANSLATIONS[lang];
  function clearSession() {
    session.current++; activeQueue.current?.dispose(); activeQueue.current = undefined;
    setUser(undefined); setSheets([]); setSelected(undefined); setCampaigns([]); setCampaign(""); setNotesOpen(false);
    setUncertain(false); action.current = null; setBusy(false);
  }
  const client = useMemo(() => new RemoteClient(fetch, () => { clearSession(); setError("sessionExpired"); }), []);
  useEffect(() => {
    let active = true;
    const bc = new BroadcastChannel("magistri-session"); channel.current = bc;
    bc.onmessage = () => { clearSession(); client.clear(); setError("sessionExpired"); };
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener("online", connection); window.addEventListener("offline", connection);
    async function restoreSession() {
      try {
        await client.token();
        if (localStorage.getItem("magistri_logout_pending")) {
          try { await client.request("auth/logout", "POST", {}); } catch (e) { if (!(e instanceof ApiFailure && e.status === 401)) throw e; }
          localStorage.removeItem("magistri_logout_pending");
        } else {
          const account = await client.request<ApiUser>("auth/me", "GET", undefined, true);
          if (active) setUser(account);
        }
      } catch (e) { if (active && !(e instanceof ApiFailure && e.status === 401)) setError("network_error"); }
      finally { if (active) setBoot(false); }
    }
    void restoreSession();
    return () => { active = false; bc.close(); client.clear(); window.removeEventListener("online", connection); window.removeEventListener("offline", connection); };
  }, [client]);
  useEffect(() => {
    if (!user) return;
    let current = true;
    client.request<{ items: Campaign[] }>("campaigns?limit=100").then(result => { if (current) setCampaigns(result.items); }).catch(e => { if (current) setError(e.code || "network_error"); });
    return () => { current = false; };
  }, [user, client]);
  useEffect(() => {
    if (!user) return;
    const refresh = () => { if (document.visibilityState === "visible") setListVersion(value => value + 1); };
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [user]);
  useEffect(() => {
    let current = true; setSheets([]); setOffset(0); setMore(false);
    if (campaign && user) client.request<{ items: ApiSheetProjection[] }>(`${kind === "character" ? "characters" : "familiars"}?campaignId=${campaign}&limit=50`).then(result => {
      if (current) { setSheets(result.items); setMore(result.items.length === 50); }
    }).catch(e => { if (current) setError(e.code || "network_error"); });
    return () => { current = false; };
  }, [campaign, kind, user, client, listVersion]);
  const run: Run = (job, done) => {
    if (action.current || busy || !online) return;
    const epoch = session.current;
    const work = async () => {
      setBusy(true); setError("");
      try {
        const result = await job();
        if (epoch !== session.current) return;
        action.current = null; setUncertain(false); done?.(result);
      } catch (e) {
        if (epoch !== session.current) return;
        setError(e instanceof ApiFailure ? e.code : "network_error");
        if (e instanceof ApiFailure && e.status < 500) { action.current = null; setUncertain(false); }
        else setUncertain(true);
      } finally { if (epoch === session.current) setBusy(false); }
    };
    action.current = work; void work();
  };
  const leave = () => {
    if (activeQueue.current?.busy) { setError("unsavedLeave"); return false; }
    setSelected(undefined); activeQueue.current?.dispose(); activeQueue.current = undefined; setError(""); setListVersion(v => v + 1); return true;
  };
  const logout = async () => {
    localStorage.setItem("magistri_logout_pending", "1"); channel.current?.postMessage("logout"); clearSession(); client.clear();
    try { await client.request("auth/logout", "POST", {}); localStorage.removeItem("magistri_logout_pending"); }
    catch (e) { if (e instanceof ApiFailure && e.status === 401) localStorage.removeItem("magistri_logout_pending"); else setError("network_error"); }
  };
  const locked = busy || uncertain || !online;
  return <div className={`remote-app ${style}`}><main><header><h1>Magistri Scholae</h1><span>{t.remote}</span>
    <select aria-label="Language" value={lang} onChange={e => { const value = e.target.value as Language; setLang(value); localStorage.setItem("magistri_scholae_lang", value); }}><option value="es">Español</option><option value="en">English</option></select>
    <select aria-label={base.settings} value={style} onChange={e => { setStyle(e.target.value); localStorage.setItem("magistri_scholae_style", e.target.value); }}><option value="academy">Academy</option><option value="classic">Classic</option></select>
    {user && <><span>{user.displayName || user.username}</span><button onClick={() => void logout()}>{t.logout}</button></>}
  </header>{!online && <p role="status">{t.offline}</p>}{error && <p role="alert">{(t as Record<string, string>)[error] || `${t.failed}: ${error}`}</p>}
    {uncertain && <button disabled={busy || !online} onClick={() => void action.current?.()}>{t.retry}</button>}
    {boot ? <p>{base.loadingMessage}</p> : !user ? <Auth client={client} lang={lang} run={run} locked={locked} signedIn={account => { channel.current?.postMessage("login"); session.current++; setBusy(false); setUser(account); }} /> : <>
      <div className="remote-toolbar"><label>{t.campaign}<select value={campaign} disabled={locked} onChange={e => { if (leave()) { setCampaign(e.target.value); setNotesOpen(false); } }}><option value="">{t.choose}</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <button disabled={locked} onClick={() => { if (!activeQueue.current?.busy) { if (activeQueue.current) setSelected(activeQueue.current.sheet); setNotesOpen(value => !value); } else setError("unsavedLeave"); }}>{t.personal}</button>
      </div>{!campaigns.length && <p>{t.noCampaign}</p>}
      {notesOpen ? <Notes key={user.id} client={client} lang={lang} run={run} locked={locked} sheet={selected} onPromoted={result => { setSelected(result); activeQueue.current?.accept(result); setNotesOpen(false); }} /> : selected ?
        <SheetEditor key={selected.id} sheet={selected} client={client} lang={lang} locked={locked} online={online} run={run} back={() => { leave(); }} navigate={setSelected} register={q => { activeQueue.current = q; }} /> : campaign ? <>
          <nav className="remote-toolbar"><button disabled={locked} onClick={() => setKind("character")}>{t.characters}</button><button disabled={locked} onClick={() => setKind("familiar")}>{t.familiars}</button></nav>
          <CreateSheet client={client} campaign={campaign} kind={kind} lang={lang} run={run} locked={locked} created={setSelected} />
          <div className="remote-cards">{sheets.map(sheet => <button key={sheet.id} className="remote-card" disabled={locked} onClick={() => run(() => client.request<ApiSheetProjection>(entityPath(sheet)), setSelected)}>
            {sheet.fields.nombre || t.hidden}{sheet.archived ? ` · ${t.archive}` : ""}
          </button>)}</div>{!sheets.length && <p>{t.empty}</p>}{more && <button disabled={locked} onClick={() => run(() => client.request<{ items: ApiSheetProjection[] }>(`${kind === "character" ? "characters" : "familiars"}?campaignId=${campaign}&limit=50&offset=${offset + 50}`), result => { setSheets(value => [...value, ...result.items]); setOffset(value => value + 50); setMore(result.items.length === 50); })}>{t.loadMore}</button>}
        </> : null}
    </>}
  </main></div>;
}

function Auth({ client, lang, run, locked, signedIn }: { client: RemoteClient; lang: Language; run: Run; locked: boolean; signedIn: (user: ApiUser) => void }) {
  const t = remoteText[lang]; const [mode, setMode] = useState("login"); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [token, setToken] = useState(""); const [message, setMessage] = useState("");
  return <><nav className="remote-toolbar">{["login", "register", "reset"].map(m => <button key={m} disabled={locked} onClick={() => { setMode(m); setMessage(""); setPassword(""); setToken(""); }}>{t[m as "login"]}</button>)}</nav>
    <form onSubmit={e => { e.preventDefault(); if (localStorage.getItem("magistri_logout_pending")) { location.reload(); return; }
      const body = mode === "login" ? { username, password } : mode === "register" ? { invitationToken: token, username, password } : { code: token, newPassword: password };
      const path = mode === "reset" ? "password-reset" : mode;
      run(() => client.request<{ user: ApiUser }>(`auth/${path}`, "POST", body), result => { setPassword(""); setToken(""); if (mode === "login") signedIn(result.user); else { setMessage(mode === "register" ? t.registered : t.resetDone); setMode("login"); } });
    }}><fieldset disabled={locked} className="remote-section"><legend>{t[mode as "login"]}</legend>
      {mode !== "reset" && <label>{t.username}<input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} /></label>}
      {mode !== "login" && <label>{mode === "reset" ? t.code : t.invitation}<input required value={token} onChange={e => setToken(e.target.value)} /></label>}
      <label>{t.password}<input required minLength={mode === "login" ? undefined : 12} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button type="submit">{t[mode as "login"]}</button></fieldset></form>{message && <p role="status">{message}</p>}</>;
}

function CreateSheet({ client, campaign, kind, lang, run, locked, created }: { client: RemoteClient; campaign: string; kind: EntityKind; lang: Language; run: Run; locked: boolean; created: (sheet: ApiSheetProjection) => void }) {
  const [name, setName] = useState(""); const [type, setType] = useState("student"); const t = remoteText[lang]; const base = TRANSLATIONS[lang] as any;
  return <form className="remote-section" onSubmit={e => { e.preventDefault(); run(client.mutation<ApiSheetProjection>(kind === "character" ? "characters" : "familiars", { campaignId: campaign, fields: { nombre: name, ...(kind === "character" ? { characterType: type } : {}) } }), sheet => { setName(""); created(sheet); }); }}>
    <label>{base.nombre}<input required maxLength={200} value={name} disabled={locked} onChange={e => setName(e.target.value)} /></label>
    {kind === "character" && <select aria-label={base.characterTypeSelectTitle || "Archetype"} value={type} disabled={locked} onChange={e => setType(e.target.value)}>{Object.values(ARCHETYPES_REGISTRY).filter(a => a.key !== "familiar").map(a => <option key={a.key} value={a.key}>{a.icon} {base[a.titleKey]}</option>)}</select>}
    <button disabled={locked}>{t.create} {kind === "character" ? t.characters : t.familiars}</button>
  </form>;
}

function SheetEditor({ sheet, client, lang, locked, online, run, back, navigate, register }: { sheet: ApiSheetProjection; client: RemoteClient; lang: Language; locked: boolean; online: boolean; run: Run; back: () => void; navigate: (s: ApiSheetProjection) => void; register: (q: SaveQueue) => void }) {
  const [, update] = useState(0);
  const [queue] = useState(() => new SaveQueue(sheet, body => client.request(entityPath(sheet), "PATCH", body), () => client.request(entityPath(sheet)), () => update(v => v + 1)));
  const [tab, setTab] = useState("perfil"); const [targets, setTargets] = useState<ApiSheetProjection[]>([]); const [target, setTarget] = useState("");
  const t = remoteText[lang]; const base = TRANSLATIONS[lang] as any;
  useEffect(() => { queue.activate(); register(queue); const focus = () => { if (document.visibilityState === "visible") void queue.refresh(); }; const unload = (e: BeforeUnloadEvent) => { if (queue.busy) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("focus", focus); document.addEventListener("visibilitychange", focus); window.addEventListener("beforeunload", unload);
    return () => { queue.dispose(); window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", focus); window.removeEventListener("beforeunload", unload); }; }, [queue]);
  useEffect(() => queue.setOnline(online), [queue, online]);
  const current = queue.sheet;
  const archetype = current.entityType === "familiar" ? ARCHETYPES_REGISTRY.familiar : ARCHETYPES_REGISTRY[(current.fields as { characterType?: "student" | "adult_wizard" }).characterType];
  const tabs = archetype?.tabs || ["perfil", "sesion", "habilidades", "hechizos", "notas", "galeria"];
  const special: Record<string, string> = { habilidades: "habilidades", conjuros: "hechizos", pociones: "hechizos", notas: "notas", notasList: "notas", galleryImages: "galeria" };
  const registry = Object.fromEntries(Object.entries(API_SCHEMA.entities[current.entityType]).filter(([key]) => {
    const section = special[key] || (/^(estres|puntosDestino|pxs|consecuencias|aspectoTemporal)/.test(key) ? "sesion" : "perfil");
    return section === tab;
  })) as Record<string, Spec>;
  const blocked = locked || !queue.canEdit;
  return <><div className="remote-toolbar"><button disabled={locked} onClick={back}>{t.back}</button><h2>{current.fields.nombre || t.hidden}</h2></div>
    <div className="remote-status" role="status" aria-live="polite">{t[queue.state]}{queue.errorCode && ` · ${queue.errorCode}`}</div>
    {["conflict", "error"].includes(queue.state) && <section className="remote-section"><p>{t.reconcile}</p>{[...queue.pending].map(([path, value]) => <div key={path}><strong>{path}</strong><pre>{t.mine}: {JSON.stringify(value)}{"\n"}{t.current}: {JSON.stringify(pathValue(queue.sheet.fields, path))}</pre></div>)}
      <button disabled={!online || locked} onClick={() => void queue.retry()}>{t.retry}</button><button disabled={!online || locked} onClick={() => void queue.reconcile(true)}>{t.reload}</button><button disabled={!online || locked} onClick={() => void queue.reconcile(false)}>{t.reapply}</button></section>}
    <nav className="remote-toolbar">{tabs.map(section => <button key={section} onClick={() => setTab(section)}>{base[section]}</button>)}</nav>
    <RemoteFields queue={queue} registry={registry} lang={lang} locked={blocked} upload={(path, imageBase64) => run(client.mutation<ApiSheetProjection>(`${entityPath(current)}/assets`, { expectedRevision: current.revision, path, imageBase64 }), result => queue.accept(result))} />
    {tab === "notas" && current.capabilities.isGM && <GMNotes client={client} sheet={current} lang={lang} run={run} locked={blocked || queue.busy} />}
    <section className="remote-section"><h2>{t.bond}</h2>{current.bondId ? <button disabled={blocked || queue.busy} onClick={() => run(() => client.request<ApiSheetProjection>(`${current.entityType === "character" ? "familiars" : "characters"}/${current.bondId}`), navigate)}>{t.viewBond}</button> : <p>{t.noBond}</p>}{current.capabilities.bondWritable && <>
      <button disabled={blocked || queue.busy} onClick={() => run(() => client.request<{ items: ApiSheetProjection[] }>(`${current.entityType === "character" ? "familiars" : "characters"}?campaignId=${current.campaignId}&limit=100`), result => setTargets(result.items))}>{t.choose}</button>
      <select aria-label={t.bond} disabled={blocked || queue.busy} value={target} onChange={e => setTarget(e.target.value)}><option value="">—</option>{targets.map(s => <option key={s.id} value={s.id}>{s.fields.nombre || t.hidden}</option>)}</select>
      <button disabled={blocked || queue.busy || !target} onClick={() => { const chosen = targets.find(s => s.id === target)!; run(client.mutation<ApiSheetProjection>(`${entityPath(current)}/bond`, { expectedRevision: current.revision, targetId: chosen.id, targetRevision: chosen.revision }), result => queue.accept(result)); }}>{t.link}</button>
      <button disabled={blocked || queue.busy || !current.bondId} onClick={() => run(client.mutation<ApiSheetProjection>(`${entityPath(current)}/bond`, { expectedRevision: current.revision, targetId: null }), result => queue.accept(result))}>{t.unbond}</button>
    </>}</section>
    {current.capabilities.isGM && <button disabled={blocked || queue.busy} onClick={() => run(client.mutation<ApiSheetProjection>(`${entityPath(current)}/manage`, { expectedRevision: current.revision, archived: !current.archived }), result => queue.accept(result))}>{current.archived ? t.restore : t.archive}</button>}
  </>;
}

function GMNotes({ client, sheet, lang, run, locked }: { client: RemoteClient; sheet: ApiSheetProjection; lang: Language; run: Run; locked: boolean }) {
  const [value, setValue] = useState({ content: "", revision: 0 }); const [draft, setDraft] = useState(""); const [loaded, setLoaded] = useState(false); const [error, setError] = useState(""); const t = remoteText[lang];
  const [comparison, setComparison] = useState<typeof value>();
  useEffect(() => { let active = true; client.request<typeof value>(`${entityPath(sheet)}/gm-notes`).then(result => { if (active) { setValue(result); setDraft(result.content); setLoaded(true); } }).catch(e => { if (active) setError(e.code || "network_error"); }); return () => { active = false; }; }, [client, sheet.id]);
  return <section className="remote-section"><h2>{t.gmNotes}</h2>{error && <p role="alert">{t.failed}: {error}</p>}<label>{t.content}<textarea value={draft} disabled={locked || !loaded} onChange={e => { setDraft(e.target.value); setComparison(undefined); }} /></label><button disabled={locked || !loaded} onClick={() => run(client.mutation<typeof value>(`${entityPath(sheet)}/gm-notes`, { expectedRevision: value.revision, content: draft }, "PATCH"), setValue)}>{t.save}</button>
    <button disabled={locked || !loaded} onClick={() => run(() => client.request<typeof value>(`${entityPath(sheet)}/gm-notes`), setComparison)}>{t.conflict}</button>
    {comparison && <div><p>{t.current}</p><pre>{comparison.content}</pre><p>{t.mine}</p><pre>{draft}</pre><button disabled={locked} onClick={() => { setValue(comparison); setDraft(comparison.content); setComparison(undefined); }}>{t.reload}</button><button disabled={locked} onClick={() => run(client.mutation<typeof value>(`${entityPath(sheet)}/gm-notes`, { expectedRevision: comparison.revision, content: draft }, "PATCH"), result => { setValue(result); setComparison(undefined); })}>{t.reapply}</button></div>}
  </section>;
}

function Notes({ client, lang, run, locked, sheet, onPromoted }: { client: RemoteClient; lang: Language; run: Run; locked: boolean; sheet?: ApiSheetProjection; onPromoted: (s: ApiSheetProjection) => void }) {
  const [notes, setNotes] = useState<PersonalNoteView[]>([]); const [editing, setEditing] = useState<PersonalNoteView>();
  const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [label, setLabel] = useState(""); const [offset, setOffset] = useState(0); const [more, setMore] = useState(false);
  const [preview, setPreview] = useState<{ previewToken: string; audiences: Record<string, "gm" | "assigned" | "shared"> }>();
  const [comparison, setComparison] = useState<PersonalNoteView>(); const [loadError, setLoadError] = useState("");
  const t = remoteText[lang];
  useEffect(() => { let active = true; client.request<{ items: PersonalNoteView[] }>("personal-notes?limit=50").then(result => { if (active) { setNotes(result.items); setMore(result.items.length === 50); } }).catch(e => { if (active) setLoadError(e.code || "network_error"); }); return () => { active = false; }; }, [client]);
  const select = (note?: PersonalNoteView) => { setEditing(note); setTitle(note?.title || ""); setContent(note?.content || ""); setLabel(note?.label || ""); setPreview(undefined); setComparison(undefined); };
  return <section><h2>{t.personal}</h2><p>{t.private}</p>{loadError && <p role="alert">{t.failed}: {loadError}</p>}<button disabled={locked} onClick={() => select()}>{t.newNote}</button>
    <div className="remote-cards">{notes.map(note => <button className="remote-card" key={note.id} disabled={locked} onClick={() => select(note)}>{note.title} · {note.label}</button>)}</div>{!notes.length && <p>{t.notesEmpty}</p>}
    {more && <button disabled={locked} onClick={() => run(() => client.request<{ items: PersonalNoteView[] }>(`personal-notes?limit=50&offset=${offset + 50}`), result => { setNotes(values => [...values, ...result.items]); setOffset(value => value + 50); setMore(result.items.length === 50); })}>{t.loadMore}</button>}
    <form onSubmit={e => { e.preventDefault(); const path = editing ? `personal-notes/${editing.id}` : "personal-notes"; const body = editing ? { expectedRevision: editing.revision, title, content, label } : { title, content, label, ...(sheet ? { sheetId: sheet.id } : {}) };
      run(client.mutation<PersonalNoteView>(path, body, editing ? "PATCH" : "POST"), note => { setNotes(values => [note, ...values.filter(n => n.id !== note.id)]); select(note); }); }}><fieldset disabled={locked} className="remote-section">
        <label>{t.title}<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label><label>{t.label}<input maxLength={120} value={label} onChange={e => setLabel(e.target.value)} /></label><label>{t.content}<textarea maxLength={64000} rows={6} value={content} onChange={e => setContent(e.target.value)} /></label><button>{t.save}</button>
      </fieldset></form>
    {editing && <><button disabled={locked} onClick={() => { if (confirm(t.confirmDelete)) run(client.mutation(`personal-notes/${editing.id}`, { expectedRevision: editing.revision }, "DELETE"), () => { setNotes(values => values.filter(n => n.id !== editing.id)); select(); }); }}>{t.delete}</button>
      <button disabled={locked} onClick={() => run(() => client.request<PersonalNoteView>(`personal-notes/${editing.id}`), setComparison)}>{t.conflict}</button>
      {comparison && <section className="remote-section"><p>{t.current}</p><pre>{comparison.title}{"\n"}{comparison.content}{"\n"}{comparison.label}</pre><p>{t.mine}</p><pre>{title}{"\n"}{content}{"\n"}{label}</pre><button disabled={locked} onClick={() => select(comparison)}>{t.reload}</button><button disabled={locked} onClick={() => run(client.mutation<PersonalNoteView>(`personal-notes/${editing.id}`, { expectedRevision: comparison.revision, title, content, label }, "PATCH"), note => { setNotes(values => [note, ...values.filter(n => n.id !== note.id)]); select(note); })}>{t.reapply}</button></section>}
      {sheet && title === editing.title && content === editing.content && label === editing.label && <button disabled={locked} onClick={() => run(() => client.request(`personal-notes/${editing.id}/promote/preview`, "POST", { sheetId: sheet.id, expectedRevision: sheet.revision, noteRevision: editing.revision }), result => setPreview(result as typeof preview))}>{t.promote}</button>}
      {preview && sheet && <section className="remote-section" role="dialog" aria-label={t.promote}><p>{t.promotion}</p><p>{sheet.fields.nombre || t.hidden}</p><p>{t.audience}: {Object.entries(preview.audiences).map(([field, audience]) => `${field}: ${t[audience]}`).join("; ")}</p><pre>{editing.title}{"\n"}{editing.content}</pre>
        <button disabled={locked} onClick={() => run(client.mutation<ApiSheetProjection>(`personal-notes/${editing.id}/promote`, { sheetId: sheet.id, expectedRevision: sheet.revision, noteRevision: editing.revision, previewToken: preview.previewToken }), result => { select(); onPromoted(result); })}>{t.confirm}</button><button onClick={() => setPreview(undefined)}>{t.cancel}</button>
      </section>}
    </>}
  </section>;
}

// Sign-in, invitation registration and reset-code redemption (moved from the
// stopgap account screens). Its look is redesigned in R3.5 (app shell).
import { useState } from "react";
import type { ApiUser } from "../contracts/api-v1";
import type { Language } from "../localization";
import { ApiFailure, type RemoteClient } from "../remote/client";
import { remoteText } from "../remote/text";
import "../remote/remote.css";

type Mode = "login" | "register" | "reset";

export function SignIn({ client, lang, onSignedIn }: { client: RemoteClient; lang: Language; onSignedIn: (user: ApiUser) => void }) {
  const t = remoteText[lang];
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (localStorage.getItem("magistri_logout_pending")) { location.reload(); return; }
    const body = mode === "login" ? { username, password } : mode === "register" ? { invitationToken: token, username, password } : { code: token, newPassword: password };
    const path = mode === "reset" ? "password-reset" : mode;
    setBusy(true); setError("");
    try {
      const result = await client.request<{ user: ApiUser }>(`auth/${path}`, "POST", body);
      setPassword(""); setToken("");
      if (mode === "login") onSignedIn(result.user);
      else { setMessage(mode === "register" ? t.registered : t.resetDone); setMode("login"); }
    } catch (e) {
      setError(e instanceof ApiFailure ? e.code : "network_error");
    } finally { setBusy(false); }
  };

  return <div className="remote-app academy"><main>
    <header><h1>Magistri Scholae</h1><span>{t.remote}</span></header>
    {error && <p role="alert">{(t as Record<string, string>)[error] || `${t.failed}: ${error}`}</p>}
    <nav className="remote-toolbar">{(["login", "register", "reset"] as const).map(m =>
      <button key={m} disabled={busy} onClick={() => { setMode(m); setMessage(""); setPassword(""); setToken(""); }}>{t[m]}</button>)}</nav>
    <form onSubmit={e => { e.preventDefault(); void submit(); }}><fieldset disabled={busy} className="remote-section"><legend>{t[mode]}</legend>
      {mode !== "reset" && <label>{t.username}<input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} /></label>}
      {mode !== "login" && <label>{mode === "reset" ? t.code : t.invitation}<input required value={token} onChange={e => setToken(e.target.value)} /></label>}
      <label>{t.password}<input required minLength={mode === "login" ? undefined : 12} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button type="submit">{t[mode]}</button></fieldset></form>
    {message && <p role="status">{message}</p>}
  </main></div>;
}

/** Shown when the account belongs to several campaigns and none is chosen yet. */
export function CampaignChooser({ lang, campaigns, onChoose, onLogout }: {
  lang: Language; campaigns: { id: string; name: string }[]; onChoose: (id: string) => void; onLogout: () => void;
}) {
  const t = remoteText[lang];
  return <div className="remote-app academy"><main>
    <header><h1>Magistri Scholae</h1><button onClick={onLogout}>{t.logout}</button></header>
    {campaigns.length ? <nav className="remote-toolbar" aria-label={t.campaign}>{campaigns.map(c =>
      <button key={c.id} onClick={() => onChoose(c.id)}>{c.name}</button>)}</nav> : <p>{t.noCampaign}</p>}
  </main></div>;
}

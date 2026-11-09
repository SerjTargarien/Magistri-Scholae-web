// Sign-in, invitation registration and reset-code redemption, and the campaign
// choice for accounts in several campaigns. Drawn inside the app's own frame
// (background, crest and title) in the academy or classic style (R3.5 brings
// these screens forward; owner request, 8 November 2026).
import { useEffect, useState } from "react";
import { KeyRound, LogIn, LogOut, Ticket } from "lucide-react";
import type { ApiUser } from "../contracts/api-v1";
import { type Language, remoteText, SIGN_IN_ERRORS, TRANSLATIONS } from "../localization";
import { ApiFailure, type RemoteClient } from "../remote/client";
import { FiligreeCorner } from "../components/AcademyOrnaments";

type Mode = "login" | "register" | "reset";

/**
 * Invitation and reset links: https://magistrischolae.fyi/#invitacion=CODE or
 * #recuperacion=CODE open the right tab with the code filled in. The code is in
 * the fragment, which browsers never send to the server, and is removed from the
 * address bar once read.
 */
export function readCodeLink(hash: string): { mode: Mode; code: string } | undefined {
  const match = /^#(invitacion|recuperacion)=([A-Za-z0-9_-]{1,200})$/.exec(hash);
  if (!match) return undefined;
  return { mode: match[1] === "invitacion" ? "register" : "reset", code: match[2] };
}

function takeCodeLink(): { mode: Mode; code: string } | undefined {
  const link = readCodeLink(globalThis.location?.hash ?? "");
  if (link) history.replaceState(null, "", location.pathname + location.search);
  return link;
}

const MODES: { mode: Mode; icon: typeof LogIn }[] = [
  { mode: "login", icon: LogIn }, { mode: "register", icon: Ticket }, { mode: "reset", icon: KeyRound },
];

const inputClass = "w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none";
const labelClass = "flex flex-col gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold";

/** The crest, the app's name and the tagline, as on the character list. */
function Brand({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang];
  return (
    <div className="flex flex-col items-center gap-3 text-center mb-6">
      <img src="/icon.svg" alt="" className="w-20 h-20 object-contain drop-shadow-lg" />
      <div>
        <h1 className="font-magic text-2xl md:text-3xl text-neutral-100 uppercase tracking-widest glow-amber">{t.appName}</h1>
        <p className="text-[10px] sm:text-xs font-mono text-neutral-400 tracking-wider mt-1">{t.tagline}</p>
      </div>
    </div>
  );
}

/** A centred card in the app's panel style, with corner filigree. */
function Card({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-xl border border-violet-500/15 p-6 sm:p-8" id={id}>
      <FiligreeCorner position="tl" className="w-8 h-8" />
      <FiligreeCorner position="tr" className="w-8 h-8" />
      <FiligreeCorner position="bl" className="w-8 h-8" />
      <FiligreeCorner position="br" className="w-8 h-8" />
      {children}
    </div>
  );
}

export function SignIn({ client, lang, onSignedIn }: {
  client: RemoteClient; lang: Language; onSignedIn: (user: ApiUser) => void;
}) {
  const t = remoteText[lang];
  const [link] = useState(takeCodeLink);
  const [mode, setMode] = useState<Mode>(link?.mode ?? "login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [token, setToken] = useState(link?.code ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // A link followed while this screen is open only changes the fragment.
  useEffect(() => {
    const follow = () => {
      const next = takeCodeLink();
      if (next) { setMode(next.mode); setToken(next.code); setMessage(""); setError(""); setPassword(""); setRepeat(""); }
    };
    addEventListener("hashchange", follow);
    return () => removeEventListener("hashchange", follow);
  }, []);

  const submit = async () => {
    if (localStorage.getItem("magistri_logout_pending")) { location.reload(); return; }
    // A new password is typed twice (owner decision, 8 November 2026).
    if (mode !== "login" && password !== repeat) { setError("password_mismatch"); setPassword(""); setRepeat(""); return; }
    // Phones add a space after a word; usernames never contain one. The username is
    // stored in lowercase, so the name as typed (capitals kept) is the display name.
    const name = username.trim(), code = token.trim();
    const body = mode === "login" ? { username: name, password } : mode === "register" ? { invitationToken: code, username: name, password, displayName: name } : { code, newPassword: password };
    const path = mode === "reset" ? "password-reset" : mode;
    setBusy(true); setError(""); setMessage("");
    try {
      // A refused sign-in is a 401 too: it is not an expired session (quiet401).
      const result = await client.request<{ user: ApiUser }>(`auth/${path}`, "POST", body, true);
      setPassword(""); setRepeat(""); setToken("");
      if (mode === "login") onSignedIn(result.user);
      else { setMessage(mode === "register" ? t.registered : t.resetDone); setMode("login"); }
    } catch (e) {
      setError(e instanceof ApiFailure ? e.code : "network_error");
    } finally { setBusy(false); }
  };

  const errorText = error ? SIGN_IN_ERRORS[lang][error] ?? `${t.failed} (${error})` : "";

  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-4 py-10 sm:py-16" id="sign-in-screen">
      <Brand lang={lang} />
      <Card id="sign-in-card">
        <div className="grid grid-cols-3 gap-1.5 mb-6" role="tablist">
          {MODES.map(({ mode: m, icon: Icon }) => (
            <button
              key={m}
              id={`btn-sign-in-mode-${m}`}
              type="button"
              role="tab"
              aria-selected={mode === m}
              disabled={busy}
              onClick={() => { setMode(m); setMessage(""); setError(""); setPassword(""); setRepeat(""); setToken(""); }}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider leading-tight transition-colors cursor-pointer ${
                mode === m ? "bg-violet-950/70 border-amber-500/50 text-amber-300" : "bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t[m]}</span>
            </button>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); void submit(); }}>
          <fieldset disabled={busy} className="space-y-4">
            {mode !== "reset" && (
              <label className={labelClass}>{t.username}
                <input id="input-sign-in-username" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
              </label>
            )}
            {mode !== "login" && (
              <label className={labelClass}>{mode === "reset" ? t.code : t.invitation}
                <input id="input-sign-in-code" required autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  value={token} onChange={e => setToken(e.target.value)} className={inputClass} />
              </label>
            )}
            <label className={labelClass}>{t.password}
              <input id="input-sign-in-password" required minLength={mode === "login" ? undefined : 12} type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
            </label>
            {mode !== "login" && (
              <label className={labelClass}>{remoteText[lang].repeatPassword}
                <input id="input-sign-in-password-repeat" required minLength={12} type="password" autoComplete="new-password"
                  value={repeat} onChange={e => setRepeat(e.target.value)} className={inputClass} />
              </label>
            )}

            {errorText && <p role="alert" className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/20 rounded-lg px-3 py-2">{errorText}</p>}
            {message && <p role="status" className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">{message}</p>}

            <button
              id="btn-sign-in-submit"
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold font-mono text-sm uppercase tracking-wider rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
            >
              {t[mode]}
            </button>
          </fieldset>
        </form>
      </Card>
    </div>
  );
}

/** Shown when the account belongs to several campaigns and none is chosen yet. */
export function CampaignChooser({ lang, campaigns, onChoose, onLogout }: {
  lang: Language; campaigns: { id: string; name: string }[]; onChoose: (id: string) => void; onLogout: () => void;
}) {
  const t = remoteText[lang];
  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-4 py-10 sm:py-16" id="campaign-chooser-screen">
      <Brand lang={lang} />
      <Card id="campaign-chooser-card">
        <h2 className="font-magic text-sm text-amber-400 uppercase tracking-widest text-center mb-5">{t.choose}</h2>
        {campaigns.length ? (
          <nav className="space-y-2" aria-label={t.campaign}>
            {campaigns.map(c => (
              <button key={c.id} type="button" onClick={() => onChoose(c.id)}
                className="w-full text-left px-4 py-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:border-amber-500/40 hover:bg-violet-950/40 text-neutral-200 text-sm transition-colors cursor-pointer">
                {c.name}
              </button>
            ))}
          </nav>
        ) : <p className="text-sm text-neutral-400 text-center">{t.noCampaign}</p>}
        <button type="button" onClick={onLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono cursor-pointer">
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>
      </Card>
    </div>
  );
}

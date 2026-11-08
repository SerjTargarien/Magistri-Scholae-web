// The demo test panel (R3.3): switch the viewer's role and simulate what the
// sheet store must survive. Demo builds only.
import { useState } from "react";
import "../remote/remote.css"; // the panel's styles
import type { Language } from "../localization";
import { mockServer, setOffline } from "./server";
import type { DemoRole } from "./fixtures";

const TEXT = {
  es: {
    title: "Panel de pruebas (demo)", viewAs: "Ver como", gm: "Directora (GM)", player: "Jugadora asignada", reader: "Lector compartido",
    connection: "Conexión", offline: "Sin conexión", online: "Con conexión", slow: "Respuestas lentas",
    nextSave: "Próximo guardado", failNetwork: "Se corta antes de llegar", failServer: "Error del servidor", loseReply: "Se pierde la respuesta",
    other: "Otra persona cambia", concepto: "el concepto", nombre: "el nombre", reset: "Restablecer datos de demostración", noSheet: "Abre una ficha primero",
  },
  en: {
    title: "Test panel (demo)", viewAs: "View as", gm: "GM", player: "Assigned player", reader: "Shared reader",
    connection: "Connection", offline: "Offline", online: "Online", slow: "Slow replies",
    nextSave: "Next save", failNetwork: "Lost before arriving", failServer: "Server error", loseReply: "Reply lost",
    other: "Someone else changes", concepto: "the concept", nombre: "the name", reset: "Reset demo data", noSheet: "Open a sheet first",
  },
};

export default function DemoPanel({ lang }: { lang: Language }) {
  const server = mockServer();
  const [, update] = useState(0);
  const [note, setNote] = useState("");
  if (!server) return null;
  const t = TEXT[lang];
  const refresh = () => update(v => v + 1);
  const viewAs = (role: DemoRole) => { server.signInAs(role); location.reload(); };
  const other = (path: "concepto" | "nombre") => setNote(server.otherEdit(path) ? `${t.other} ${t[path]} ✓` : t.noSheet);
  const role = server.state.viewer;
  return <aside className="demo-panel" aria-label={t.title}>
    <strong>{t.title}</strong>
    <div>{t.viewAs}: {(["gm", "player", "reader"] as const).map(r =>
      <button key={r} id={`demo-role-${r}`} aria-pressed={role === r} onClick={() => viewAs(r)}>{t[r]}</button>)}</div>
    <div>{t.connection}: <button id="demo-offline" aria-pressed={server.offline} onClick={() => { setOffline(!server.offline); refresh(); }}>
      {server.offline ? t.offline : t.online}</button>
      <button id="demo-slow" aria-pressed={server.slow} onClick={() => { server.slow = !server.slow; refresh(); }}>{t.slow}</button></div>
    <div>{t.nextSave}: <button id="demo-fail-network" onClick={() => { server.nextFailure = "network"; refresh(); }}>{t.failNetwork}</button>
      <button id="demo-fail-server" onClick={() => { server.nextFailure = "server"; refresh(); }}>{t.failServer}</button>
      <button id="demo-lose-reply" onClick={() => { server.nextFailure = "lostReply"; refresh(); }}>{t.loseReply}</button></div>
    <div>{t.other}: <button id="demo-other-concepto" onClick={() => other("concepto")}>{t.concepto}</button>
      <button id="demo-other-nombre" onClick={() => other("nombre")}>{t.nombre}</button></div>
    {note && <p role="status">{note}</p>}
    <button id="demo-reset" onClick={() => { server.reset(); location.reload(); }}>{t.reset}</button>
  </aside>;
}

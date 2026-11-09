// Journal entry titles (owner decision, 8–9 November 2026): an entry without a
// title stores none; the screens show one generated from the entry's own date,
// e.g. «Entrada del 09 nov, 12:30». Entries saved earlier keep the title they
// stored.
import type { Language } from "./catalogue";

export function journalTitle(entry: { titulo?: string; fecha?: number }, prefix: string, lang: Language): string {
  if (entry.titulo?.trim()) return entry.titulo;
  if (entry.fecha === undefined) return prefix.trim();
  const when = new Date(entry.fecha).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  return prefix + when;
}

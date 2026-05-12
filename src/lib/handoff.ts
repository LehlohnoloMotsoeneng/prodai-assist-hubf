// Cross-feature handoff via sessionStorage — tab-scoped, no backend round-trip.
const KEY = "prodai:handoff";

export type Handoff =
  | { kind: "task"; tasks: string; range?: string; source?: string }
  | { kind: "email"; subject: string; points: string; source?: string };

export function setHandoff(h: Handoff) {
  try { sessionStorage.setItem(KEY, JSON.stringify(h)); } catch { /* noop */ }
}
export function takeHandoff<T extends Handoff["kind"]>(kind: T): Extract<Handoff, { kind: T }> | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Handoff;
    if (parsed.kind !== kind) return null;
    sessionStorage.removeItem(KEY);
    return parsed as Extract<Handoff, { kind: T }>;
  } catch { return null; }
}

// Heuristic extractors so we don't need another AI round-trip.
export function extractActionItems(md: string): string {
  const lines = md.split("\n");
  const idx = lines.findIndex((l) => /action items/i.test(l));
  if (idx === -1) {
    return lines.filter((l) => /^[-*]\s+/.test(l)).slice(0, 12).join("\n");
  }
  const out: string[] = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^##\s+/.test(l)) break;
    if (/^\|.*\|$/.test(l) && !/^\|?\s*:?-+/.test(l) && !/owner.*action/i.test(l)) {
      const cells = l.slice(1, -1).split("|").map((c) => c.trim());
      // Owner | Action | Deadline
      if (cells.length >= 2) out.push(`${cells[1]}${cells[2] ? " (due " + cells[2] + ")" : ""}${cells[0] && cells[0] !== "TBD" ? " — " + cells[0] : ""}`);
    } else if (/^[-*]\s+/.test(l)) out.push(l.replace(/^[-*]\s+/, ""));
  }
  return out.join("\n");
}

export function extractSummary(md: string): string {
  const m = md.match(/##\s*Summary\s*\n([\s\S]*?)(?:\n##\s|$)/i);
  return (m ? m[1] : md).trim().slice(0, 800);
}

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
  const slice = idx === -1 ? lines : lines.slice(idx + 1);
  const out: string[] = [];
  for (const l of slice) {
    if (idx !== -1 && /^##\s+/.test(l)) break;
    if (/^\|.*\|$/.test(l)) {
      // Skip header + separator rows.
      if (/^\|?\s*:?-+/.test(l)) continue;
      const cells = l.slice(1, -1).split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length === 0) continue;
      const lower = cells.map((c) => c.toLowerCase());
      if (lower.includes("task") || lower.includes("owner") || lower.includes("action")) continue;
      // Try to detect Task vs Owner vs Deadline columns generically.
      const [a, b, c, d] = cells;
      const task = a;
      const owner = b && b !== "TBD" ? ` — ${b}` : "";
      const due = c ? ` (due ${c})` : "";
      const pri = d ? ` [${d}]` : "";
      out.push(`${task}${owner}${due}${pri}`);
    } else if (/^[-*]\s+/.test(l)) {
      out.push(l.replace(/^[-*]\s+/, ""));
    }
  }
  return out.slice(0, 20).join("\n");
}

export function extractSummary(md: string): string {
  const m = md.match(/##\s*(?:\d+\.\s*)?(?:Executive\s+)?Summary[^\n]*\n([\s\S]*?)(?:\n##\s|$)/i);
  return (m ? m[1] : md).trim().slice(0, 800);
}

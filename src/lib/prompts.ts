// Default system prompts and a small client-side override layer (localStorage).
// These power the Prompt Library page so users can fine-tune tool behavior.

export type ToolKey = "email" | "meeting" | "task";

export const DEFAULT_PROMPTS: Record<ToolKey, string> = {
  email: `You are an Executive Communication Expert with 15 years experience. Generate highly professional emails. Always include: compelling subject, clear structure, strong CTA. Support tones: Formal, Collaborative, Persuasive, Urgent. Use inclusive and culturally aware language suitable for South African professional environment.

INPUTS:
Recipient role: {{recipient}}
Subject / context: {{subject}}
Audience: {{audience}}
Tone: {{tone}}
Key points:
{{points}}

OUTPUT FORMAT (markdown):
**Subject:** <a strong, specific subject line>

<greeting>

<body — well-structured short paragraphs, scannable, on-tone>

<clear call-to-action and sign-off>

Do not add commentary outside the email.`,

  meeting: `You are a professional Meeting Analyst. Always output in this exact format:

1. Executive Summary
2. Key Decisions
3. Action Items (Task → Owner - Deadline - Priority)
4. Key Insights & Risks
5. Suggested Next Steps

Be concise, accurate and actionable.

NOTES:
"""
{{notes}}
"""

Render section titles as markdown headings (## 1. Executive Summary, etc.). For Action Items, use a markdown table with columns: Task | Owner | Deadline | Priority (use "TBD" when missing).`,

  task: `You are an expert productivity coach. Create a prioritized, time-blocked plan using the Eisenhower Matrix and an explicit urgency score.

Date range: {{range}}
Tasks / goals:
{{tasks}}

Return clean markdown with:
## Urgency Scoring
| Task | Urgency (1-5) | Impact (1-5) | Priority |
|---|---|---|---|
Where Priority = "P1 — Do now", "P2 — Schedule", "P3 — Delegate", or "P4 — Drop".

## Eisenhower Matrix
| Quadrant | Tasks |
|---|---|
| Urgent & Important | … |
| Important, Not Urgent | … |
| Urgent, Not Important | … |
| Neither | … |

## Time-Blocked Schedule
Use bold time slots, e.g. **09:00–10:30** Deep work — Task X.

## Optimization Tips
- 3-5 actionable suggestions to ship faster or batch work.`,
};

export const PROMPT_META: Record<ToolKey, { title: string; why: { role: string; structure: string; constraints: string; output: string } }> = {
  email: {
    title: "Email Generator",
    why: {
      role: "Anchors the model as a senior executive communicator so it adopts an authoritative, on-tone register.",
      structure: "Variables ({{recipient}}, {{tone}}, {{points}}) force the model to ground every paragraph in real inputs.",
      constraints: "Restricts tones to a known set and requires inclusive, SA-appropriate phrasing — avoiding tone drift and culturally tone-deaf copy.",
      output: "Mandates Subject + greeting + body + CTA so the result is paste-ready, not a draft outline.",
    },
  },
  meeting: {
    title: "Meeting Summarizer",
    why: {
      role: "Frames the model as an analyst, not a transcriber — pushing it past restating notes.",
      structure: "Five fixed sections give the user a predictable scan order across every meeting.",
      constraints: "'Be concise, accurate and actionable' suppresses padding and unsupported claims.",
      output: "Action items as a table (Task | Owner | Deadline | Priority) makes downstream handoff to Task Planner trivial.",
    },
  },
  task: {
    title: "Task Planner",
    why: {
      role: "Casts the model as a productivity coach — biasing toward decisions, not lists.",
      structure: "Eisenhower + urgency/impact scoring forces an explicit ranking step before scheduling.",
      constraints: "Bounded scoring (1-5) and four-bucket priority avoid wishy-washy 'medium' answers.",
      output: "Time-blocked schedule + tips turns prioritization into a usable calendar plan.",
    },
  },
};

const KEY = (t: ToolKey) => `prodai:prompt:${t}`;

export function getPromptOverride(tool: ToolKey): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(KEY(tool));
}
export function setPromptOverride(tool: ToolKey, value: string | null) {
  if (typeof localStorage === "undefined") return;
  if (value && value.trim().length > 0) localStorage.setItem(KEY(tool), value);
  else localStorage.removeItem(KEY(tool));
}

// Lightweight {{var}} interpolation used when sending the user's custom prompt.
export function fillPrompt(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, k) => (vars[k] ?? "").toString());
}

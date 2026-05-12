import { corsHeaders, callLovableAI } from "../_shared/cors.ts";

const PROMPTS = {
  email: ({ recipient, subject, points, tone, audience }: any) =>
    `You are an expert business writer. Draft a complete, ready-to-send email.

Recipient role: ${recipient || "—"}
Subject / context: ${subject || "—"}
Audience: ${audience || "—"}
Tone: ${tone || "Formal"}
Key points to cover:
${points || "—"}

Tone guidance:
- "Formal" — measured, professional, corporate.
- "Friendly" — warm, conversational, light contractions.
- "Persuasive" — confident, benefit-led, clear ask.
- "Urgent" — direct, time-sensitive, action-first.
- "Collaborative" — inclusive, "we/let's", invites input.
- "South African business English" — polite, professional South African register: courteous greetings ("Good day"), measured phrasing, occasional local idioms ("Kindly revert", "Please advise", "Trust this finds you well"), British spelling (organisation, realise, colour). Avoid slang. Match SA business etiquette.

Output format (markdown):
**Subject:** <a strong subject line>

<email body with greeting, well-structured paragraphs, and a clear call-to-action sign-off>

Keep it concise. Match the requested tone exactly. Do not add commentary.`,

  meeting: ({ notes }: any) =>
    `You are an expert meeting analyst. Summarize the following meeting notes / transcript.

NOTES:
"""
${notes || ""}
"""

Return clean markdown with these sections (omit a section only if truly empty):
## Summary
A 3-5 sentence executive summary.

## Key Decisions
- bullet list

## Action Items
| Owner | Action | Deadline |
|---|---|---|
(fill rows; use "TBD" if missing)

## Highlights
- notable quotes, risks, or follow-ups`,

  task: ({ tasks, range }: any) =>
    `You are an expert productivity coach. Create a prioritized, time-blocked plan using the Eisenhower Matrix and an explicit urgency score.

Date range: ${range || "today"}
Tasks / goals:
${tasks || ""}

Return clean markdown with:
## Urgency Scoring
Rank each task with an urgency score (1-5, where 5 = drop everything) and an impact score (1-5). Show as a table:
| Task | Urgency | Impact | Priority |
|---|---|---|---|
Where Priority = "P1 — Do now", "P2 — Schedule", "P3 — Delegate", or "P4 — Drop", derived from the matrix.

## Eisenhower Matrix
| Quadrant | Tasks |
|---|---|
| Urgent & Important | … |
| Important, Not Urgent | … |
| Urgent, Not Important | … |
| Neither | … |

## Time-Blocked Schedule
A realistic schedule for the date range using bold time slots, e.g. **09:00–10:30** Deep work — Task X.

## Optimization Tips
- 3-5 actionable suggestions to ship faster or batch work.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { tool, input, customPrompt } = await req.json();
    if (!tool || !(tool in PROMPTS)) {
      return new Response(JSON.stringify({ error: "Invalid tool" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const prompt = customPrompt && customPrompt.trim().length > 0
      ? customPrompt
      : (PROMPTS as any)[tool](input || {});

    const res = await callLovableAI({
      messages: [
        { role: "system", content: "You produce high-quality, immediately usable workplace artifacts in clean markdown." },
        { role: "user", content: prompt },
      ],
    });

    if (!res.ok) {
      const text = await res.text();
      const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: text || "Upstream error" }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const output = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ output, prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

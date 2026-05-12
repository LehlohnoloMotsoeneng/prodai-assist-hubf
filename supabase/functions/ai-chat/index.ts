import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are ProdAI Assistant, an AI productivity copilot for the workplace.
You help users draft emails, summarize meetings, plan tasks, and answer productivity questions.
Be concise, structured, and actionable. Use markdown for formatting (headings, bold, lists, code blocks).
When a user request is best served by a dedicated tool inside the app, briefly suggest it:
- Smart Email Generator (/email)
- Meeting Notes Summarizer (/meetings)
- AI Task Planner (/tasks)
Always end longer outputs with a one-line note: "AI-generated — please review for accuracy."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: text || "Upstream error" }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

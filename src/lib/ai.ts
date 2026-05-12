import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function runTool(
  tool: "email" | "meeting" | "task",
  input: Record<string, unknown>,
  customPrompt?: string,
): Promise<{ output: string; prompt: string }> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token ?? ANON;
  const res = await fetch(`${FUNCTIONS_URL}/ai-tool`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON,
    },
    body: JSON.stringify({ tool, input, customPrompt }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
    const t = await res.text();
    throw new Error(t || "AI request failed");
  }
  return res.json();
}

export async function streamChat(
  messages: { role: string; content: string }[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token ?? ANON;
  const res = await fetch(`${FUNCTIONS_URL}/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON,
    },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
    throw new Error(await res.text());
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return full;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return full;
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatThread,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

function ChatThread() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Load messages on thread change
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, role, content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages((data ?? []) as Msg[]);
    })();
    return () => { cancelled = true; };
  }, [threadId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Focus textarea
  useEffect(() => { taRef.current?.focus(); }, [threadId, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming || !user) return;
    setInput("");

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setStreaming(true);

    // Persist user message
    await supabase.from("chat_messages").insert({
      thread_id: threadId, user_id: user.id, role: "user", content: text,
    });

    // If this is the first message, set thread title from it
    if (messages.length === 0) {
      const title = text.slice(0, 60);
      await supabase.from("chat_threads").update({ title }).eq("id", threadId);
    } else {
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    }

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const full = await streamChat(history, (delta) => {
        setMessages((curr) => curr.map((m) => m.id === assistantId ? { ...m, content: m.content + delta } : m));
      });
      await supabase.from("chat_messages").insert({
        thread_id: threadId, user_id: user.id, role: "assistant", content: full,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Chat failed");
      setMessages((curr) => curr.map((m) => m.id === assistantId ? { ...m, content: "_Error: " + (e.message ?? "request failed") + "_" } : m));
    } finally {
      setStreaming(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggest={(s) => { setInput(s); taRef.current?.focus(); }} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            {messages.map((m) => <MessageBubble key={m.id} m={m} />)}
            {streaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1].content === "" && (
              <ThinkingShimmer />
            )}
          </div>
        )}
      </div>
      <div className="border-t bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl p-4">
          <div className="rounded-xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask the assistant anything…  (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <span className="text-[11px] text-muted-foreground">
                AI-generated — please review for accuracy.
              </span>
              <Button size="sm" onClick={send} disabled={streaming || !input.trim()}>
                {streaming ? "Thinking…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: Msg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
            {m.content}
          </div>
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <User className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand text-primary-foreground">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <article className="prose prose-sm max-w-none flex-1 dark:prose-invert prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
      </article>
    </div>
  );
}

function ThinkingShimmer() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand text-primary-foreground">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <span className="animate-pulse">Thinking…</span>
    </div>
  );
}

const SUGGESTIONS = [
  "Draft a polite follow-up email after a missed deadline",
  "Summarize the meeting notes I'll paste next",
  "Plan my week given 6 priorities and 4 hours of focus per day",
  "Suggest 5 ways to cut a 60-min meeting in half",
];

function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand text-primary-foreground shadow-lg">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">How can I help today?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask me to draft, summarize, plan, or research — I'll point you to the
        right tool when it makes sense.
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="rounded-lg border bg-card px-3 py-2.5 text-left text-sm transition hover:border-primary/60 hover:bg-accent/40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

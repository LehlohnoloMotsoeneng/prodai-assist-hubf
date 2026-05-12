import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Mail,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  Trash2,
  History as HistoryIcon,
  ArrowRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/history")({
  component: () => (
    <AppLayout>
      <HistoryPage />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Session History — ProdAI Assistant" },
      {
        name: "description",
        content: "Browse, open, and delete your saved AI tool runs and chat sessions.",
      },
    ],
  }),
});

type ToolSession = {
  id: string;
  tool: string;
  title: string;
  output: string;
  created_at: string;
};

type Thread = {
  id: string;
  title: string;
  updated_at: string;
};

const toolMeta: Record<string, { label: string; icon: typeof Mail }> = {
  email: { label: "Email", icon: Mail },
  meeting: { label: "Meeting", icon: CalendarCheck },
  task: { label: "Tasks", icon: ClipboardList },
};

type Tab = "tools" | "chats";

function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("tools");
  const [sessions, setSessions] = useState<ToolSession[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<ToolSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [s, t] = await Promise.all([
      supabase
        .from("tool_sessions")
        .select("id, tool, title, output, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("chat_threads")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false }),
    ]);
    setSessions(s.data ?? []);
    setThreads(t.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from("tool_sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Session deleted");
    if (selected?.id === id) setSelected(null);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteThread = async (id: string) => {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Conversation deleted");
    setThreads((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HistoryIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Session History</h1>
          <p className="text-sm text-muted-foreground">
            Saved tool runs and chat conversations from your workspace.
          </p>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-lg border bg-card p-1">
        {(["tools", "chats"] as const).map((k) => (
          <button
            key={k}
            onClick={() => {
              setTab(k);
              setSelected(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === k
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "tools"
              ? `Tool runs (${sessions.length})`
              : `Conversations (${threads.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : tab === "tools" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-2">
            {sessions.length === 0 && (
              <EmptyState
                title="No saved tool runs yet"
                desc="Generate something in the Email, Meeting, or Task tools and click Save."
              />
            )}
            {sessions.map((s) => {
              const meta = toolMeta[s.tool] ?? { label: s.tool, icon: HistoryIcon };
              const Icon = meta.icon;
              const active = selected?.id === s.id;
              return (
                <div
                  key={s.id}
                  className={`group flex items-start gap-2 rounded-lg border bg-card p-3 transition hover:border-primary/50 ${
                    active ? "border-primary/70 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <button
                    onClick={() => setSelected(s)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(s.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{s.title}</p>
                    </div>
                  </button>
                  <DeleteButton onConfirm={() => deleteSession(s.id)} label="run" />
                </div>
              );
            })}
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            {selected ? (
              <AiOutput output={selected.output} />
            ) : (
              <div className="rounded-xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
                Select a saved run to view its output.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.length === 0 && (
            <EmptyState
              title="No conversations yet"
              desc="Start a chat with the AI Assistant to build your history."
            />
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-2 rounded-lg border bg-card p-3 transition hover:border-primary/50"
            >
              <button
                onClick={() =>
                  navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                }
                className="flex flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title || "Untitled"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Updated {new Date(t.updated_at).toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <DeleteButton onConfirm={() => deleteThread(t.id)} label="conversation" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${label}`}
          className="opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes it from your history and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      <Link
        to="/"
        className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
      >
        Go to dashboard →
      </Link>
    </div>
  );
}

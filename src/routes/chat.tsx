import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: () => (
    <AppLayout>
      <ChatLayout />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "AI Assistant — ProdAI" },
      { name: "description", content: "Chat with your AI productivity copilot." },
    ],
  }),
});

type Thread = { id: string; title: string; updated_at: string };

function ChatLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const params = useParams({ strict: false }) as { threadId?: string };
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    const { data } = await supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    setThreads(data ?? []);
    setLoaded(true);
    return data ?? [];
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-create or select a thread when at /chat
  useEffect(() => {
    if (!loaded || !user) return;
    if (path !== "/chat") return;
    (async () => {
      if (threads.length > 0) {
        navigate({ to: "/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
      } else {
        const { data, error } = await supabase
          .from("chat_threads")
          .insert({ user_id: user.id, title: "New conversation" })
          .select("id")
          .single();
        if (error) return toast.error(error.message);
        await refresh();
        navigate({ to: "/chat/$threadId", params: { threadId: data.id }, replace: true });
      }
    })();
  }, [loaded, path, threads, user, navigate]);

  const newThread = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: user.id, title: "New conversation" })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    await refresh();
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  };

  const removeThread = async (id: string) => {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    const remaining = await refresh();
    if (params.threadId === id) {
      if (remaining.length > 0) navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
      else navigate({ to: "/chat" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <aside className="hidden w-64 shrink-0 border-r bg-card/30 md:flex md:flex-col">
        <div className="flex items-center justify-between border-b px-3 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </span>
          <Button size="icon-sm" variant="ghost" onClick={newThread} aria-label="New thread">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground">No conversations yet.</p>
          )}
          <ul className="space-y-0.5">
            {threads.map((t) => {
              const active = params.threadId === t.id;
              return (
                <li key={t.id} className="group flex items-center gap-1">
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className={`flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm transition ${
                      active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{t.title || "Untitled"}</span>
                  </Link>
                  <button
                    onClick={() => removeThread(t.id)}
                    aria-label="Delete thread"
                    className="opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

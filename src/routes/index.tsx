import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import {
  Mail,
  CalendarCheck,
  ClipboardList,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

const features = [
  {
    title: "Smart Email Generator",
    desc: "Draft polished, on-tone emails in seconds.",
    href: "/email",
    icon: Mail,
  },
  {
    title: "Meeting Summarizer",
    desc: "Turn raw notes into decisions and action items.",
    href: "/meetings",
    icon: CalendarCheck,
  },
  {
    title: "AI Task Planner",
    desc: "Prioritized, time-blocked plans for your week.",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    title: "AI Assistant",
    desc: "Chat with an AI copilot for any productivity task.",
    href: "/chat",
    icon: Bot,
  },
] as const;

// Rough time-saved estimates per artifact (minutes).
const TIME_SAVED = { email: 15, meeting: 30, task: 20 } as const;

function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ threads: 0, sessions: 0 });
  const [timeSaved, setTimeSaved] = useState({ week: 0, total: 0 });

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [t, s, allTools, weekTools] = await Promise.all([
        supabase.from("chat_threads").select("id", { count: "exact", head: true }),
        supabase.from("tool_sessions").select("id", { count: "exact", head: true }),
        supabase.from("tool_sessions").select("tool"),
        supabase.from("tool_sessions").select("tool").gte("created_at", weekAgo),
      ]);
      const sum = (rows: any[] | null) =>
        (rows ?? []).reduce((acc, r) => acc + (TIME_SAVED[r.tool as keyof typeof TIME_SAVED] ?? 10), 0);
      setCounts({ threads: t.count ?? 0, sessions: s.count ?? 0 });
      setTimeSaved({ total: sum(allTools.data), week: sum(weekTools.data) });
    })();
  }, []);

  const name = user?.email?.split("@")[0] ?? "there";
  const fmtHours = (m: number) => (m / 60).toFixed(1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Powered by Lovable AI
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, {name}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Your AI-powered workplace copilot. Pick a tool to get started, or
            jump into a chat with the assistant.
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          label="This week saved"
          value={`${fmtHours(timeSaved.week)}h`}
          accent
          hint="Estimated time vs. doing it manually"
        />
        <InsightCard label="Total time saved" value={`${fmtHours(timeSaved.total)}h`} />
        <InsightCard label="Saved sessions" value={String(counts.sessions)} />
        <InsightCard label="Conversations" value={String(counts.threads)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <Link
            key={f.href}
            to={f.href}
            className="group rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/60 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-brand/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function InsightCard({
  label, value, hint, accent,
}: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 ${
        accent ? "bg-gradient-to-br from-primary/10 to-brand/10 border-primary/30" : "bg-card"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

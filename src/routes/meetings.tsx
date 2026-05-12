import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarCheck, ClipboardList, Mail } from "lucide-react";
import { runTool } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Header } from "./email";
import { setHandoff, extractActionItems, extractSummary } from "@/lib/handoff";
import { getPromptOverride, fillPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/meetings")({
  component: () => (
    <AppLayout>
      <Page />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — ProdAI Assistant" },
      { name: "description", content: "Turn raw meeting notes into clear summaries, decisions, and action items." },
    ],
  }),
});

function Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [prompt, setPrompt] = useState<string | undefined>();
  const [customPrompt, setCustomPrompt] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!notes.trim()) return toast.error("Paste some notes first.");
    setLoading(true);
    try {
      const override = getPromptOverride("meeting");
      const filled = override ? fillPrompt(override, { notes }) : customPrompt;
      const r = await runTool("meeting", { notes }, filled);
      setOutput(r.output);
      setPrompt(r.prompt);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!user) return;
    const title = notes.split("\n")[0]?.slice(0, 60) || "Meeting summary";
    const { error } = await supabase.from("tool_sessions").insert({
      user_id: user.id, tool: "meeting", title, input: { notes }, output,
    });
    if (error) toast.error(error.message); else toast.success("Saved to history");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Header
        icon={<CalendarCheck className="h-5 w-5" />}
        title="Meeting Notes Summarizer"
        desc="Paste your notes or transcript — get a summary, decisions, and action items."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <Label>Meeting notes / transcript</Label>
          <Textarea
            rows={18}
            placeholder="Paste raw notes or a meeting transcript here…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="font-mono text-xs"
          />
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? "Summarizing…" : "Summarize meeting"}
          </Button>
        </div>
        <div>
          <AiOutput
            output={output}
            onChange={setOutput}
            onRegenerate={generate}
            loading={loading}
            onSave={output ? save : undefined}
            prompt={prompt}
            onPromptChange={setCustomPrompt}
            exportTitle="Meeting summary"
            calendarTitle="Meeting follow-up"
            extraActions={output ? [
              {
                label: "Create Tasks from Action Items",
                icon: <ClipboardList className="h-3.5 w-3.5" />,
                onClick: () => {
                  const tasks = extractActionItems(output);
                  if (!tasks) return toast.error("No action items detected.");
                  setHandoff({ kind: "task", tasks, range: "this week", source: "meeting" });
                  toast.success("Loaded into Task Planner");
                  navigate({ to: "/tasks" });
                },
              },
              {
                label: "Draft Follow-up Email",
                icon: <Mail className="h-3.5 w-3.5" />,
                onClick: () => {
                  setHandoff({
                    kind: "email",
                    subject: "Follow-up: " + (notes.split("\n")[0]?.slice(0, 60) || "meeting"),
                    points: extractSummary(output) + "\n\nAction items:\n" + extractActionItems(output),
                    source: "meeting",
                  });
                  toast.success("Loaded into Email Generator");
                  navigate({ to: "/email" });
                },
              },
            ] : undefined}
          />
        </div>
      </div>
    </div>
  );
}

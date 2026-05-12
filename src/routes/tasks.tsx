import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Mail } from "lucide-react";
import { runTool } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { setHandoff, takeHandoff } from "@/lib/handoff";
import { getPromptOverride, fillPrompt } from "@/lib/prompts";
import { Header } from "./email";

export const Route = createFileRoute("/tasks")({
  component: () => (
    <AppLayout>
      <Page />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Task Planner — ProdAI Assistant" },
      { name: "description", content: "Get a prioritized, time-blocked plan for your tasks and goals." },
    ],
  }),
});

function Page() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState("");
  const [range, setRange] = useState("today");
  const [output, setOutput] = useState("");
  const [prompt, setPrompt] = useState<string | undefined>();
  const [customPrompt, setCustomPrompt] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = takeHandoff("task");
    if (h) {
      setTasks(h.tasks);
      if (h.range) setRange(h.range);
      toast.message("Loaded from another tool — review and plan.");
    }
  }, []);

  const generate = async () => {
    if (!tasks.trim()) return toast.error("Add at least one task.");
    setLoading(true);
    try {
      const override = getPromptOverride("task");
      const filled = override ? fillPrompt(override, { tasks, range }) : customPrompt;
      const r = await runTool("task", { tasks, range }, filled);
      setOutput(r.output);
      setPrompt(r.prompt);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("tool_sessions").insert({
      user_id: user.id, tool: "task", title: `Plan (${range})`, input: { tasks, range }, output,
    });
    if (error) toast.error(error.message); else toast.success("Saved to history");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Header
        icon={<ClipboardList className="h-5 w-5" />}
        title="AI Task Planner"
        desc="Turn a list of tasks into a prioritized, time-blocked plan."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label>Date range</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this week">This week</SelectItem>
                <SelectItem value="next 2 weeks">Next 2 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tasks &amp; goals</Label>
            <Textarea
              rows={14}
              placeholder={"One task per line, e.g.\n• Ship onboarding revamp\n• Prep board update deck\n• 1:1s with team\n• Reply to vendor RFP"}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
            />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? "Planning…" : "Build plan"}
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
            exportTitle={`Plan (${range})`}
            calendarTitle={`Focus block — ${range}`}
          />
        </div>
      </div>
    </div>
  );
}

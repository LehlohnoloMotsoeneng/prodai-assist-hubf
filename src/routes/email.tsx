import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Mail } from "lucide-react";
import { runTool } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { setHandoff, takeHandoff } from "@/lib/handoff";
import { getPromptOverride, fillPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/email")({
  component: () => (
    <AppLayout>
      <EmailPage />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Email Generator — ProdAI Assistant" },
      { name: "description", content: "Generate ready-to-send business emails with AI." },
    ],
  }),
});

function EmailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [points, setPoints] = useState("");
  const [tone, setTone] = useState("Formal");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [prompt, setPrompt] = useState<string | undefined>();
  const [customPrompt, setCustomPrompt] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = takeHandoff("email");
    if (h) {
      setSubject(h.subject);
      setPoints(h.points);
      toast.message("Loaded from another tool — review and generate.");
    }
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const override = getPromptOverride("email");
      const filled = override
        ? fillPrompt(override, { recipient, subject, points, tone, audience })
        : customPrompt;
      const r = await runTool(
        "email",
        { recipient, subject, points, tone, audience },
        filled,
      );
      setOutput(r.output);
      setPrompt(r.prompt);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("tool_sessions").insert({
      user_id: user.id,
      tool: "email",
      title: subject || "Untitled email",
      input: { recipient, subject, points, tone, audience },
      output,
    });
    if (error) toast.error(error.message);
    else toast.success("Saved to history");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Header
        icon={<Mail className="h-5 w-5" />}
        title="Smart Email Generator"
        desc="Draft polished, on-tone emails in seconds."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <Field label="Recipient (role)">
            <Input
              placeholder="e.g. Engineering Director"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </Field>
          <Field label="Subject / Context">
            <Input
              placeholder="e.g. Follow-up on Q4 roadmap review"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <Field label="Audience">
            <Input
              placeholder="e.g. Internal leadership team"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </Field>
          <Field label="Tone">
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[
                  "Formal",
                  "Friendly",
                  "Persuasive",
                  "Urgent",
                  "Collaborative",
                  "South African business English",
                ].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Key points">
            <Textarea
              rows={6}
              placeholder="• decisions to highlight&#10;• asks / next steps&#10;• constraints"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Field>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? "Generating…" : "Generate email"}
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
            exportTitle={subject || "Email"}
            calendarTitle={subject ? `Send: ${subject}` : "Send email"}
            extraActions={output ? [
              {
                label: "Save tasks from this email",
                icon: <ClipboardList className="h-3.5 w-3.5" />,
                onClick: () => {
                  // Pull bullet/numbered lines from the email body as tasks.
                  const tasks = output
                    .split("\n")
                    .filter((l) => /^(\s*[-*•]\s+|\s*\d+\.\s+)/.test(l))
                    .map((l) => l.replace(/^(\s*[-*•]\s+|\s*\d+\.\s+)/, "").trim())
                    .filter(Boolean)
                    .slice(0, 15)
                    .join("\n");
                  if (!tasks) return toast.error("No bullet tasks detected in the email.");
                  setHandoff({ kind: "task", tasks, range: "this week", source: "email" });
                  toast.success("Loaded into Task Planner");
                  navigate({ to: "/tasks" });
                },
              },
            ] : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function Header({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-brand/15 text-primary">
        {icon}
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

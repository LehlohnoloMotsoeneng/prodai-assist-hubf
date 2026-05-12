import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Header } from "./email";
import {
  DEFAULT_PROMPTS,
  PROMPT_META,
  getPromptOverride,
  setPromptOverride,
  type ToolKey,
} from "@/lib/prompts";

export const Route = createFileRoute("/prompts")({
  component: () => (
    <AppLayout>
      <PromptLibrary />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Prompt Library — ProdAI Assistant" },
      { name: "description", content: "Inspect and customize the system prompts powering each ProdAI tool." },
    ],
  }),
});

const TOOLS: ToolKey[] = ["email", "meeting", "task"];

function PromptLibrary() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Header
        icon={<BookOpen className="h-5 w-5" />}
        title="Prompt Library"
        desc="Advanced mode — view and fine-tune the system prompts powering each tool."
      />
      <div className="space-y-6">
        {TOOLS.map((t) => <PromptCard key={t} tool={t} />)}
      </div>
    </div>
  );
}

function PromptCard({ tool }: { tool: ToolKey }) {
  const meta = PROMPT_META[tool];
  const def = DEFAULT_PROMPTS[tool];
  const [value, setValue] = useState(def);
  const [hasOverride, setHasOverride] = useState(false);

  useEffect(() => {
    const o = getPromptOverride(tool);
    if (o) { setValue(o); setHasOverride(true); }
  }, [tool]);

  const save = () => {
    setPromptOverride(tool, value === def ? null : value);
    setHasOverride(value !== def);
    toast.success(`Saved prompt for ${meta.title}`);
  };
  const reset = () => {
    setValue(def);
    setPromptOverride(tool, null);
    setHasOverride(false);
    toast.message("Reverted to default prompt");
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{meta.title}</h2>
          {hasOverride && <Badge variant="secondary" className="text-[10px]">Customized</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={save} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-[320px] font-mono text-xs"
        />
        <div className="space-y-3 text-xs">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why this prompt works
          </h3>
          <Why label="Role" text={meta.why.role} />
          <Why label="Structure" text={meta.why.structure} />
          <Why label="Constraints" text={meta.why.constraints} />
          <Why label="Output format" text={meta.why.output} />
          <p className="rounded-md border bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
            Use <code className="font-mono">{"{{variable}}"}</code> tokens to inject form fields.
          </p>
        </div>
      </div>
    </div>
  );
}

function Why({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-foreground">{label}</div>
      <div className="text-muted-foreground">{text}</div>
    </div>
  );
}

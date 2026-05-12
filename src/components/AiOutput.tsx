import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RefreshCw, Save, FileEdit, Download, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportPdf, exportDoc, exportIcs } from "@/lib/exports";

export type ExtraAction = { label: string; icon?: React.ReactNode; onClick: () => void };

export function AiOutput({
  output,
  onChange,
  onRegenerate,
  loading,
  onSave,
  prompt,
  onPromptChange,
  exportTitle = "ProdAI output",
  calendarTitle,
  extraActions,
}: {
  output: string;
  onChange?: (v: string) => void;
  onRegenerate?: () => void;
  loading?: boolean;
  onSave?: () => void;
  prompt?: string;
  onPromptChange?: (v: string) => void;
  exportTitle?: string;
  calendarTitle?: string;
  extraActions?: ExtraAction[];
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(prompt ?? "");

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1200);
  };

  if (!output && !loading) return null;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="text-sm font-medium">Output</div>
        <div className="flex items-center gap-1">
          {prompt !== undefined && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <FileEdit className="h-3.5 w-3.5" /> Prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>System prompt</DialogTitle>
                  <DialogDescription>
                    View or fine-tune the prompt sent to the model.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  className="min-h-[260px] font-mono text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      onPromptChange?.(draftPrompt);
                      toast.success("Prompt updated for next run");
                    }}
                  >
                    Save prompt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {onSave && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onSave}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          )}
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={loading}
              onClick={onRegenerate}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          )}
          {onChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Preview" : "Edit"}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </Button>
          {output && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportPdf(exportTitle, output)}>
                  <Download className="mr-2 h-3.5 w-3.5" /> PDF (print)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDoc(exportTitle, output)}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Word (.doc)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportIcs(calendarTitle ?? exportTitle, undefined, 30, output.slice(0, 600))}
                >
                  <CalendarPlus className="mr-2 h-3.5 w-3.5" /> Apply to Calendar (.ics)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {extraActions && extraActions.length > 0 && output && (
        <div className="flex flex-wrap gap-2 border-b bg-muted/20 px-4 py-2">
          {extraActions.map((a) => (
            <Button key={a.label} variant="outline" size="sm" className="gap-1.5" onClick={a.onClick}>
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      )}
      <div className="p-4">
        {loading && !output ? (
          <div className="space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : editing && onChange ? (
          <Textarea
            value={output}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[320px] font-mono text-sm"
          />
        ) : (
          <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-table:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </article>
        )}
      </div>
      <div className="border-t bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        ⚠️ AI-Generated Content • Please review for accuracy, tone, and facts before using. May contain errors.
      </div>
    </div>
  );
}

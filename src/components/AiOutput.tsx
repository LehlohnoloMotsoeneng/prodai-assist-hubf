import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RefreshCw, Save, FileEdit } from "lucide-react";
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
import { toast } from "sonner";

export function AiOutput({
  output,
  onChange,
  onRegenerate,
  loading,
  onSave,
  prompt,
  onPromptChange,
}: {
  output: string;
  onChange?: (v: string) => void;
  onRegenerate?: () => void;
  loading?: boolean;
  onSave?: () => void;
  prompt?: string;
  onPromptChange?: (v: string) => void;
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
        </div>
      </div>
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
      <div className="border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        AI-generated — please review for accuracy before sending or sharing.
      </div>
    </div>
  );
}

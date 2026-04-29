import { useRef, useState } from "react";
import { Upload, FileText, X, FileUp, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  "Music", "Film", "Fashion", "Chicago Culture", "Entertainment", "Sports", "RTG Breakdown", "Opinion",
];

const ACCEPTED =
  ".txt,.md,.markdown,.rtf,.pdf,.doc,.docx,.pages,.html,.htm";

const ACCEPT_LABEL = "TXT · MD · RTF · DOC/DOCX · PDF · Pages · HTML";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  onImported: (newArticleId: string) => void;
};

// Strip RTF control words to recover plain text — good enough for previews.
const stripRtf = (rtf: string): string => {
  let out = rtf.replace(/\\par[d]?/g, "\n");
  out = out.replace(/\{\\\*?[^{}]*\}/g, "");
  out = out.replace(/\\[a-zA-Z]+-?\d* ?/g, "");
  out = out.replace(/[{}]/g, "");
  return out.replace(/\n{3,}/g, "\n\n").trim();
};

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Try detecting <h1> as title
  return (doc.body?.innerText ?? "").replace(/\n{3,}/g, "\n\n").trim();
};

const stripMarkdown = (md: string): string => {
  // Keep mostly readable — strip heading markers for body, keep prose
  return md.trim();
};

const detectTitleAndBody = (text: string): { title: string; body: string } => {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const firstNonEmpty = lines.findIndex((l) => l.length > 0);
  if (firstNonEmpty === -1) return { title: "", body: "" };
  let title = lines[firstNonEmpty]
    .replace(/^#+\s*/, "")
    .replace(/^\*+\s*/, "")
    .slice(0, 140)
    .trim();
  const rest = lines.slice(firstNonEmpty + 1).join("\n").trim();
  return { title, body: rest || text.trim() };
};

const ImportArticleDialog = ({ open, onClose, userId, onImported }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pdfPlaceholder, setPdfPlaceholder] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Music");
  const [tags, setTags] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setParsing(false); setSaving(false);
    setPdfPlaceholder(false); setTitle(""); setBody("");
    setTags(""); setDragOver(false);
  };

  const close = () => { reset(); onClose(); };

  const handleFiles = async (files: FileList | File[]) => {
    const f = Array.from(files)[0];
    if (!f) return;
    setFile(f);
    setParsing(true);
    setPdfPlaceholder(false);

    try {
      const name = f.name.toLowerCase();
      const fallbackTitle = f.name.replace(/\.[^.]+$/, "").trim() || "Untitled Imported Article";

      // PDF / DOCX / Pages — backend processing not yet wired
      if (
        name.endsWith(".pdf") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx") ||
        name.endsWith(".pages")
      ) {
        setPdfPlaceholder(true);
        setTitle(fallbackTitle);
        setBody(
          `[${f.name}]\n\nDocument text extraction will be available when backend processing is connected. ` +
          `For now, this is a placeholder draft — paste or rewrite the article body below before saving.`
        );
        return;
      }

      const text = await f.text();
      let cleaned = "";
      if (name.endsWith(".rtf")) cleaned = stripRtf(text);
      else if (name.endsWith(".html") || name.endsWith(".htm")) cleaned = stripHtml(text);
      else if (name.endsWith(".md") || name.endsWith(".markdown")) cleaned = stripMarkdown(text);
      else cleaned = text;

      const { title: t, body: b } = detectTitleAndBody(cleaned);
      setTitle(t || fallbackTitle);
      setBody(b);
    } catch (e: any) {
      toast.error("Could not read file");
      setTitle(f.name.replace(/\.[^.]+$/, "") || "Untitled Imported Article");
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const saveDraft = async () => {
    const finalTitle = title.trim() || "Untitled Imported Article";
    setSaving(true);
    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: finalTitle,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        body: body || null,
        status: "draft" as const,
        author_id: userId,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Imported as draft");
    const newId = data!.id as string;
    reset();
    onClose();
    onImported(newId);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl bg-background border-border rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider text-base">
            Import Article
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a writing document and we'll turn it into an editable draft.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border border-dashed rounded-sm py-12 px-6 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40 hover:bg-surface/30"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground/70 mb-3" />
            <div className="font-display uppercase text-sm">Drag & drop or click to upload</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
              {ACCEPT_LABEL}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File chip */}
            <div className="flex items-center gap-3 border border-border rounded-sm p-3 bg-surface/40">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{file.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={reset}
                className="h-6 w-6 rounded-sm border border-border hover:border-foreground/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {parsing ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading document…
              </div>
            ) : (
              <>
                {pdfPlaceholder && (
                  <div className="flex items-start gap-2 border border-gold/30 bg-gold/10 text-gold rounded-sm p-3 text-[11px]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      PDF / DOCX / Pages text extraction will be available when backend processing is connected.
                      A placeholder draft will be created — you can paste or rewrite the body below.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Category
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-xs rounded-sm bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Tags (comma separated)
                    </Label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="h-9 text-xs bg-background border-border rounded-sm"
                      placeholder="chicago, music"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    Title
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled Imported Article"
                    className="h-10 text-sm bg-background border-border rounded-sm"
                  />
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    Body Preview · editable
                  </Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="bg-background border-border rounded-sm text-xs font-mono"
                    placeholder="Document content will appear here…"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    {body.length.toLocaleString()} characters · saved as Draft, refine in the full editor next.
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={close}
            className="rounded-sm uppercase tracking-widest text-[10px] h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!file || parsing || saving}
            onClick={saveDraft}
            className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileUp className="h-3 w-3 mr-1" />
            {saving ? "Saving…" : "Save as Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportArticleDialog;

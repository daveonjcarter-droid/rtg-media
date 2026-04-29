import { useEffect, useState } from "react";
import { History, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Revision = {
  id: string;
  created_at: string;
  reason: string | null;
  saved_by: string;
  snapshot: any;
};

type Props = {
  articleId: string;
  /** Restore the chosen snapshot back into the article row. */
  onRestored?: () => void;
};

const RevisionHistory = ({ articleId, onRestored }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("article_revisions")
        .select("id, created_at, reason, saved_by, snapshot")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) toast.error(error.message);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [open, articleId]);

  const restore = async (rev: Revision) => {
    if (!confirm("Restore this revision? Current draft state will be overwritten.")) return;
    setRestoring(true);
    // Strip identity fields from the snapshot before applying
    const snap = { ...(rev.snapshot ?? {}) };
    delete snap.id;
    delete snap.created_at;
    delete snap.author_id;
    delete snap.status;
    delete snap.published_at;
    const { error } = await supabase.from("articles").update(snap).eq("id", articleId);
    setRestoring(false);
    if (error) return toast.error(error.message);
    toast.success("Revision restored");
    setOpen(false);
    setPreview(null);
    onRestored?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-sm uppercase tracking-widest text-[10px]">
          <History className="h-3 w-3 mr-1.5" /> History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest text-lg flex items-center gap-2">
            <History className="h-4 w-4" /> Revision History
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-3 max-h-[60vh]">
          {/* Revision list */}
          <ScrollArea className="col-span-5 border border-border rounded-sm h-[55vh]">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground italic">No revisions saved yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setPreview(r)}
                    className={`w-full text-left p-3 hover:bg-secondary transition-colors ${preview?.id === r.id ? "bg-secondary" : ""}`}
                  >
                    <div className="text-xs font-medium">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                      {r.reason || "auto-saved"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Preview pane */}
          <div className="col-span-7 border border-border rounded-sm h-[55vh] flex flex-col">
            {!preview ? (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  Select a revision to preview
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-border">
                  <div className="font-display text-base uppercase leading-tight">
                    {preview.snapshot?.title || "Untitled"}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {new Date(preview.created_at).toLocaleString()}
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                  {preview.snapshot?.excerpt && (
                    <p className="text-xs text-muted-foreground italic mb-3">{preview.snapshot.excerpt}</p>
                  )}
                  {preview.snapshot?.body && (
                    <div className="text-xs whitespace-pre-wrap leading-relaxed">{preview.snapshot.body}</div>
                  )}
                  {Array.isArray(preview.snapshot?.body_blocks) && preview.snapshot.body_blocks.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {preview.snapshot.body_blocks.map((b: any, i: number) => (
                        <div key={i} className="text-xs border-l-2 border-border pl-3">
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{b.kind}</div>
                          <div className="mt-0.5">{b.text || b.headline || "—"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => preview && restore(preview)} disabled={!preview || restoring}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> {restoring ? "Restoring…" : "Restore Selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionHistory;

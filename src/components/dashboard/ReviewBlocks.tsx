import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Trash2, Plus, Type, Heading1, Quote, Image as ImageIcon, Images, AlertTriangle, ListChecks, Star, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type BlockKind =
  | "paragraph"
  | "heading"
  | "quote"
  | "pull_quote"
  | "highlight_quote"
  | "image"
  | "gallery"
  | "embed"
  | "pros_cons"
  | "spoiler"
  | "verdict";

export type ReviewBlock = {
  id: string;
  kind: BlockKind;
  text?: string;
  level?: 2 | 3;
  speaker?: string;
  url?: string;
  caption?: string;
  credit?: string;
  images?: { url: string; caption?: string; credit?: string }[];
  pros?: string[];
  cons?: string[];
  warning?: string;
  headline?: string;
  recommendation?: "recommended" | "mixed" | "not_recommended";
};

export const newBlock = (kind: BlockKind): ReviewBlock => {
  const base = { id: crypto.randomUUID(), kind } as ReviewBlock;
  switch (kind) {
    case "heading": return { ...base, text: "", level: 2 };
    case "paragraph": return { ...base, text: "" };
    case "quote":
    case "pull_quote":
    case "highlight_quote": return { ...base, text: "", speaker: "" };
    case "image": return { ...base, url: "", caption: "", credit: "" };
    case "gallery": return { ...base, images: [{ url: "", caption: "", credit: "" }] };
    case "pros_cons": return { ...base, pros: [""], cons: [""] };
    case "spoiler": return { ...base, warning: "Spoiler warning", text: "" };
    case "verdict": return { ...base, headline: "Final Verdict", text: "", recommendation: "recommended" };
  }
};

export const BLOCK_OPTIONS: { kind: BlockKind; label: string; icon: any }[] = [
  { kind: "paragraph", label: "Paragraph", icon: Type },
  { kind: "heading", label: "Heading", icon: Heading1 },
  { kind: "quote", label: "Inline Quote", icon: Quote },
  { kind: "pull_quote", label: "Pull Quote", icon: Quote },
  { kind: "highlight_quote", label: "Highlight Quote", icon: Quote },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "gallery", label: "Image Gallery", icon: Images },
  { kind: "pros_cons", label: "Pros / Cons", icon: ListChecks },
  { kind: "spoiler", label: "Spoiler Warning", icon: AlertTriangle },
  { kind: "verdict", label: "Final Verdict", icon: Star },
];

const inputCls = "h-9 text-xs bg-background border-border rounded-sm";
const textareaCls = "bg-background border-border rounded-sm text-xs";
const labelCls = "text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block";

export const BlockEditor = ({
  block,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  index,
  total,
}: {
  block: ReviewBlock;
  onChange: (b: ReviewBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  index: number;
  total: number;
}) => {
  const set = (patch: Partial<ReviewBlock>) => onChange({ ...block, ...patch });

  return (
    <div className="border border-border rounded-sm bg-surface/30">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface/40">
        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          #{index + 1} · {BLOCK_OPTIONS.find((o) => o.kind === block.kind)?.label ?? block.kind}
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={onMoveUp} disabled={index === 0} title="Move up"><ArrowUp className="h-3 w-3" /></button>
          <button type="button" className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={onMoveDown} disabled={index === total - 1} title="Move down"><ArrowDown className="h-3 w-3" /></button>
          <button type="button" className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={onDuplicate} title="Duplicate"><Copy className="h-3 w-3" /></button>
          <button type="button" className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-destructive" onClick={onDelete} title="Delete"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {block.kind === "paragraph" && (
          <Textarea rows={4} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Write…" className={textareaCls} />
        )}

        {block.kind === "heading" && (
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Input value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Section heading" className={inputCls} />
            <Select value={String(block.level ?? 2)} onValueChange={(v) => set({ level: Number(v) as 2 | 3 })}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2" className="text-xs">H2</SelectItem>
                <SelectItem value="3" className="text-xs">H3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(block.kind === "quote" || block.kind === "pull_quote" || block.kind === "highlight_quote") && (
          <>
            <Textarea rows={3} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Quote text" className={textareaCls} />
            <Input value={block.speaker ?? ""} onChange={(e) => set({ speaker: e.target.value })} placeholder="Speaker / source" className={inputCls} />
          </>
        )}

        {block.kind === "image" && (
          <>
            <Input value={block.url ?? ""} onChange={(e) => set({ url: e.target.value })} placeholder="Image URL (https://…)" className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <Input value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption" className={inputCls} />
              <Input value={block.credit ?? ""} onChange={(e) => set({ credit: e.target.value })} placeholder="Credit" className={inputCls} />
            </div>
            {block.url && <img src={block.url} alt="" className="mt-1 aspect-[16/9] w-full object-cover border border-border rounded-sm" />}
          </>
        )}

        {block.kind === "gallery" && (
          <div className="space-y-2">
            {(block.images ?? []).map((img, i) => (
              <div key={i} className="border border-border rounded-sm p-2 space-y-1.5 bg-background/40">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Image {i + 1}</div>
                  <div className="flex gap-0.5">
                    <button type="button" className="h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}
                      onClick={() => { const arr = [...(block.images ?? [])]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; set({ images: arr }); }}><ArrowUp className="h-3 w-3" /></button>
                    <button type="button" className="h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === (block.images?.length ?? 0) - 1}
                      onClick={() => { const arr = [...(block.images ?? [])]; [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; set({ images: arr }); }}><ArrowDown className="h-3 w-3" /></button>
                    <button type="button" className="h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                      onClick={() => { const arr = (block.images ?? []).filter((_, j) => j !== i); set({ images: arr }); }}><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
                <Input value={img.url} onChange={(e) => { const arr = [...(block.images ?? [])]; arr[i] = { ...arr[i], url: e.target.value }; set({ images: arr }); }} placeholder="Image URL" className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={img.caption ?? ""} onChange={(e) => { const arr = [...(block.images ?? [])]; arr[i] = { ...arr[i], caption: e.target.value }; set({ images: arr }); }} placeholder="Caption" className={inputCls} />
                  <Input value={img.credit ?? ""} onChange={(e) => { const arr = [...(block.images ?? [])]; arr[i] = { ...arr[i], credit: e.target.value }; set({ images: arr }); }} placeholder="Credit" className={inputCls} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="rounded-sm uppercase tracking-widest text-[10px] h-8 w-full"
              onClick={() => set({ images: [...(block.images ?? []), { url: "", caption: "", credit: "" }] })}>
              <Plus className="h-3 w-3 mr-1" /> Add Image
            </Button>
          </div>
        )}

        {block.kind === "pros_cons" && (
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className={labelCls}>Pros</Label>
              {(block.pros ?? []).map((p, i) => (
                <div key={i} className="flex gap-1 mb-1">
                  <Input value={p} onChange={(e) => { const arr = [...(block.pros ?? [])]; arr[i] = e.target.value; set({ pros: arr }); }} placeholder="Strength" className={inputCls} />
                  <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => set({ pros: (block.pros ?? []).filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="rounded-sm text-[10px] h-7 w-full uppercase tracking-widest" onClick={() => set({ pros: [...(block.pros ?? []), ""] })}><Plus className="h-3 w-3 mr-1" /> Pro</Button>
            </div>
            <div>
              <Label className={labelCls}>Cons</Label>
              {(block.cons ?? []).map((c, i) => (
                <div key={i} className="flex gap-1 mb-1">
                  <Input value={c} onChange={(e) => { const arr = [...(block.cons ?? [])]; arr[i] = e.target.value; set({ cons: arr }); }} placeholder="Weakness" className={inputCls} />
                  <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => set({ cons: (block.cons ?? []).filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="rounded-sm text-[10px] h-7 w-full uppercase tracking-widest" onClick={() => set({ cons: [...(block.cons ?? []), ""] })}><Plus className="h-3 w-3 mr-1" /> Con</Button>
            </div>
          </div>
        )}

        {block.kind === "spoiler" && (
          <>
            <Input value={block.warning ?? ""} onChange={(e) => set({ warning: e.target.value })} placeholder="Warning headline" className={inputCls} />
            <Textarea rows={3} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Spoiler content" className={textareaCls} />
          </>
        )}

        {block.kind === "verdict" && (
          <>
            <Input value={block.headline ?? ""} onChange={(e) => set({ headline: e.target.value })} placeholder="Verdict headline" className={inputCls} />
            <Textarea rows={3} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Final verdict paragraph" className={textareaCls} />
            <Select value={block.recommendation ?? "recommended"} onValueChange={(v) => set({ recommendation: v as ReviewBlock["recommendation"] })}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended" className="text-xs">Recommended</SelectItem>
                <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
                <SelectItem value="not_recommended" className="text-xs">Not Recommended</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    </div>
  );
};

export const AddBlockBar = ({ onAdd }: { onAdd: (kind: BlockKind) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-dashed border-border rounded-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground py-2.5 flex items-center justify-center gap-1.5">
        <Plus className="h-3 w-3" /> Add Block
      </button>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2 border-t border-border">
          {BLOCK_OPTIONS.map((o) => (
            <button key={o.kind} type="button" onClick={() => { onAdd(o.kind); setOpen(false); }}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-1.5 border border-border rounded-sm hover:bg-surface/60 hover:border-foreground/40">
              <o.icon className="h-3 w-3" /> {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const StarRatingInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const full = value >= i + 1;
          const half = !full && value >= i + 0.5;
          return (
            <div key={i} className="relative h-6 w-6">
              <Star className={`h-6 w-6 ${full ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
              {half && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="h-6 w-6 fill-primary text-primary" />
                </div>
              )}
              <button type="button" aria-label={`${i + 0.5} stars`} onClick={() => onChange(i + 0.5)} className="absolute inset-y-0 left-0 w-1/2" />
              <button type="button" aria-label={`${i + 1} stars`} onClick={() => onChange(i + 1)} className="absolute inset-y-0 right-0 w-1/2" />
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{value.toFixed(1)} / 5</span>
      {value > 0 && (
        <button type="button" onClick={() => onChange(0)} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Clear</button>
      )}
    </div>
  );
};

export const StarRatingDisplay = ({ value, size = 16 }: { value: number; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const full = value >= i + 1;
        const half = !full && value >= i + 0.5;
        return (
          <div key={i} className="relative" style={{ height: size, width: size }}>
            <Star style={{ height: size, width: size }} className={full ? "fill-primary text-primary" : "text-muted-foreground/40"} />
            {half && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star style={{ height: size, width: size }} className="fill-primary text-primary" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const REVIEW_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "heading", text: "Opening Reaction", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Story Overview", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Performances", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Direction & Cinematography", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Themes", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "pros_cons", pros: [""], cons: [""] },
  { id: crypto.randomUUID(), kind: "verdict", headline: "Final Verdict", text: "", recommendation: "recommended" },
];

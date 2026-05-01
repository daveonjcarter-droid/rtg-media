import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, X } from "lucide-react";
import { uploadProfileMedia, classifyExternalUrl, type MediaKind } from "@/lib/mediaUpload";

type Props = {
  userId: string;
  folder?: "avatars" | "portfolio" | "resumes" | "covers";
  accept?: string;
  currentUrl?: string | null;
  /** Called with the permanent cloud (or external) URL and the detected kind. */
  onChange: (url: string, kind: MediaKind | "external_url") => void;
  onClear?: () => void;
  label?: string;
  allowUrl?: boolean;
  preview?: "image" | "thumb" | "none";
};

export const MediaUploader = ({
  userId,
  folder = "portfolio",
  accept = "image/*,video/*,application/pdf",
  currentUrl,
  onChange,
  onClear,
  label = "Add media",
  allowUrl = true,
  preview = "image",
}: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setProgress(15);
    try {
      // Supabase JS doesn't expose progress events for browser uploads,
      // so we animate a soft progress bar to signal activity.
      const tick = setInterval(() => setProgress((p) => Math.min(85, p + 7)), 250);
      const { url, kind } = await uploadProfileMedia(userId, file, folder);
      clearInterval(tick);
      setProgress(100);
      onChange(url, kind);
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setTimeout(() => setProgress(0), 400);
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      // Basic validation
      new URL(trimmed);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }
    const kind = classifyExternalUrl(trimmed);
    onChange(trimmed, kind);
    setUrlInput("");
    toast.success("Link added");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button type="button" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload File"}
        </Button>
        {currentUrl && onClear && (
          <Button type="button" size="sm" variant="outline" onClick={onClear} disabled={busy}>
            <X className="h-4 w-4" /> Remove
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      {progress > 0 && <Progress value={progress} className="h-1.5" />}

      {allowUrl && (
        <div className="flex gap-2">
          <Input
            placeholder="…or paste a URL (YouTube, Vimeo, Drive, image, etc.)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrl())}
          />
          <Button type="button" size="sm" variant="outline" onClick={handleUrl}>
            <LinkIcon className="h-4 w-4" /> Add URL
          </Button>
        </div>
      )}

      {currentUrl && preview !== "none" && (
        <div className="pt-1">
          {/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i.test(currentUrl) ? (
            <img
              src={currentUrl}
              alt="preview"
              className={preview === "thumb" ? "h-20 w-20 object-cover rounded" : "max-h-40 rounded border border-border/40"}
            />
          ) : (
            <a href={currentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">
              {currentUrl}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

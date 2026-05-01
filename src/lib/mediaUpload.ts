import { supabase } from "@/integrations/supabase/client";

export const PROFILE_MEDIA_BUCKET = "profile-media";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

export type MediaKind = "image" | "video" | "pdf";

export const detectKind = (file: File): MediaKind | null => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return null;
};

export const validateFile = (file: File): { ok: true; kind: MediaKind } | { ok: false; error: string } => {
  const kind = detectKind(file);
  if (!kind) return { ok: false, error: "Unsupported file type. Use image, video, or PDF." };
  const max = kind === "image" ? MAX_IMAGE_BYTES : kind === "video" ? MAX_VIDEO_BYTES : MAX_PDF_BYTES;
  if (file.size > max) {
    return { ok: false, error: `File too large. Max ${(max / (1024 * 1024)).toFixed(0)}MB for ${kind}.` };
  }
  return { ok: true, kind };
};

const sanitizeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "file";

/** Upload a file to the user's folder in profile-media. Returns the permanent public URL. */
export const uploadProfileMedia = async (
  userId: string,
  file: File,
  folder: "avatars" | "portfolio" | "resumes" | "covers" = "portfolio",
): Promise<{ url: string; path: string; kind: MediaKind }> => {
  const v = validateFile(file);
  if (!v.ok) throw new Error(v.error);
  const kind = v.kind;

  const path = `${userId}/${folder}/${Date.now()}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from(PROFILE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, kind: v.kind };
};

export const deleteProfileMediaByUrl = async (url: string): Promise<void> => {
  // Public URL pattern: .../object/public/profile-media/<path>
  const marker = `/object/public/${PROFILE_MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // external URL, nothing to delete from storage
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove([path]);
};

/** Best-effort URL classifier for pasted links (YouTube, Vimeo, etc.) */
export const classifyExternalUrl = (url: string): "image" | "video" | "pdf" | "external_url" => {
  const u = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/.test(u)) return "image";
  if (/\.(mp4|mov|webm|m4v)(\?|$)/.test(u)) return "video";
  if (/\.pdf(\?|$)/.test(u)) return "pdf";
  if (/(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com\/reel)/.test(u)) return "video";
  return "external_url";
};

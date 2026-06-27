export type MediaAsset = {
  url: string;
  path: string;
  bucket: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  title?: string | null;
  alt?: string | null;
};

export type VideoAsset = MediaAsset & {
  duration?: number | null;
  posterUrl?: string | null;
};

export type ImageAsset = MediaAsset;

export const MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;
export const DEFAULT_STORAGE_BUCKET = "public";

const VIDEO_DIRECTORY_BY_FIELD: Record<string, string> = {
  backgroundVideo: "videos/hero",
  showreelVideo: "videos/showreel",
  video: "videos/services",
};

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

export const isVideoMimeType = (mimeType: string) => ALLOWED_VIDEO_MIME_TYPES.has(mimeType);

export const getDefaultMediaDirectory = (fieldName: string) =>
  VIDEO_DIRECTORY_BY_FIELD[fieldName] ?? "videos/uploads";

export const normalizeStorageDirectory = (directory: string) => {
  const cleaned = directory.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");

  if (!cleaned || (!cleaned.startsWith("videos/") && !cleaned.startsWith("images/"))) {
    throw new Error("Ungueltiges Upload-Ziel.");
  }

  return cleaned;
};

export const sanitizeFilename = (filename: string) => {
  const normalized = filename.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  const trimmed = normalized.replace(/^-+|-+$/g, "");

  return trimmed.length > 0 ? trimmed.toLowerCase() : "asset";
};

export const buildStoragePath = ({
  directory,
  filename,
}: {
  directory: string;
  filename: string;
}) => {
  const normalizedDirectory = normalizeStorageDirectory(directory);
  const safeFilename = sanitizeFilename(filename);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const nonce = Math.random().toString(36).slice(2, 8);

  return `${normalizedDirectory}/${timestamp}-${nonce}-${safeFilename}`;
};

export const getStorageBucket = () =>
  process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;

export const getVideoUrl = (asset?: VideoAsset | null) => {
  const url = asset?.url?.trim();
  return url ? url : null;
};

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

export type VideoSourceType = "upload" | "vimeo";

export type VideoAsset = MediaAsset & {
  sourceType?: VideoSourceType | null;
  vimeoUrl?: string | null;
  duration?: number | null;
  posterUrl?: string | null;
};

export type ImageAsset = MediaAsset;

export const MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const DEFAULT_STORAGE_BUCKET = "public";

const VIDEO_DIRECTORY_BY_FIELD: Record<string, string> = {
  backgroundVideo: "videos/hero",
  showreelVideo: "videos/showreel",
  video: "videos/services",
};

const IMAGE_DIRECTORY_BY_FIELD: Record<string, string> = {
  logo: "images/logo",
};

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

export const isVideoMimeType = (mimeType: string) => ALLOWED_VIDEO_MIME_TYPES.has(mimeType);
export const isImageMimeType = (mimeType: string) => ALLOWED_IMAGE_MIME_TYPES.has(mimeType);

export const getDefaultMediaDirectory = (fieldName: string) =>
  VIDEO_DIRECTORY_BY_FIELD[fieldName] ?? "videos/uploads";

export const getDefaultImageDirectory = (fieldName: string) =>
  IMAGE_DIRECTORY_BY_FIELD[fieldName] ?? "images/uploads";

export const normalizeStorageDirectory = (directory: string) => {
  const cleaned = directory.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");

  if (
    !cleaned ||
    (cleaned !== "videos" &&
      cleaned !== "images" &&
      !cleaned.startsWith("videos/") &&
      !cleaned.startsWith("images/"))
  ) {
    throw new Error("Ungültiges Upload-Ziel.");
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

export const extractVimeoVideoId = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (!hostname.endsWith("vimeo.com")) {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);

    for (let index = segments.length - 1; index >= 0; index -= 1) {
      if (/^\d+$/.test(segments[index])) {
        return segments[index];
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const getVideoSourceType = (asset?: VideoAsset | null): VideoSourceType | null => {
  if (!asset) {
    return null;
  }

  if (asset.sourceType === "upload" || asset.sourceType === "vimeo") {
    return asset.sourceType;
  }

  if (extractVimeoVideoId(asset.vimeoUrl || asset.url)) {
    return "vimeo";
  }

  if (asset.url?.trim() || asset.path?.trim()) {
    return "upload";
  }

  return null;
};

export const getVideoUrl = (asset?: VideoAsset | null) => {
  if (getVideoSourceType(asset) === "vimeo") {
    return null;
  }

  const url = asset?.url?.trim();
  return url ? url : null;
};

export const getVimeoUrl = (asset?: VideoAsset | null) => {
  const explicitUrl = asset?.vimeoUrl?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const fallbackUrl = asset?.url?.trim();
  return extractVimeoVideoId(fallbackUrl) ? fallbackUrl : null;
};

export const getVimeoEmbedUrl = (
  asset?: VideoAsset | null,
  options?: {
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    background?: boolean;
    controls?: boolean;
  },
) => {
  const videoId = extractVimeoVideoId(getVimeoUrl(asset));

  if (!videoId) {
    return null;
  }

  const url = new URL(`https://player.vimeo.com/video/${videoId}`);

  if (options?.background) {
    url.searchParams.set("background", "1");
    url.searchParams.set("autopause", "0");
  }

  if (options?.autoplay) {
    url.searchParams.set("autoplay", "1");
  }

  if (options?.muted) {
    url.searchParams.set("muted", "1");
  }

  if (options?.loop) {
    url.searchParams.set("loop", "1");
  }

  if (options?.controls === false) {
    url.searchParams.set("controls", "0");
  }

  url.searchParams.set("title", "0");
  url.searchParams.set("byline", "0");
  url.searchParams.set("portrait", "0");

  return url.toString();
};

export const getImageUrl = (asset?: ImageAsset | null) => {
  const url = asset?.url?.trim();
  return url ? url : null;
};

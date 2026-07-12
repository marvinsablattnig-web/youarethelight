import type {
  Media,
  MediaList,
  MediaListOptions,
  MediaStore,
  MediaUploadOptions,
} from "tinacms";

import { getSupabaseAuthHeaders } from "@/lib/cms/media-browser";
import { MAX_VIDEO_UPLOAD_BYTES } from "@/lib/cms/media";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type MediaManagerItem = Media & {
  bucket?: string;
  path?: string;
};

type ListResponse = {
  items?: MediaManagerItem[];
  nextOffset?: string | number;
  error?: string;
};

type SignedUploadResponse = {
  bucket?: string;
  path?: string;
  publicUrl?: string;
  token?: string;
  error?: string;
};

const DEFAULT_MANAGER_DIRECTORY = "videos";
const DEFAULT_UPLOAD_DIRECTORY = "videos/uploads";

const resolveManagerDirectory = (directory?: string) => {
  const trimmed = directory?.trim().replace(/^\/+|\/+$/g, "");

  if (!trimmed) {
    return DEFAULT_MANAGER_DIRECTORY;
  }

  return trimmed;
};

const resolveUploadDirectory = (directory?: string) => {
  const trimmed = directory?.trim().replace(/^\/+|\/+$/g, "");

  if (!trimmed || trimmed === DEFAULT_MANAGER_DIRECTORY) {
    return DEFAULT_UPLOAD_DIRECTORY;
  }

  return trimmed;
};

export class SupabaseMediaStore implements MediaStore {
  accept = "video/*";

  maxSize = MAX_VIDEO_UPLOAD_BYTES;

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const authHeaders = await getSupabaseAuthHeaders();

    const uploaded = await Promise.all(
      files.map(async ({ directory, file }) => {
        const uploadDirectory = resolveUploadDirectory(directory);
        const signedUploadResponse = await fetch("/api/admin/media/signed-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            directory: uploadDirectory,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          }),
        });

        const signedUploadBody = (await signedUploadResponse.json()) as SignedUploadResponse;

        if (!signedUploadResponse.ok) {
          throw new Error(signedUploadBody.error || "Upload-URL konnte nicht erstellt werden.");
        }

        const supabase = getSupabaseBrowserClient();
        const bucket = signedUploadBody.bucket || "public";
        const path = signedUploadBody.path || "";
        const token = signedUploadBody.token || "";
        const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
          contentType: file.type,
          upsert: false,
        });

        if (error) {
          throw new Error(error.message);
        }

        const filename = path.split("/").pop() || file.name;

        return {
          id: path,
          type: "file" as const,
          filename,
          directory: uploadDirectory,
          sourceType: "upload" as const,
          src: signedUploadBody.publicUrl || "",
          thumbnails: signedUploadBody.publicUrl
            ? {
                "75x75": signedUploadBody.publicUrl,
                "400x400": signedUploadBody.publicUrl,
              }
            : undefined,
        };
      }),
    );

    return uploaded;
  }

  async delete(media: Media): Promise<void> {
    const item = media as MediaManagerItem;
    const path = item.path || item.id || [item.directory, item.filename].filter(Boolean).join("/");

    const response = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      body: JSON.stringify({
        bucket: item.bucket,
        path,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error || "Asset konnte nicht geloescht werden.");
    }
  }

  async list(options?: MediaListOptions): Promise<MediaList> {
    const params = new URLSearchParams();
    const directory = resolveManagerDirectory(options?.directory);

    params.set("directory", directory);

    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    if (options?.offset) {
      params.set("offset", String(options.offset));
    }

    if (options?.filesOnly) {
      params.set("filesOnly", "true");
    }

    const response = await fetch(`/api/admin/media/list?${params.toString()}`, {
      headers: await getSupabaseAuthHeaders(),
    });
    const body = (await response.json()) as ListResponse;

    if (!response.ok) {
      throw new Error(body.error || "Media-Liste konnte nicht geladen werden.");
    }

    return {
      items: body.items || [],
      nextOffset: body.nextOffset,
    };
  }

  parse(media: Media): string {
    return media.src || "";
  }
}

import React, { useState } from "react";

import { getSupabaseAuthHeaders } from "../../lib/cms/media-browser";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  getDefaultImageDirectory,
  getImageUrl,
  type ImageAsset,
} from "../../lib/cms/media";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

type ImageFieldInput = {
  value?: ImageAsset | null;
  onChange: (value: ImageAsset | null) => void;
};

type ImageAssetFieldProps = {
  field: {
    name: string;
    label?: string | boolean;
    description?: string;
  };
  input: ImageFieldInput;
};

type LibraryItem = ImageAsset & {
  filename: string;
  type?: "file" | "dir";
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const readImageMetadata = (file: File) =>
  new Promise<Pick<ImageAsset, "width" | "height">>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      cleanup();
      resolve({
        width: image.naturalWidth || null,
        height: image.naturalHeight || null,
      });
    };

    image.onerror = () => {
      cleanup();
      resolve({
        width: null,
        height: null,
      });
    };

    image.src = objectUrl;
  });

export const ImageAssetField = ({ field, input }: ImageAssetFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentAsset = input.value ?? null;
  const directory = getDefaultImageDirectory(field.name);

  const loadLibrary = async () => {
    setError(null);
    setIsLoadingLibrary(true);

    try {
      const response = await fetch(
        `/api/admin/media/list?directory=${encodeURIComponent(directory)}`,
        {
          headers: await getSupabaseAuthHeaders(),
        },
      );

      const body = (await response.json()) as { error?: string; items?: LibraryItem[] };

      if (!response.ok) {
        throw new Error(body.error || "Die Media-Liste konnte nicht geladen werden.");
      }

      setLibrary((body.items || []).filter((item) => item.type !== "dir"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Die Media-Liste konnte nicht geladen werden.");
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError("Die Datei ist zu gross fuer den Bild-Upload.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const metadata = await readImageMetadata(file);
      const authHeaders = await getSupabaseAuthHeaders();
      const signedUploadResponse = await fetch("/api/admin/media/signed-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          directory,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      const signedUploadBody = (await signedUploadResponse.json()) as {
        error?: string;
        bucket?: string;
        path?: string;
        publicUrl?: string;
        token?: string;
      };

      if (!signedUploadResponse.ok) {
        throw new Error(signedUploadBody.error || "Upload-URL konnte nicht erzeugt werden.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(signedUploadBody.bucket || "public")
        .uploadToSignedUrl(
          signedUploadBody.path || "",
          signedUploadBody.token || "",
          file,
          {
            contentType: file.type,
            upsert: false,
          },
        );

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      input.onChange({
        url: signedUploadBody.publicUrl || "",
        path: signedUploadBody.path || "",
        bucket: signedUploadBody.bucket || "public",
        mimeType: file.type,
        size: file.size,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        alt: file.name.replace(/\.[^.]+$/, ""),
        title: file.name.replace(/\.[^.]+$/, ""),
      });
      await loadLibrary();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDelete = async () => {
    if (!currentAsset?.path) {
      input.onChange(null);
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(await getSupabaseAuthHeaders()),
        },
        body: JSON.stringify({
          bucket: currentAsset.bucket,
          path: currentAsset.path,
        }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Asset konnte nicht geloescht werden.");
      }

      input.onChange(null);
      await loadLibrary();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Asset konnte nicht geloescht werden.");
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{field.label || "Bild"}</p>
          <p className="text-xs text-slate-500">{field.description || directory}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">
            {isUploading ? "Upload laeuft..." : "Bild hochladen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
              className="hidden"
              disabled={isUploading}
              onChange={onUpload}
            />
          </label>
          <button
            type="button"
            onClick={() => void loadLibrary()}
            disabled={isLoadingLibrary}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:opacity-60"
          >
            {isLoadingLibrary ? "Lade Library..." : "Library laden"}
          </button>
          {currentAsset ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
            >
              Entfernen
            </button>
          ) : null}
        </div>
      </div>

      {currentAsset ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {getImageUrl(currentAsset) ? (
            <img
              className="max-h-40 w-full bg-white object-contain"
              src={getImageUrl(currentAsset) || undefined}
              alt={currentAsset.alt || currentAsset.title || "Logo"}
            />
          ) : null}
          <div className="grid gap-2 p-4 text-xs text-slate-600">
            <p className="font-medium text-slate-900">{currentAsset.title || currentAsset.path}</p>
            <p>{currentAsset.path}</p>
            <p>
              {currentAsset.mimeType} · {formatFileSize(currentAsset.size)}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          Noch kein Bild gesetzt.
        </div>
      )}

      {library.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {library.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                input.onChange({
                  url: item.url,
                  path: item.path,
                  bucket: item.bucket,
                  mimeType: item.mimeType,
                  size: item.size,
                  width: item.width ?? null,
                  height: item.height ?? null,
                  title: item.title ?? null,
                  alt: item.alt ?? null,
                })
              }
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-slate-400"
            >
              {getImageUrl(item) ? (
                <img
                  className="aspect-[3/2] w-full bg-white object-contain"
                  src={getImageUrl(item) || undefined}
                  alt={item.alt || item.title || item.filename}
                />
              ) : null}
              <div className="p-3 text-xs text-slate-600">
                <p className="font-medium text-slate-900">{item.title || item.filename}</p>
                <p className="mt-1">{item.path}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
};

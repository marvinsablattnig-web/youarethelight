import React, { useState } from "react";

import { getSupabaseAuthHeaders } from "../../lib/cms/media-browser";
import {
  MAX_VIDEO_UPLOAD_BYTES,
  extractVimeoVideoId,
  getDefaultMediaDirectory,
  getVideoSourceType,
  getVideoUrl,
  getVimeoEmbedUrl,
  type VideoAsset,
  type VideoSourceType,
} from "../../lib/cms/media";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

type VideoFieldInput = {
  value?: VideoAsset | null;
  onChange: (value: VideoAsset | null) => void;
};

type VideoAssetFieldProps = {
  field: {
    name: string;
    label?: string | boolean;
    description?: string;
  };
  input: VideoFieldInput;
};

type LibraryItem = VideoAsset & {
  filename: string;
  type?: "file" | "dir";
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const createVideoAsset = (sourceType: VideoSourceType): VideoAsset => ({
  sourceType,
  url: "",
  vimeoUrl: "",
  path: "",
  bucket: "",
  mimeType: sourceType === "vimeo" ? "video/vimeo" : "",
  size: 0,
  width: null,
  height: null,
  duration: null,
  posterUrl: null,
  alt: null,
  title: null,
});

const readVideoMetadata = (file: File) =>
  new Promise<Pick<VideoAsset, "width" | "height" | "duration">>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objectUrl;
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : null;
      const width = video.videoWidth || null;
      const height = video.videoHeight || null;
      cleanup();
      resolve({ duration, width, height });
    };

    video.onerror = () => {
      cleanup();
      resolve({ duration: null, width: null, height: null });
    };
  });

export const VideoAssetField = ({ field, input }: VideoAssetFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentAsset = input.value ?? null;
  const currentSourceType = getVideoSourceType(currentAsset) ?? "upload";
  const directory = getDefaultMediaDirectory(field.name);
  const currentVimeoUrl =
    currentAsset?.vimeoUrl?.trim() || (currentSourceType === "vimeo" ? currentAsset?.url?.trim() || "" : "");
  const currentVimeoPreview = getVimeoEmbedUrl(currentAsset, {
    autoplay: true,
    muted: true,
    loop: true,
    controls: false,
    background: true,
  });

  const setSourceType = (sourceType: VideoSourceType) => {
    setError(null);

    if (sourceType === currentSourceType && currentAsset) {
      input.onChange({
        ...createVideoAsset(sourceType),
        ...currentAsset,
        sourceType,
      });
      return;
    }

    input.onChange({
      ...createVideoAsset(sourceType),
      title: currentAsset?.title ?? null,
      alt: currentAsset?.alt ?? null,
      posterUrl: currentAsset?.posterUrl ?? null,
    });
  };

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

    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setError("Die Datei ist zu groß für den vordefinierten Upload-Flow.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const metadata = await readVideoMetadata(file);
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

      const nextAsset: VideoAsset = {
        sourceType: "upload",
        url: signedUploadBody.publicUrl || "",
        vimeoUrl: "",
        path: signedUploadBody.path || "",
        bucket: signedUploadBody.bucket || "public",
        mimeType: file.type,
        size: file.size,
        duration: metadata.duration ?? null,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        posterUrl: null,
        alt: null,
        title: file.name.replace(/\.[^.]+$/, ""),
      };

      input.onChange(nextAsset);
      await loadLibrary();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const onChangeVimeoUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUrl = event.target.value;

    input.onChange({
      ...createVideoAsset("vimeo"),
      ...currentAsset,
      sourceType: "vimeo",
      url: "",
      vimeoUrl: nextUrl,
      path: "",
      bucket: "",
      mimeType: "video/vimeo",
      size: 0,
    });
  };

  const onDelete = async () => {
    if (currentSourceType !== "upload" || !currentAsset?.path) {
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
        throw new Error(body.error || "Asset konnte nicht gelöscht werden.");
      }

      input.onChange(null);
      await loadLibrary();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Asset konnte nicht gelöscht werden.");
    }
  };

  const renderCurrentPreview = () => {
    if (!currentAsset) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          Noch kein Video gesetzt.
        </div>
      );
    }

    if (currentSourceType === "vimeo") {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {currentVimeoPreview ? (
            <iframe
              src={currentVimeoPreview}
              title={currentAsset.title || "Vimeo Video"}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              className="aspect-video w-full bg-black"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-slate-950 px-4 text-center text-sm text-slate-300">
              Vimeo-Link einfügen, um die Vorschau zu sehen.
            </div>
          )}
          <div className="grid gap-2 p-4 text-xs text-slate-600">
            <p className="font-medium text-slate-900">{currentAsset.title || "Vimeo Video"}</p>
            <p className="break-all">{currentVimeoUrl || "Noch kein Vimeo-Link gesetzt."}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {getVideoUrl(currentAsset) ? (
          <video
            className="aspect-video w-full bg-black object-cover"
            src={getVideoUrl(currentAsset) || undefined}
            poster={currentAsset.posterUrl || undefined}
            controls
            preload="metadata"
          />
        ) : null}
        <div className="grid gap-2 p-4 text-xs text-slate-600">
          <p className="font-medium text-slate-900">{currentAsset.title || currentAsset.path}</p>
          <p>{currentAsset.path}</p>
          <p>
            {currentAsset.mimeType} · {formatFileSize(currentAsset.size)}
            {currentAsset.duration ? ` · ${currentAsset.duration.toFixed(1)}s` : ""}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{field.label || "Video"}</p>
          <p className="text-xs text-slate-500">{field.description || directory}</p>
        </div>
        <div className="inline-flex rounded-full border border-slate-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setSourceType("upload")}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              currentSourceType === "upload"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setSourceType("vimeo")}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              currentSourceType === "vimeo"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Vimeo Link
          </button>
        </div>
      </div>

      {currentSourceType === "upload" ? (
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">
            {isUploading ? "Upload läuft..." : "Video hochladen"}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
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
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Vimeo URL
          </label>
          <input
            type="url"
            value={currentVimeoUrl}
            onChange={onChangeVimeoUrl}
            placeholder="https://vimeo.com/123456789"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          {currentVimeoUrl && !extractVimeoVideoId(currentVimeoUrl) ? (
            <p className="text-xs text-rose-600">Der Link enthält keine gültige Vimeo-Video-ID.</p>
          ) : null}
          {currentAsset ? (
            <button
              type="button"
              onClick={() => input.onChange(null)}
              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
            >
              Entfernen
            </button>
          ) : null}
        </div>
      )}

      {renderCurrentPreview()}

      {currentSourceType === "upload" && library.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {library.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                input.onChange({
                  ...item,
                  sourceType: "upload",
                  vimeoUrl: "",
                })
              }
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-slate-400"
            >
              {getVideoUrl(item) ? (
                <video
                  className="aspect-video w-full bg-black object-cover"
                  src={getVideoUrl(item) || undefined}
                  muted
                  playsInline
                  preload="metadata"
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

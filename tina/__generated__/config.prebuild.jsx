var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/supabase/browser.ts
import { createClient } from "@supabase/supabase-js";
var browserClient, requirePublicEnv, getSupabaseBrowserClient;
var init_browser = __esm({
  "lib/supabase/browser.ts"() {
    "use strict";
    browserClient = null;
    requirePublicEnv = (name) => {
      const value = process.env[name];
      if (!value) {
        throw new Error(`Missing required public environment variable: ${name}`);
      }
      return value;
    };
    getSupabaseBrowserClient = () => {
      if (browserClient) {
        return browserClient;
      }
      browserClient = createClient(
        requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
        requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        }
      );
      return browserClient;
    };
  }
});

// lib/cms/media-browser.ts
var getSupabaseAuthHeaders;
var init_media_browser = __esm({
  "lib/cms/media-browser.ts"() {
    "use strict";
    init_browser();
    getSupabaseAuthHeaders = async () => {
      const {
        data: { session }
      } = await getSupabaseBrowserClient().auth.getSession();
      if (!session?.access_token) {
        return {};
      }
      return {
        Authorization: `Bearer ${session.access_token}`
      };
    };
  }
});

// lib/cms/media.ts
var MAX_VIDEO_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_BYTES, VIDEO_DIRECTORY_BY_FIELD, IMAGE_DIRECTORY_BY_FIELD, getDefaultMediaDirectory, getDefaultImageDirectory, extractVimeoVideoId, getVideoSourceType, getVideoUrl, getVimeoUrl, getVimeoEmbedUrl, getImageUrl;
var init_media = __esm({
  "lib/cms/media.ts"() {
    "use strict";
    MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;
    MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
    VIDEO_DIRECTORY_BY_FIELD = {
      backgroundVideo: "videos/hero",
      showreelVideo: "videos/showreel",
      video: "videos/services"
    };
    IMAGE_DIRECTORY_BY_FIELD = {
      logo: "images/logo"
    };
    getDefaultMediaDirectory = (fieldName) => VIDEO_DIRECTORY_BY_FIELD[fieldName] ?? "videos/uploads";
    getDefaultImageDirectory = (fieldName) => IMAGE_DIRECTORY_BY_FIELD[fieldName] ?? "images/uploads";
    extractVimeoVideoId = (value) => {
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
    getVideoSourceType = (asset) => {
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
    getVideoUrl = (asset) => {
      if (getVideoSourceType(asset) === "vimeo") {
        return null;
      }
      const url = asset?.url?.trim();
      return url ? url : null;
    };
    getVimeoUrl = (asset) => {
      const explicitUrl = asset?.vimeoUrl?.trim();
      if (explicitUrl) {
        return explicitUrl;
      }
      const fallbackUrl = asset?.url?.trim();
      return extractVimeoVideoId(fallbackUrl) ? fallbackUrl : null;
    };
    getVimeoEmbedUrl = (asset, options) => {
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
    getImageUrl = (asset) => {
      const url = asset?.url?.trim();
      return url ? url : null;
    };
  }
});

// tina/media/supabase-media-store.ts
var supabase_media_store_exports = {};
__export(supabase_media_store_exports, {
  SupabaseMediaStore: () => SupabaseMediaStore
});
var DEFAULT_MANAGER_DIRECTORY, DEFAULT_UPLOAD_DIRECTORY, resolveManagerDirectory, resolveUploadDirectory, SupabaseMediaStore;
var init_supabase_media_store = __esm({
  "tina/media/supabase-media-store.ts"() {
    "use strict";
    init_media_browser();
    init_media();
    init_browser();
    DEFAULT_MANAGER_DIRECTORY = "videos";
    DEFAULT_UPLOAD_DIRECTORY = "videos/uploads";
    resolveManagerDirectory = (directory) => {
      const trimmed = directory?.trim().replace(/^\/+|\/+$/g, "");
      if (!trimmed) {
        return DEFAULT_MANAGER_DIRECTORY;
      }
      return trimmed;
    };
    resolveUploadDirectory = (directory) => {
      const trimmed = directory?.trim().replace(/^\/+|\/+$/g, "");
      if (!trimmed || trimmed === DEFAULT_MANAGER_DIRECTORY) {
        return DEFAULT_UPLOAD_DIRECTORY;
      }
      return trimmed;
    };
    SupabaseMediaStore = class {
      constructor() {
        this.accept = "video/*";
        this.maxSize = MAX_VIDEO_UPLOAD_BYTES;
      }
      async persist(files) {
        const authHeaders = await getSupabaseAuthHeaders();
        const uploaded = await Promise.all(
          files.map(async ({ directory, file }) => {
            const uploadDirectory = resolveUploadDirectory(directory);
            const signedUploadResponse = await fetch("/api/admin/media/signed-upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders
              },
              body: JSON.stringify({
                directory: uploadDirectory,
                filename: file.name,
                mimeType: file.type,
                size: file.size
              })
            });
            const signedUploadBody = await signedUploadResponse.json();
            if (!signedUploadResponse.ok) {
              throw new Error(signedUploadBody.error || "Upload-URL konnte nicht erstellt werden.");
            }
            const supabase = getSupabaseBrowserClient();
            const bucket = signedUploadBody.bucket || "public";
            const path = signedUploadBody.path || "";
            const token = signedUploadBody.token || "";
            const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
              contentType: file.type,
              upsert: false
            });
            if (error) {
              throw new Error(error.message);
            }
            const filename = path.split("/").pop() || file.name;
            return {
              id: path,
              type: "file",
              filename,
              directory: uploadDirectory,
              sourceType: "upload",
              src: signedUploadBody.publicUrl || "",
              thumbnails: signedUploadBody.publicUrl ? {
                "75x75": signedUploadBody.publicUrl,
                "400x400": signedUploadBody.publicUrl
              } : void 0
            };
          })
        );
        return uploaded;
      }
      async delete(media) {
        const item = media;
        const path = item.path || item.id || [item.directory, item.filename].filter(Boolean).join("/");
        const response = await fetch("/api/admin/media", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...await getSupabaseAuthHeaders()
          },
          body: JSON.stringify({
            bucket: item.bucket,
            path
          })
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "Asset konnte nicht geloescht werden.");
        }
      }
      async list(options) {
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
          headers: await getSupabaseAuthHeaders()
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error || "Media-Liste konnte nicht geladen werden.");
        }
        return {
          items: body.items || [],
          nextOffset: body.nextOffset
        };
      }
      parse(media) {
        return media.src || "";
      }
    };
  }
});

// tina/config.ts
import { defineConfig, LocalAuthProvider } from "tinacms";

// tina/auth/provider.tsx
init_browser();
import { useEffect, useState } from "react";
import { AbstractAuthProvider } from "tinacms";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var getAccessToken = async () => {
  const {
    data: { session }
  } = await getSupabaseBrowserClient().auth.getSession();
  return session?.access_token ?? null;
};
var SupabaseLoginScreen = ({ handleAuthenticate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  useEffect(() => {
    let isMounted = true;
    const checkAuthorization = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          return;
        }
        const response = await fetch("/api/admin/session", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok && isMounted) {
          const body = await response.json().catch(() => null);
          setError(body?.error || "Dieses Konto darf den Admin-Bereich nicht verwalten.");
        }
      } catch {
        if (isMounted) {
          setError("Die aktuelle Session konnte nicht gepr\xFCft werden.");
        }
      }
    };
    void checkAuthorization();
    return () => {
      isMounted = false;
    };
  }, []);
  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      await handleAuthenticate({
        email,
        password
      });
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error ? submitError.message : "Die Anmeldung ist fehlgeschlagen."
      );
    }
  };
  return jsx("div", { className: "min-h-screen bg-slate-950 px-6 py-10 text-slate-100", children: jsxs("div", { className: "mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur", children: [
    jsxs("div", { className: "mb-8", children: [
      jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.28em] text-amber-300", children: "Tina Admin" }),
      jsx("h1", { className: "mt-3 text-3xl font-semibold tracking-tight text-white", children: "Editor Login" }),
      jsx("p", { className: "mt-3 text-sm leading-6 text-slate-300", children: "Melde dich mit deinem freigeschalteten Supabase-Konto an." })
    ] }),
    jsxs("form", { className: "space-y-4", onSubmit, children: [
      jsxs("label", { className: "block", children: [
        jsx("span", { className: "mb-2 block text-sm font-medium text-slate-200", children: "E-Mail" }),
        jsx(
          "input",
          {
            type: "email",
            required: true,
            autoComplete: "email",
            value: email,
            onChange: (event) => setEmail(event.target.value),
            className: "w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-amber-300",
            placeholder: "editor@example.com"
          }
        )
      ] }),
      jsxs("label", { className: "block", children: [
        jsx("span", { className: "mb-2 block text-sm font-medium text-slate-200", children: "Passwort" }),
        jsx(
          "input",
          {
            type: "password",
            required: true,
            autoComplete: "current-password",
            value: password,
            onChange: (event) => setPassword(event.target.value),
            className: "w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-amber-300",
            placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          }
        )
      ] }),
      jsx(
        "button",
        {
          type: "submit",
          disabled: status === "sending",
          className: "w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70",
          children: status === "sending" ? "Wird angemeldet..." : "Anmelden"
        }
      )
    ] }),
    error ? jsx("p", { className: "mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200", children: error }) : null
  ] }) });
};
SupabaseLoginScreen.displayName = "SupabaseLoginScreen";
var TinaSessionProvider = ({ children }) => jsx(Fragment, { children });
TinaSessionProvider.displayName = "TinaSessionProvider";
var SupabaseTinaAuthProvider = class extends AbstractAuthProvider {
  async authenticate(props) {
    const email = props?.email?.trim().toLowerCase();
    const password = props?.password;
    if (!email) {
      throw new Error("Bitte gib eine E-Mail-Adresse ein.");
    }
    if (!password) {
      throw new Error("Bitte gib dein Passwort ein.");
    }
    const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.session?.access_token) {
      throw new Error("Es wurde keine g\xFCltige Session zur\xFCckgegeben.");
    }
    window.location.reload();
    return {
      id_token: data.session.access_token
    };
  }
  async getUser() {
    const {
      data: { user },
      error
    } = await getSupabaseBrowserClient().auth.getUser();
    if (error) {
      return null;
    }
    return user;
  }
  async getToken() {
    const {
      data: { session }
    } = await getSupabaseBrowserClient().auth.getSession();
    if (!session?.access_token) {
      return null;
    }
    return {
      id_token: session.access_token,
      access_token: session.access_token,
      refresh_token: session.refresh_token
    };
  }
  async authorize() {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }
    const response = await fetch("/api/admin/session", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  }
  async logout() {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.assign("/admin/index.html");
  }
  getLoginStrategy() {
    return "LoginScreen";
  }
  getLoginScreen() {
    return SupabaseLoginScreen;
  }
  getSessionProvider() {
    return TinaSessionProvider;
  }
};

// tina/fields/image-asset-field.tsx
init_media_browser();
init_media();
init_browser();
import { useState as useState2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var formatFileSize = (size) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};
var readImageMetadata = (file) => new Promise((resolve) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  const cleanup = () => {
    URL.revokeObjectURL(objectUrl);
  };
  image.onload = () => {
    cleanup();
    resolve({
      width: image.naturalWidth || null,
      height: image.naturalHeight || null
    });
  };
  image.onerror = () => {
    cleanup();
    resolve({
      width: null,
      height: null
    });
  };
  image.src = objectUrl;
});
var ImageAssetField = ({ field, input }) => {
  const [isUploading, setIsUploading] = useState2(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState2(false);
  const [library, setLibrary] = useState2([]);
  const [error, setError] = useState2(null);
  const currentAsset = input.value ?? null;
  const directory = getDefaultImageDirectory(field.name);
  const loadLibrary = async () => {
    setError(null);
    setIsLoadingLibrary(true);
    try {
      const response = await fetch(
        `/api/admin/media/list?directory=${encodeURIComponent(directory)}`,
        {
          headers: await getSupabaseAuthHeaders()
        }
      );
      const body = await response.json();
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
  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError("Die Datei ist zu gro\xDF f\xFCr den Bild-Upload.");
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
          ...authHeaders
        },
        body: JSON.stringify({
          directory,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        })
      });
      const signedUploadBody = await signedUploadResponse.json();
      if (!signedUploadResponse.ok) {
        throw new Error(signedUploadBody.error || "Upload-URL konnte nicht erzeugt werden.");
      }
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage.from(signedUploadBody.bucket || "public").uploadToSignedUrl(
        signedUploadBody.path || "",
        signedUploadBody.token || "",
        file,
        {
          contentType: file.type,
          upsert: false
        }
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
        title: file.name.replace(/\.[^.]+$/, "")
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
          ...await getSupabaseAuthHeaders()
        },
        body: JSON.stringify({
          bucket: currentAsset.bucket,
          path: currentAsset.path
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Asset konnte nicht gel\xF6scht werden.");
      }
      input.onChange(null);
      await loadLibrary();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Asset konnte nicht gel\xF6scht werden.");
    }
  };
  return jsxs2("div", { className: "space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4", children: [
    jsxs2("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      jsxs2("div", { children: [
        jsx2("p", { className: "text-sm font-semibold text-slate-900", children: field.label || "Bild" }),
        jsx2("p", { className: "text-xs text-slate-500", children: field.description || directory })
      ] }),
      jsxs2("div", { className: "flex flex-wrap gap-2", children: [
        jsxs2("label", { className: "inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700", children: [
          isUploading ? "Upload l\xE4uft..." : "Bild hochladen",
          jsx2(
            "input",
            {
              type: "file",
              accept: "image/jpeg,image/png,image/webp,image/svg+xml,image/avif",
              className: "hidden",
              disabled: isUploading,
              onChange: onUpload
            }
          )
        ] }),
        jsx2(
          "button",
          {
            type: "button",
            onClick: () => void loadLibrary(),
            disabled: isLoadingLibrary,
            className: "rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:opacity-60",
            children: isLoadingLibrary ? "Lade Library..." : "Library laden"
          }
        ),
        currentAsset ? jsx2(
          "button",
          {
            type: "button",
            onClick: () => void onDelete(),
            className: "rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700",
            children: "Entfernen"
          }
        ) : null
      ] })
    ] }),
    currentAsset ? jsxs2("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white", children: [
      getImageUrl(currentAsset) ? jsx2(
        "img",
        {
          className: "max-h-40 w-full bg-white object-contain",
          src: getImageUrl(currentAsset) || void 0,
          alt: currentAsset.alt || currentAsset.title || "Logo"
        }
      ) : null,
      jsxs2("div", { className: "grid gap-2 p-4 text-xs text-slate-600", children: [
        jsx2("p", { className: "font-medium text-slate-900", children: currentAsset.title || currentAsset.path }),
        jsx2("p", { children: currentAsset.path }),
        jsxs2("p", { children: [
          currentAsset.mimeType,
          " \xB7 ",
          formatFileSize(currentAsset.size)
        ] })
      ] })
    ] }) : jsx2("div", { className: "rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500", children: "Noch kein Bild gesetzt." }),
    library.length > 0 ? jsx2("div", { className: "grid gap-3 md:grid-cols-2", children: library.map((item) => jsxs2(
      "button",
      {
        type: "button",
        onClick: () => input.onChange({
          url: item.url,
          path: item.path,
          bucket: item.bucket,
          mimeType: item.mimeType,
          size: item.size,
          width: item.width ?? null,
          height: item.height ?? null,
          title: item.title ?? null,
          alt: item.alt ?? null
        }),
        className: "overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-slate-400",
        children: [
          getImageUrl(item) ? jsx2(
            "img",
            {
              className: "aspect-[3/2] w-full bg-white object-contain",
              src: getImageUrl(item) || void 0,
              alt: item.alt || item.title || item.filename
            }
          ) : null,
          jsxs2("div", { className: "p-3 text-xs text-slate-600", children: [
            jsx2("p", { className: "font-medium text-slate-900", children: item.title || item.filename }),
            jsx2("p", { className: "mt-1", children: item.path })
          ] })
        ]
      },
      item.path
    )) }) : null,
    error ? jsx2("p", { className: "rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700", children: error }) : null
  ] });
};

// tina/fields/video-asset-field.tsx
init_media_browser();
init_media();
init_browser();
import { useState as useState3 } from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var formatFileSize2 = (size) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};
var createVideoAsset = (sourceType) => ({
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
  title: null
});
var readVideoMetadata = (file) => new Promise((resolve) => {
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
var VideoAssetField = ({ field, input }) => {
  const [isUploading, setIsUploading] = useState3(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState3(false);
  const [library, setLibrary] = useState3([]);
  const [error, setError] = useState3(null);
  const currentAsset = input.value ?? null;
  const currentSourceType = getVideoSourceType(currentAsset) ?? "upload";
  const directory = getDefaultMediaDirectory(field.name);
  const currentVimeoUrl = currentAsset?.vimeoUrl?.trim() || (currentSourceType === "vimeo" ? currentAsset?.url?.trim() || "" : "");
  const currentVimeoPreview = getVimeoEmbedUrl(currentAsset, {
    autoplay: true,
    muted: true,
    loop: true,
    controls: false,
    background: true
  });
  const setSourceType = (sourceType) => {
    setError(null);
    if (sourceType === currentSourceType && currentAsset) {
      input.onChange({
        ...createVideoAsset(sourceType),
        ...currentAsset,
        sourceType
      });
      return;
    }
    input.onChange({
      ...createVideoAsset(sourceType),
      title: currentAsset?.title ?? null,
      alt: currentAsset?.alt ?? null,
      posterUrl: currentAsset?.posterUrl ?? null
    });
  };
  const loadLibrary = async () => {
    setError(null);
    setIsLoadingLibrary(true);
    try {
      const response = await fetch(
        `/api/admin/media/list?directory=${encodeURIComponent(directory)}`,
        {
          headers: await getSupabaseAuthHeaders()
        }
      );
      const body = await response.json();
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
  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setError("Die Datei ist zu gro\xDF f\xFCr den vordefinierten Upload-Flow.");
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
          ...authHeaders
        },
        body: JSON.stringify({
          directory,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        })
      });
      const signedUploadBody = await signedUploadResponse.json();
      if (!signedUploadResponse.ok) {
        throw new Error(signedUploadBody.error || "Upload-URL konnte nicht erzeugt werden.");
      }
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage.from(signedUploadBody.bucket || "public").uploadToSignedUrl(
        signedUploadBody.path || "",
        signedUploadBody.token || "",
        file,
        {
          contentType: file.type,
          upsert: false
        }
      );
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      const nextAsset = {
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
        title: file.name.replace(/\.[^.]+$/, "")
      };
      input.onChange(nextAsset);
      await loadLibrary();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setIsUploading(false);
    }
  };
  const onChangeVimeoUrl = (event) => {
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
      size: 0
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
          ...await getSupabaseAuthHeaders()
        },
        body: JSON.stringify({
          bucket: currentAsset.bucket,
          path: currentAsset.path
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Asset konnte nicht gel\xF6scht werden.");
      }
      input.onChange(null);
      await loadLibrary();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Asset konnte nicht gel\xF6scht werden.");
    }
  };
  const renderCurrentPreview = () => {
    if (!currentAsset) {
      return jsx3("div", { className: "rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500", children: "Noch kein Video gesetzt." });
    }
    if (currentSourceType === "vimeo") {
      return jsxs3("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white", children: [
        currentVimeoPreview ? jsx3(
          "iframe",
          {
            src: currentVimeoPreview,
            title: currentAsset.title || "Vimeo Video",
            allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
            allowFullScreen: true,
            className: "aspect-video w-full bg-black"
          }
        ) : jsx3("div", { className: "flex aspect-video w-full items-center justify-center bg-slate-950 px-4 text-center text-sm text-slate-300", children: "Vimeo-Link einf\xFCgen, um die Vorschau zu sehen." }),
        jsxs3("div", { className: "grid gap-2 p-4 text-xs text-slate-600", children: [
          jsx3("p", { className: "font-medium text-slate-900", children: currentAsset.title || "Vimeo Video" }),
          jsx3("p", { className: "break-all", children: currentVimeoUrl || "Noch kein Vimeo-Link gesetzt." })
        ] })
      ] });
    }
    return jsxs3("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white", children: [
      getVideoUrl(currentAsset) ? jsx3(
        "video",
        {
          className: "aspect-video w-full bg-black object-cover",
          src: getVideoUrl(currentAsset) || void 0,
          poster: currentAsset.posterUrl || void 0,
          controls: true,
          preload: "metadata"
        }
      ) : null,
      jsxs3("div", { className: "grid gap-2 p-4 text-xs text-slate-600", children: [
        jsx3("p", { className: "font-medium text-slate-900", children: currentAsset.title || currentAsset.path }),
        jsx3("p", { children: currentAsset.path }),
        jsxs3("p", { children: [
          currentAsset.mimeType,
          " \xB7 ",
          formatFileSize2(currentAsset.size),
          currentAsset.duration ? ` \xB7 ${currentAsset.duration.toFixed(1)}s` : ""
        ] })
      ] })
    ] });
  };
  return jsxs3("div", { className: "space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4", children: [
    jsxs3("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      jsxs3("div", { children: [
        jsx3("p", { className: "text-sm font-semibold text-slate-900", children: field.label || "Video" }),
        jsx3("p", { className: "text-xs text-slate-500", children: field.description || directory })
      ] }),
      jsxs3("div", { className: "inline-flex rounded-full border border-slate-300 bg-white p-1", children: [
        jsx3(
          "button",
          {
            type: "button",
            onClick: () => setSourceType("upload"),
            className: `rounded-full px-3 py-2 text-xs font-semibold transition ${currentSourceType === "upload" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-950"}`,
            children: "Upload"
          }
        ),
        jsx3(
          "button",
          {
            type: "button",
            onClick: () => setSourceType("vimeo"),
            className: `rounded-full px-3 py-2 text-xs font-semibold transition ${currentSourceType === "vimeo" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-950"}`,
            children: "Vimeo Link"
          }
        )
      ] })
    ] }),
    currentSourceType === "upload" ? jsxs3("div", { className: "flex flex-wrap gap-2", children: [
      jsxs3("label", { className: "inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700", children: [
        isUploading ? "Upload l\xE4uft..." : "Video hochladen",
        jsx3(
          "input",
          {
            type: "file",
            accept: "video/mp4,video/quicktime,video/webm,video/x-m4v",
            className: "hidden",
            disabled: isUploading,
            onChange: onUpload
          }
        )
      ] }),
      jsx3(
        "button",
        {
          type: "button",
          onClick: () => void loadLibrary(),
          disabled: isLoadingLibrary,
          className: "rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:opacity-60",
          children: isLoadingLibrary ? "Lade Library..." : "Library laden"
        }
      ),
      currentAsset ? jsx3(
        "button",
        {
          type: "button",
          onClick: () => void onDelete(),
          className: "rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700",
          children: "Entfernen"
        }
      ) : null
    ] }) : jsxs3("div", { className: "space-y-2", children: [
      jsx3("label", { className: "block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500", children: "Vimeo URL" }),
      jsx3(
        "input",
        {
          type: "url",
          value: currentVimeoUrl,
          onChange: onChangeVimeoUrl,
          placeholder: "https://vimeo.com/123456789",
          className: "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        }
      ),
      currentVimeoUrl && !extractVimeoVideoId(currentVimeoUrl) ? jsx3("p", { className: "text-xs text-rose-600", children: "Der Link enth\xE4lt keine g\xFCltige Vimeo-Video-ID." }) : null,
      currentAsset ? jsx3(
        "button",
        {
          type: "button",
          onClick: () => input.onChange(null),
          className: "rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700",
          children: "Entfernen"
        }
      ) : null
    ] }),
    renderCurrentPreview(),
    currentSourceType === "upload" && library.length > 0 ? jsx3("div", { className: "grid gap-3 md:grid-cols-2", children: library.map((item) => jsxs3(
      "button",
      {
        type: "button",
        onClick: () => input.onChange({
          ...item,
          sourceType: "upload",
          vimeoUrl: ""
        }),
        className: "overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-slate-400",
        children: [
          getVideoUrl(item) ? jsx3(
            "video",
            {
              className: "aspect-video w-full bg-black object-cover",
              src: getVideoUrl(item) || void 0,
              muted: true,
              playsInline: true,
              preload: "metadata"
            }
          ) : null,
          jsxs3("div", { className: "p-3 text-xs text-slate-600", children: [
            jsx3("p", { className: "font-medium text-slate-900", children: item.title || item.filename }),
            jsx3("p", { className: "mt-1", children: item.path })
          ] })
        ]
      },
      item.path
    )) }) : null,
    error ? jsx3("p", { className: "rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700", children: error }) : null
  ] });
};

// tina/config.ts
var branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
var videoAssetFields = () => [
  {
    type: "string",
    name: "sourceType",
    label: "Quelle"
  },
  {
    type: "string",
    name: "url",
    label: "Public URL"
  },
  {
    type: "string",
    name: "vimeoUrl",
    label: "Vimeo URL"
  },
  {
    type: "string",
    name: "path",
    label: "Storage Path"
  },
  {
    type: "string",
    name: "bucket",
    label: "Bucket"
  },
  {
    type: "string",
    name: "mimeType",
    label: "MIME Type"
  },
  {
    type: "number",
    name: "size",
    label: "Dateigr\xF6\xDFe"
  },
  {
    type: "number",
    name: "width",
    label: "Breite"
  },
  {
    type: "number",
    name: "height",
    label: "H\xF6he"
  },
  {
    type: "number",
    name: "duration",
    label: "Dauer"
  },
  {
    type: "string",
    name: "posterUrl",
    label: "Poster URL"
  },
  {
    type: "string",
    name: "title",
    label: "Titel"
  },
  {
    type: "string",
    name: "alt",
    label: "Alt Text"
  }
];
var videoAssetField = (name, label) => ({
  type: "object",
  name,
  label,
  fields: videoAssetFields(),
  ui: {
    component: VideoAssetField
  }
});
var imageAssetFields = () => [
  {
    type: "string",
    name: "url",
    label: "Public URL"
  },
  {
    type: "string",
    name: "path",
    label: "Storage Path"
  },
  {
    type: "string",
    name: "bucket",
    label: "Bucket"
  },
  {
    type: "string",
    name: "mimeType",
    label: "MIME Type"
  },
  {
    type: "number",
    name: "size",
    label: "Dateigr\xF6\xDFe"
  },
  {
    type: "number",
    name: "width",
    label: "Breite"
  },
  {
    type: "number",
    name: "height",
    label: "H\xF6he"
  },
  {
    type: "string",
    name: "title",
    label: "Titel"
  },
  {
    type: "string",
    name: "alt",
    label: "Alt Text"
  }
];
var imageAssetField = (name, label) => ({
  type: "object",
  name,
  label,
  fields: imageAssetFields(),
  ui: {
    component: ImageAssetField
  }
});
var config_default = defineConfig({
  branch,
  authProvider: isLocal ? new LocalAuthProvider() : new SupabaseTinaAuthProvider(),
  contentApiUrlOverride: "/api/tina/gql",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    loadCustomStore: async () => {
      const pack = await Promise.resolve().then(() => (init_supabase_media_store(), supabase_media_store_exports));
      return pack.SupabaseMediaStore;
    }
  },
  schema: {
    collections: [
      {
        label: "Homepage",
        name: "homepage",
        path: "content/global",
        format: "json",
        match: {
          include: "home"
        },
        ui: {
          global: true,
          router: () => "/",
          allowedActions: {
            create: false,
            delete: false,
            createNestedFolder: false
          }
        },
        fields: [
          {
            type: "string",
            name: "siteName",
            label: "Seitenname",
            required: true
          },
          {
            type: "boolean",
            name: "maintenanceMode",
            label: 'Wartungsmodus ("Coming soon"-Seite anzeigen)',
            description: 'Wenn aktiv, sehen Besucher anstelle der vollst\xE4ndigen Website nur eine "Coming soon"-Seite.'
          },
          imageAssetField("logo", "Logo"),
          {
            type: "string",
            name: "navCtaLabel",
            label: "Navigation CTA",
            required: true
          },
          {
            type: "object",
            name: "navLinks",
            label: "Navigationslinks",
            list: true,
            fields: [
              {
                type: "string",
                name: "label",
                label: "Label",
                required: true
              },
              {
                type: "string",
                name: "href",
                label: "Ziel",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "hero",
            label: "Hero",
            fields: [
              {
                type: "string",
                name: "kicker",
                label: "Kicker"
              },
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "titleLead",
                label: "Titel Zeile 1"
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Titel Akzent"
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "primaryCtaLabel",
                label: "Primary CTA"
              },
              {
                type: "string",
                name: "secondaryCtaLabel",
                label: "Secondary CTA"
              },
              {
                type: "string",
                name: "cursorLabel",
                label: "Cursor Label"
              },
              {
                type: "string",
                name: "cursorYear",
                label: "Cursor Jahr"
              },
              {
                type: "string",
                name: "modalTag",
                label: "Modal Tag"
              },
              {
                type: "string",
                name: "modalTitle",
                label: "Modal Titel"
              },
              {
                type: "string",
                name: "modalDescription",
                label: "Modal Beschreibung",
                ui: {
                  component: "textarea"
                }
              },
              videoAssetField("backgroundVideo", "Hintergrundvideo"),
              videoAssetField("showreelVideo", "Showreel"),
              {
                type: "string",
                name: "scrollLabel",
                label: "Scroll Label"
              }
            ]
          },
          {
            type: "string",
            name: "marqueeItems",
            label: "Marquee Elemente",
            list: true
          },
          {
            type: "object",
            name: "servicesSection",
            label: "Leistungen",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "titleLine1",
                label: "Titel Zeile 1"
              },
              {
                type: "string",
                name: "titleLine2",
                label: "Titel Zeile 2"
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "watchLabel",
                label: "Watch Label"
              },
              {
                type: "object",
                name: "services",
                label: "Services",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "num",
                    label: "Nummer"
                  },
                  {
                    type: "string",
                    name: "name",
                    label: "Name",
                    required: true
                  },
                  {
                    type: "string",
                    name: "count",
                    label: "Z\xE4hler"
                  },
                  {
                    type: "string",
                    name: "desc",
                    label: "Beschreibung",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "object",
                    name: "items",
                    label: "Arbeiten",
                    list: true,
                    fields: [
                      {
                        type: "string",
                        name: "tag",
                        label: "Tag"
                      },
                      {
                        type: "string",
                        name: "title",
                        label: "Titel"
                      },
                      {
                        type: "string",
                        name: "description",
                        label: "Beschreibung unter dem Video",
                        ui: {
                          component: "textarea"
                        }
                      },
                      {
                        type: "object",
                        name: "links",
                        label: "Zusatzlinks",
                        list: true,
                        fields: [
                          {
                            type: "string",
                            name: "label",
                            label: "Text"
                          },
                          {
                            type: "string",
                            name: "href",
                            label: "URL"
                          }
                        ]
                      },
                      videoAssetField("video", "Video")
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "processSection",
            label: "Ablauf",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "title",
                label: "Titel"
              },
              {
                type: "object",
                name: "steps",
                label: "Schritte",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "num",
                    label: "Nummer"
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Titel"
                  },
                  {
                    type: "string",
                    name: "text",
                    label: "Text",
                    ui: {
                      component: "textarea"
                    }
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "aboutSection",
            label: "\xDCber mich",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "title",
                label: "Titel"
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea"
                }
              },
              imageAssetField("photo", "Portraitfoto"),
              {
                type: "object",
                name: "facts",
                label: "Fakten",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "label",
                    label: "Label"
                  },
                  {
                    type: "string",
                    name: "value",
                    label: "Wert"
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "testimonialsSection",
            label: "Testimonials",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "title",
                label: "Titel"
              },
              {
                type: "string",
                name: "badge",
                label: "Standard Badge"
              },
              {
                type: "object",
                name: "items",
                label: "Stimmen",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "quote",
                    label: "Zitat",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "string",
                    name: "name",
                    label: "Name"
                  },
                  {
                    type: "string",
                    name: "role",
                    label: "Rolle"
                  },
                  {
                    type: "string",
                    name: "badge",
                    label: "Badge"
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "partnersSection",
            label: "Partner",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "title",
                label: "Titel"
              },
              {
                type: "object",
                name: "logos",
                label: "Logos",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "name",
                    label: "Name"
                  },
                  {
                    type: "string",
                    name: "href",
                    label: "Link (optional)"
                  },
                  imageAssetField("logo", "Logo")
                ]
              }
            ]
          },
          {
            type: "object",
            name: "contactSection",
            label: "Kontakt",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow"
              },
              {
                type: "string",
                name: "titleLead",
                label: "Titel Anfang"
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Titel Akzent"
              },
              {
                type: "string",
                name: "titleTrail",
                label: "Titel Ende"
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "ctaLabel",
                label: "CTA Label"
              },
              {
                type: "string",
                name: "email",
                label: "E-Mail"
              },
              {
                type: "string",
                name: "backgroundType",
                label: "Hintergrundtyp",
                options: [
                  {
                    label: "Kein Hintergrund",
                    value: "none"
                  },
                  {
                    label: "Bild",
                    value: "image"
                  },
                  {
                    label: "Video",
                    value: "video"
                  }
                ],
                ui: {
                  component: "select"
                }
              },
              imageAssetField("backgroundImage", "Hintergrundbild"),
              videoAssetField("backgroundVideo", "Hintergrundvideo"),
              {
                type: "object",
                name: "socialLinks",
                label: "Social Links",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "label",
                    label: "Label"
                  },
                  {
                    type: "string",
                    name: "href",
                    label: "URL"
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              {
                type: "string",
                name: "tagline",
                label: "Tagline"
              },
              {
                type: "string",
                name: "menuTitle",
                label: "Men\xFC Titel"
              },
              {
                type: "string",
                name: "legalTitle",
                label: "Rechtliches Titel"
              },
              {
                type: "string",
                name: "imprintLabel",
                label: "Impressum Label"
              },
              {
                type: "string",
                name: "imprintHref",
                label: "Impressum Link"
              },
              {
                type: "string",
                name: "privacyLabel",
                label: "Datenschutz Label"
              },
              {
                type: "string",
                name: "privacyHref",
                label: "Datenschutz Link"
              },
              {
                type: "string",
                name: "copyright",
                label: "Copyright"
              },
              {
                type: "string",
                name: "credits",
                label: "Credits"
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};

// tina/config.ts
import { defineConfig, LocalAuthProvider } from "tinacms";

// tina/auth/provider.tsx
import { useEffect, useState } from "react";
import { AbstractAuthProvider } from "tinacms";

// lib/supabase/browser.ts
import { createClient } from "@supabase/supabase-js";
var browserClient = null;
var requirePublicEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }
  return value;
};
var getSupabaseBrowserClient = () => {
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

// tina/auth/provider.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var getAccessToken = async () => {
  const {
    data: { session }
  } = await getSupabaseBrowserClient().auth.getSession();
  return session?.access_token ?? null;
};
var SupabaseLoginScreen = ({ handleAuthenticate }) => {
  const [email, setEmail] = useState("");
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
          setError("Die aktuelle Session konnte nicht geprueft werden.");
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
        email
      });
      setStatus("sent");
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error ? submitError.message : "Der Magic Link konnte nicht versendet werden."
      );
    }
  };
  return jsx("div", { className: "min-h-screen bg-slate-950 px-6 py-10 text-slate-100", children: jsxs("div", { className: "mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur", children: [
    jsxs("div", { className: "mb-8", children: [
      jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.28em] text-amber-300", children: "Tina Admin" }),
      jsx("h1", { className: "mt-3 text-3xl font-semibold tracking-tight text-white", children: "Editor Login" }),
      jsx("p", { className: "mt-3 text-sm leading-6 text-slate-300", children: "Melde dich mit deinem freigeschalteten Supabase-Konto an. Du bekommst einen Magic Link per E-Mail." })
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
      jsx(
        "button",
        {
          type: "submit",
          disabled: status === "sending",
          className: "w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70",
          children: status === "sending" ? "Link wird gesendet..." : "Magic Link senden"
        }
      )
    ] }),
    status === "sent" ? jsx("p", { className: "mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200", children: "Der Link wurde verschickt. Oeffne die E-Mail auf diesem Geraet und folge dem Login-Link zurueck in den Admin." }) : null,
    error ? jsx("p", { className: "mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200", children: error }) : null
  ] }) });
};
SupabaseLoginScreen.displayName = "SupabaseLoginScreen";
var TinaSessionProvider = ({ children }) => jsx(Fragment, { children });
TinaSessionProvider.displayName = "TinaSessionProvider";
var SupabaseTinaAuthProvider = class extends AbstractAuthProvider {
  async authenticate(props) {
    const email = props?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error("Bitte gib eine E-Mail-Adresse ein.");
    }
    const redirectTo = new URL("/admin/index.html", window.location.origin).toString();
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false
      }
    });
    if (error) {
      throw new Error(error.message);
    }
    return {
      id_token: "pending"
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

// tina/fields/video-asset-field.tsx
import { useState as useState2 } from "react";

// lib/cms/media.ts
var MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;
var VIDEO_DIRECTORY_BY_FIELD = {
  backgroundVideo: "videos/hero",
  showreelVideo: "videos/showreel",
  video: "videos/services"
};
var getDefaultMediaDirectory = (fieldName) => VIDEO_DIRECTORY_BY_FIELD[fieldName] ?? "videos/uploads";
var getVideoUrl = (asset) => {
  const url = asset?.url?.trim();
  return url ? url : null;
};

// tina/fields/video-asset-field.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var formatFileSize = (size) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};
var getAuthHeaders = async () => {
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
  const [isUploading, setIsUploading] = useState2(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState2(false);
  const [library, setLibrary] = useState2([]);
  const [error, setError] = useState2(null);
  const currentAsset = input.value ?? null;
  const directory = getDefaultMediaDirectory(field.name);
  const loadLibrary = async () => {
    setError(null);
    setIsLoadingLibrary(true);
    try {
      const response = await fetch(
        `/api/admin/media/list?directory=${encodeURIComponent(directory)}`,
        {
          headers: await getAuthHeaders()
        }
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Die Media-Liste konnte nicht geladen werden.");
      }
      setLibrary(body.items || []);
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
      setError("Die Datei ist zu gross fuer den vordefinierten Upload-Flow.");
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const metadata = await readVideoMetadata(file);
      const authHeaders = await getAuthHeaders();
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
        url: signedUploadBody.publicUrl || "",
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
          ...await getAuthHeaders()
        },
        body: JSON.stringify({
          bucket: currentAsset.bucket,
          path: currentAsset.path
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Asset konnte nicht geloescht werden.");
      }
      input.onChange(null);
      await loadLibrary();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Asset konnte nicht geloescht werden.");
    }
  };
  return jsxs2("div", { className: "space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4", children: [
    jsxs2("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      jsxs2("div", { children: [
        jsx2("p", { className: "text-sm font-semibold text-slate-900", children: field.label || "Video" }),
        jsx2("p", { className: "text-xs text-slate-500", children: field.description || directory })
      ] }),
      jsxs2("div", { className: "flex flex-wrap gap-2", children: [
        jsxs2("label", { className: "inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700", children: [
          isUploading ? "Upload laeuft..." : "Video hochladen",
          jsx2(
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
      getVideoUrl(currentAsset) ? jsx2(
        "video",
        {
          className: "aspect-video w-full bg-black object-cover",
          src: getVideoUrl(currentAsset) || void 0,
          poster: currentAsset.posterUrl || void 0,
          controls: true,
          preload: "metadata"
        }
      ) : null,
      jsxs2("div", { className: "grid gap-2 p-4 text-xs text-slate-600", children: [
        jsx2("p", { className: "font-medium text-slate-900", children: currentAsset.title || currentAsset.path }),
        jsx2("p", { children: currentAsset.path }),
        jsxs2("p", { children: [
          currentAsset.mimeType,
          " \xB7 ",
          formatFileSize(currentAsset.size),
          currentAsset.duration ? ` \xB7 ${currentAsset.duration.toFixed(1)}s` : ""
        ] })
      ] })
    ] }) : jsx2("div", { className: "rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500", children: "Noch kein Video gesetzt." }),
    library.length > 0 ? jsx2("div", { className: "grid gap-3 md:grid-cols-2", children: library.map((item) => jsxs2(
      "button",
      {
        type: "button",
        onClick: () => input.onChange(item),
        className: "overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-slate-400",
        children: [
          getVideoUrl(item) ? jsx2(
            "video",
            {
              className: "aspect-video w-full bg-black object-cover",
              src: getVideoUrl(item) || void 0,
              muted: true,
              playsInline: true,
              preload: "metadata"
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

// tina/config.ts
var branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
var videoAssetFields = () => [
  {
    type: "string",
    name: "url",
    label: "Public URL",
    required: true
  },
  {
    type: "string",
    name: "path",
    label: "Storage Path",
    required: true
  },
  {
    type: "string",
    name: "bucket",
    label: "Bucket",
    required: true
  },
  {
    type: "string",
    name: "mimeType",
    label: "MIME Type",
    required: true
  },
  {
    type: "number",
    name: "size",
    label: "Dateigroesse",
    required: true
  },
  {
    type: "number",
    name: "width",
    label: "Breite"
  },
  {
    type: "number",
    name: "height",
    label: "Hoehe"
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
var config_default = defineConfig({
  branch,
  authProvider: isLocal ? new LocalAuthProvider() : new SupabaseTinaAuthProvider(),
  contentApiUrlOverride: "/api/tina/gql",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public"
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
                    label: "Zaehler"
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
                name: "socialHandle",
                label: "Social Handle"
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
                label: "Menue Titel"
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

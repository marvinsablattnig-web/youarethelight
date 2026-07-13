import { defineConfig, LocalAuthProvider, type TinaField } from "tinacms";

import { SupabaseTinaAuthProvider } from "./auth/provider";
import { ImageAssetField } from "./fields/image-asset-field";
import { VideoAssetField } from "./fields/video-asset-field";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const videoAssetFields = (): TinaField[] => [
  {
    type: "string",
    name: "sourceType",
    label: "Quelle",
  },
  {
    type: "string",
    name: "url",
    label: "Public URL",
  },
  {
    type: "string",
    name: "vimeoUrl",
    label: "Vimeo URL",
  },
  {
    type: "string",
    name: "path",
    label: "Storage Path",
  },
  {
    type: "string",
    name: "bucket",
    label: "Bucket",
  },
  {
    type: "string",
    name: "mimeType",
    label: "MIME Type",
  },
  {
    type: "number",
    name: "size",
    label: "Dateigröße",
  },
  {
    type: "number",
    name: "width",
    label: "Breite",
  },
  {
    type: "number",
    name: "height",
    label: "Höhe",
  },
  {
    type: "number",
    name: "duration",
    label: "Dauer",
  },
  {
    type: "string",
    name: "posterUrl",
    label: "Poster URL",
  },
  {
    type: "string",
    name: "title",
    label: "Titel",
  },
  {
    type: "string",
    name: "alt",
    label: "Alt Text",
  },
];

const videoAssetField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: videoAssetFields(),
  ui: {
    component: VideoAssetField as never,
  },
});

const imageAssetFields = (): TinaField[] => [
  {
    type: "string",
    name: "url",
    label: "Public URL",
  },
  {
    type: "string",
    name: "path",
    label: "Storage Path",
  },
  {
    type: "string",
    name: "bucket",
    label: "Bucket",
  },
  {
    type: "string",
    name: "mimeType",
    label: "MIME Type",
  },
  {
    type: "number",
    name: "size",
    label: "Dateigröße",
  },
  {
    type: "number",
    name: "width",
    label: "Breite",
  },
  {
    type: "number",
    name: "height",
    label: "Höhe",
  },
  {
    type: "string",
    name: "title",
    label: "Titel",
  },
  {
    type: "string",
    name: "alt",
    label: "Alt Text",
  },
];

const imageAssetField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: imageAssetFields(),
  ui: {
    component: ImageAssetField as never,
  },
});

export default defineConfig({
  branch,
  authProvider: isLocal ? new LocalAuthProvider() : new SupabaseTinaAuthProvider(),
  contentApiUrlOverride: "/api/tina/gql",
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    loadCustomStore: async () => {
      const pack = await import("./media/supabase-media-store");
      return pack.SupabaseMediaStore;
    },
  },
  schema: {
    collections: [
      {
        label: "Homepage",
        name: "homepage",
        path: "content/global",
        format: "json",
        match: {
          include: "home",
        },
        ui: {
          global: true,
          router: () => "/",
          allowedActions: {
            create: false,
            delete: false,
            createNestedFolder: false,
          },
        },
        fields: [
          {
            type: "string",
            name: "siteName",
            label: "Seitenname",
            required: true,
          },
          {
            type: "boolean",
            name: "maintenanceMode",
            label: "Wartungsmodus (\"Coming soon\"-Seite anzeigen)",
            description:
              "Wenn aktiv, sehen Besucher anstelle der vollständigen Website nur eine \"Coming soon\"-Seite.",
          },
          imageAssetField("logo", "Logo"),
          {
            type: "string",
            name: "navCtaLabel",
            label: "Navigation CTA",
            required: true,
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
                required: true,
              },
              {
                type: "string",
                name: "href",
                label: "Ziel",
                required: true,
              },
            ],
          },
          {
            type: "object",
            name: "hero",
            label: "Hero",
            fields: [
              {
                type: "string",
                name: "kicker",
                label: "Kicker",
              },
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "titleLead",
                label: "Titel Zeile 1",
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Titel Akzent",
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "primaryCtaLabel",
                label: "Primary CTA",
              },
              {
                type: "string",
                name: "secondaryCtaLabel",
                label: "Secondary CTA",
              },
              {
                type: "string",
                name: "cursorLabel",
                label: "Cursor Label",
              },
              {
                type: "string",
                name: "cursorYear",
                label: "Cursor Jahr",
              },
              {
                type: "string",
                name: "modalTag",
                label: "Modal Tag",
              },
              {
                type: "string",
                name: "modalTitle",
                label: "Modal Titel",
              },
              {
                type: "string",
                name: "modalDescription",
                label: "Modal Beschreibung",
                ui: {
                  component: "textarea",
                },
              },
              videoAssetField("backgroundVideo", "Hintergrundvideo"),
              videoAssetField("showreelVideo", "Showreel"),
              {
                type: "string",
                name: "scrollLabel",
                label: "Scroll Label",
              },
            ],
          },
          {
            type: "string",
            name: "marqueeItems",
            label: "Marquee Elemente",
            list: true,
          },
          {
            type: "object",
            name: "servicesSection",
            label: "Leistungen",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "titleLine1",
                label: "Titel Zeile 1",
              },
              {
                type: "string",
                name: "titleLine2",
                label: "Titel Zeile 2",
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "watchLabel",
                label: "Watch Label",
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
                    label: "Nummer",
                  },
                  {
                    type: "string",
                    name: "name",
                    label: "Name",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "count",
                    label: "Zähler",
                  },
                  {
                    type: "string",
                    name: "desc",
                    label: "Beschreibung",
                    ui: {
                      component: "textarea",
                    },
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
                        label: "Tag",
                      },
                      {
                        type: "string",
                        name: "title",
                        label: "Titel",
                      },
                      {
                        type: "string",
                        name: "description",
                        label: "Beschreibung unter dem Video",
                        ui: {
                          component: "textarea",
                        },
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
                            label: "Text",
                          },
                          {
                            type: "string",
                            name: "href",
                            label: "URL",
                          },
                        ],
                      },
                      videoAssetField("video", "Video"),
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "processSection",
            label: "Ablauf",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "title",
                label: "Titel",
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
                    label: "Nummer",
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Titel",
                  },
                  {
                    type: "string",
                    name: "text",
                    label: "Text",
                    ui: {
                      component: "textarea",
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "aboutSection",
            label: "Über mich",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "title",
                label: "Titel",
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea",
                },
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
                    label: "Label",
                  },
                  {
                    type: "string",
                    name: "value",
                    label: "Wert",
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "testimonialsSection",
            label: "Testimonials",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "title",
                label: "Titel",
              },
              {
                type: "string",
                name: "badge",
                label: "Standard Badge",
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
                      component: "textarea",
                    },
                  },
                  {
                    type: "string",
                    name: "name",
                    label: "Name",
                  },
                  {
                    type: "string",
                    name: "role",
                    label: "Rolle",
                  },
                  {
                    type: "string",
                    name: "badge",
                    label: "Badge",
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "partnersSection",
            label: "Partner",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "title",
                label: "Titel",
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
                    label: "Name",
                  },
                  {
                    type: "string",
                    name: "href",
                    label: "Link (optional)",
                  },
                  imageAssetField("logo", "Logo"),
                ],
              },
            ],
          },
          {
            type: "object",
            name: "contactSection",
            label: "Kontakt",
            fields: [
              {
                type: "string",
                name: "eyebrow",
                label: "Eyebrow",
              },
              {
                type: "string",
                name: "titleLead",
                label: "Titel Anfang",
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Titel Akzent",
              },
              {
                type: "string",
                name: "titleTrail",
                label: "Titel Ende",
              },
              {
                type: "string",
                name: "description",
                label: "Beschreibung",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "ctaLabel",
                label: "CTA Label",
              },
              {
                type: "string",
                name: "email",
                label: "E-Mail",
              },
              {
                type: "string",
                name: "backgroundType",
                label: "Hintergrundtyp",
                options: [
                  {
                    label: "Kein Hintergrund",
                    value: "none",
                  },
                  {
                    label: "Bild",
                    value: "image",
                  },
                  {
                    label: "Video",
                    value: "video",
                  },
                ],
                ui: {
                  component: "select",
                },
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
                    label: "Label",
                  },
                  {
                    type: "string",
                    name: "href",
                    label: "URL",
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              {
                type: "string",
                name: "tagline",
                label: "Tagline",
              },
              {
                type: "string",
                name: "menuTitle",
                label: "Menü Titel",
              },
              {
                type: "string",
                name: "legalTitle",
                label: "Rechtliches Titel",
              },
              {
                type: "string",
                name: "imprintLabel",
                label: "Impressum Label",
              },
              {
                type: "string",
                name: "imprintHref",
                label: "Impressum Link",
              },
              {
                type: "string",
                name: "privacyLabel",
                label: "Datenschutz Label",
              },
              {
                type: "string",
                name: "privacyHref",
                label: "Datenschutz Link",
              },
              {
                type: "string",
                name: "copyright",
                label: "Copyright",
              },
              {
                type: "string",
                name: "credits",
                label: "Credits",
              },
            ],
          },
        ],
      },
    ],
  },
});

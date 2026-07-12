"use client";

import {
  getVideoSourceType,
  getVideoUrl,
  getVimeoEmbedUrl,
  type VideoAsset,
} from "@/lib/cms/media";
import { useCookieConsent } from "@/lib/cookie-consent";

type VideoMediaProps = {
  asset?: VideoAsset | null;
  title: string;
  className: string;
  poster?: string | null;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  background?: boolean;
  pointerEventsNone?: boolean;
  vimeoCover?: boolean;
};

export function VideoMedia({
  asset,
  title,
  className,
  poster,
  autoPlay,
  muted,
  loop,
  playsInline,
  controls,
  preload,
  background,
  pointerEventsNone,
  vimeoCover,
}: VideoMediaProps) {
  const { vimeoAllowed, acceptAll } = useCookieConsent();
  const sourceType = getVideoSourceType(asset);

  if (sourceType === "vimeo") {
    const src = getVimeoEmbedUrl(asset, {
      autoplay: autoPlay,
      muted,
      loop,
      background,
      controls,
    });

    if (!src) {
      return null;
    }

    if (!vimeoAllowed) {
      if (pointerEventsNone) {
        return <div className={`${className} pointer-events-none bg-[color-mix(in_srgb,var(--surface)_90%,black)]`} />;
      }

      return (
        <div
          className={`${className} flex flex-col items-center justify-center gap-3 overflow-hidden bg-[color-mix(in_srgb,var(--surface)_90%,black)] p-4 text-center`}
        >
          <p className="font-mono-ui m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Externe Vimeo-Inhalte
          </p>
          <p className="m-0 max-w-[32ch] text-[13px] leading-[1.5] text-[var(--faint)]">
            Zum Abspielen werden Cookies von Vimeo geladen.
          </p>
          <button
            type="button"
            onClick={acceptAll}
            className="btn-cta rounded-full bg-[var(--gold)] px-5 py-2 text-[12px] font-semibold text-[var(--bg)]"
          >
            Video laden
          </button>
        </div>
      );
    }

    return (
      vimeoCover ? (
        <div
          className={pointerEventsNone ? `${className} pointer-events-none overflow-hidden` : `${className} overflow-hidden`}
        >
          <iframe
            src={src}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute left-1/2 top-1/2 h-[128%] w-[228%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
          />
        </div>
      ) : (
        <iframe
          src={src}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          className={pointerEventsNone ? `${className} pointer-events-none` : className}
        />
      )
    );
  }

  const src = getVideoUrl(asset);

  if (!src) {
    return null;
  }

  return (
    <video
      className={className}
      src={src}
      poster={poster || undefined}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      preload={preload}
    />
  );
}

import {
  getVideoSourceType,
  getVideoUrl,
  getVimeoEmbedUrl,
  type VideoAsset,
} from "@/lib/cms/media";

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

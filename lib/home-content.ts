import homeContentJson from "@/content/global/home.json";
import { getVideoSourceType, type ImageAsset, type VideoAsset } from "@/lib/cms/media";
import type { HomepageQuery } from "@/tina/__generated__/types";

export type NavLink = {
  label: string;
  href: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type HeroContent = {
  kicker: string;
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  cursorLabel: string;
  cursorYear: string;
  modalTag: string;
  modalTitle: string;
  modalDescription: string;
  backgroundVideo: VideoAsset;
  showreelVideo: VideoAsset;
  scrollLabel: string;
};

export type WorkItem = {
  tag: string;
  title: string;
  description: string;
  links: {
    label: string;
    href: string;
  }[];
  video?: VideoAsset | null;
};

export type Service = {
  num: string;
  name: string;
  count: string;
  desc: string;
  items: WorkItem[];
};

export type ProcessStep = {
  num: string;
  title: string;
  text: string;
};

export type AboutFact = {
  label: string;
  value: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  badge?: string;
};

export type PartnerLogo = {
  name: string;
  href: string;
  logo: ImageAsset | null;
};

export type HomeContent = {
  siteName: string;
  maintenanceMode: boolean;
  logo: ImageAsset | null;
  navCtaLabel: string;
  navLinks: NavLink[];
  hero: HeroContent;
  marqueeItems: string[];
  servicesSection: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    watchLabel: string;
    services: Service[];
  };
  processSection: {
    eyebrow: string;
    title: string;
    steps: ProcessStep[];
  };
  aboutSection: {
    eyebrow: string;
    title: string;
    description: string;
    photo: ImageAsset | null;
    facts: AboutFact[];
  };
  testimonialsSection: {
    eyebrow: string;
    title: string;
    badge: string;
    items: Testimonial[];
  };
  partnersSection: {
    eyebrow: string;
    title: string;
    logos: PartnerLogo[];
  };
  contactSection: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    titleTrail: string;
    description: string;
    ctaLabel: string;
    email: string;
    socialLinks: SocialLink[];
    backgroundType: "none" | "image" | "video";
    backgroundImage: ImageAsset | null;
    backgroundVideo: VideoAsset | null;
  };
  footer: {
    tagline: string;
    menuTitle: string;
    legalTitle: string;
    imprintLabel: string;
    imprintHref: string;
    privacyLabel: string;
    privacyHref: string;
    copyright: string;
    credits: string;
  };
};

type HomepageDocument = HomepageQuery["homepage"];

type VideoAssetLike =
  | {
      sourceType?: string | null;
      url?: string | null;
      vimeoUrl?: string | null;
      path?: string | null;
      bucket?: string | null;
      mimeType?: string | null;
      size?: number | null;
      width?: number | null;
      height?: number | null;
      duration?: number | null;
      posterUrl?: string | null;
      title?: string | null;
      alt?: string | null;
    }
  | null
  | undefined;

type ImageAssetLike =
  | {
      url?: string | null;
      path?: string | null;
      bucket?: string | null;
      mimeType?: string | null;
      size?: number | null;
      width?: number | null;
      height?: number | null;
      title?: string | null;
      alt?: string | null;
    }
  | null
  | undefined;

const normalizeImageAsset = (asset: ImageAssetLike): ImageAsset | null => {
  if (!asset) {
    return null;
  }

  if (!asset.url && !asset.path) {
    return null;
  }

  return {
    url: asset.url ?? "",
    path: asset.path ?? "",
    bucket: asset.bucket ?? "",
    mimeType: asset.mimeType ?? "",
    size: asset.size ?? 0,
    width: asset.width ?? null,
    height: asset.height ?? null,
    title: asset.title ?? null,
    alt: asset.alt ?? null,
  };
};

const normalizeVideoAsset = (asset: VideoAssetLike): VideoAsset => {
  const sourceType = getVideoSourceType(asset as VideoAsset | null) ?? "upload";
  const fallbackVimeoUrl =
    sourceType === "vimeo" && typeof asset?.url === "string" ? asset.url : "";

  return {
    sourceType,
    url: sourceType === "upload" ? asset?.url ?? "" : "",
    vimeoUrl: asset?.vimeoUrl ?? fallbackVimeoUrl ?? "",
    path: asset?.path ?? "",
    bucket: asset?.bucket ?? "",
    mimeType: asset?.mimeType ?? (sourceType === "vimeo" ? "video/vimeo" : ""),
    size: asset?.size ?? 0,
    width: asset?.width ?? null,
    height: asset?.height ?? null,
    duration: asset?.duration ?? null,
    posterUrl: asset?.posterUrl ?? null,
    title: asset?.title ?? null,
    alt: asset?.alt ?? null,
  };
};

export const normalizeHomepageDocument = (document: HomepageDocument): HomeContent => ({
  siteName: document.siteName ?? "",
  maintenanceMode: document.maintenanceMode ?? false,
  logo: normalizeImageAsset(document.logo),
  navCtaLabel: document.navCtaLabel ?? "",
  navLinks: (document.navLinks ?? [])
    .filter((link): link is NonNullable<typeof link> => Boolean(link))
    .map((link) => ({
      label: link.label ?? "",
      href: link.href ?? "",
    })),
  hero: {
    kicker: document.hero?.kicker ?? "",
    eyebrow: document.hero?.eyebrow ?? "",
    titleLead: document.hero?.titleLead ?? "",
    titleAccent: document.hero?.titleAccent ?? "",
    description: document.hero?.description ?? "",
    primaryCtaLabel: document.hero?.primaryCtaLabel ?? "",
    secondaryCtaLabel: document.hero?.secondaryCtaLabel ?? "",
    cursorLabel: document.hero?.cursorLabel ?? "",
    cursorYear: document.hero?.cursorYear ?? "",
    modalTag: document.hero?.modalTag ?? "",
    modalTitle: document.hero?.modalTitle ?? "",
    modalDescription: document.hero?.modalDescription ?? "",
    backgroundVideo: normalizeVideoAsset(document.hero?.backgroundVideo),
    showreelVideo: normalizeVideoAsset(document.hero?.showreelVideo),
    scrollLabel: document.hero?.scrollLabel ?? "",
  },
  marqueeItems: (document.marqueeItems ?? []).filter(
    (item): item is string => typeof item === "string",
  ),
  servicesSection: {
    eyebrow: document.servicesSection?.eyebrow ?? "",
    titleLine1: document.servicesSection?.titleLine1 ?? "",
    titleLine2: document.servicesSection?.titleLine2 ?? "",
    description: document.servicesSection?.description ?? "",
    watchLabel: document.servicesSection?.watchLabel ?? "",
    services: (document.servicesSection?.services ?? [])
      .filter((service): service is NonNullable<typeof service> => Boolean(service))
      .map((service) => ({
        num: service.num ?? "",
        name: service.name ?? "",
        count: service.count ?? "",
        desc: service.desc ?? "",
        items: (service.items ?? [])
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map((item) => ({
            tag: item.tag ?? "",
            title: item.title ?? "",
            description: item.description ?? "",
            links: (item.links ?? [])
              .filter((link): link is NonNullable<typeof link> => Boolean(link))
              .map((link) => ({
                label: link.label ?? "",
                href: link.href ?? "",
              }))
              .filter((link) => link.label || link.href),
            video: item.video ? normalizeVideoAsset(item.video) : null,
          })),
      })),
  },
  processSection: {
    eyebrow: document.processSection?.eyebrow ?? "",
    title: document.processSection?.title ?? "",
    steps: (document.processSection?.steps ?? [])
      .filter((step): step is NonNullable<typeof step> => Boolean(step))
      .map((step) => ({
        num: step.num ?? "",
        title: step.title ?? "",
        text: step.text ?? "",
      })),
  },
  aboutSection: {
    eyebrow: document.aboutSection?.eyebrow ?? "",
    title: document.aboutSection?.title ?? "",
    description: document.aboutSection?.description ?? "",
    photo: normalizeImageAsset(document.aboutSection?.photo),
    facts: (document.aboutSection?.facts ?? [])
      .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact))
      .map((fact) => ({
        label: fact.label ?? "",
        value: fact.value ?? "",
      })),
  },
  testimonialsSection: {
    eyebrow: document.testimonialsSection?.eyebrow ?? "",
    title: document.testimonialsSection?.title ?? "",
    badge: document.testimonialsSection?.badge ?? "",
    items: (document.testimonialsSection?.items ?? [])
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        quote: item.quote ?? "",
        name: item.name ?? "",
        role: item.role ?? "",
        badge: item.badge ?? "",
      })),
  },
  partnersSection: {
    eyebrow: document.partnersSection?.eyebrow ?? "",
    title: document.partnersSection?.title ?? "",
    logos: (document.partnersSection?.logos ?? [])
      .filter((logo): logo is NonNullable<typeof logo> => Boolean(logo))
      .map((logo) => ({
        name: logo.name ?? "",
        href: logo.href ?? "",
        logo: normalizeImageAsset(logo.logo),
      })),
  },
  contactSection: {
    eyebrow: document.contactSection?.eyebrow ?? "",
    titleLead: document.contactSection?.titleLead ?? "",
    titleAccent: document.contactSection?.titleAccent ?? "",
    titleTrail: document.contactSection?.titleTrail ?? "",
    description: document.contactSection?.description ?? "",
    ctaLabel: document.contactSection?.ctaLabel ?? "",
    email: document.contactSection?.email ?? "",
    socialLinks: (document.contactSection?.socialLinks ?? [])
      .filter((link): link is NonNullable<typeof link> => Boolean(link))
      .map((link) => ({
        label: link.label ?? "",
        href: link.href ?? "",
      })),
    backgroundType:
      document.contactSection?.backgroundType === "image" ||
      document.contactSection?.backgroundType === "video"
        ? document.contactSection.backgroundType
        : "none",
    backgroundImage: normalizeImageAsset(document.contactSection?.backgroundImage),
    backgroundVideo: document.contactSection?.backgroundVideo
      ? normalizeVideoAsset(document.contactSection.backgroundVideo)
      : null,
  },
  footer: {
    tagline: document.footer?.tagline ?? "",
    menuTitle: document.footer?.menuTitle ?? "",
    legalTitle: document.footer?.legalTitle ?? "",
    imprintLabel: document.footer?.imprintLabel ?? "",
    imprintHref: document.footer?.imprintHref ?? "",
    privacyLabel: document.footer?.privacyLabel ?? "",
    privacyHref: document.footer?.privacyHref ?? "",
    copyright: document.footer?.copyright ?? "",
    credits: document.footer?.credits ?? "",
  },
});

export const homeContent = homeContentJson as HomeContent;

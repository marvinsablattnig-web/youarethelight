import homeContentJson from "@/content/global/home.json";
import type { VideoAsset } from "@/lib/cms/media";

export type NavLink = {
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

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  badge?: string;
};

export type HomeContent = {
  siteName: string;
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
  testimonialsSection: {
    eyebrow: string;
    title: string;
    badge: string;
    items: Testimonial[];
  };
  contactSection: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    titleTrail: string;
    description: string;
    ctaLabel: string;
    email: string;
    socialHandle: string;
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

export const homeContent = homeContentJson as HomeContent;

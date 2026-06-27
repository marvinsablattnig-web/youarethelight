"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { getVideoUrl, type VideoAsset } from "@/lib/cms/media";
import type { HomeContent } from "@/lib/home-content";

type ModalState = {
  title: string;
  tag: string;
  desc: string;
  video: VideoAsset | null;
} | null;

type PortfolioSiteProps = {
  content: HomeContent;
};

export function PortfolioSite({ content }: PortfolioSiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState<string | null>(
    content.servicesSection.services[0]?.name ?? null,
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [progress, setProgress] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: -300, y: -300 });
  const [finePointer, setFinePointer] = useState(false);

  const revealRootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const resolvedActiveService = content.servicesSection.services.some(
    (service) => service.name === activeService,
  )
    ? activeService
    : (content.servicesSection.services[0]?.name ?? null);
  const heroBackgroundVideoUrl = getVideoUrl(content.hero.backgroundVideo);
  const heroShowreelVideo = content.hero.showreelVideo ?? content.hero.backgroundVideo;

  const syncProgress = useEffectEvent(() => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const nextProgress =
      height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
    setProgress(nextProgress);
  });

  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
      setModal(null);
    }
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: fine)");
    const updatePointerMode = () => setFinePointer(mediaQuery.matches);

    updatePointerMode();
    mediaQuery.addEventListener("change", updatePointerMode);

    return () => {
      mediaQuery.removeEventListener("change", updatePointerMode);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      syncProgress();
    });

    window.addEventListener("scroll", syncProgress, { passive: true });
    window.addEventListener("resize", syncProgress);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncProgress);
      window.removeEventListener("resize", syncProgress);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || modal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, modal]);

  useEffect(() => {
    const root = revealRootRef.current;
    if (!root) {
      return;
    }

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reveal = (element: HTMLElement) => element.classList.add("is-visible");

    const heroElements = root.querySelectorAll<HTMLElement>("header [data-reveal]");
    heroElements.forEach(reveal);

    if (!("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.05 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !finePointer) {
      setCursorVisible(false);
      return;
    }

    const updateCursor = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        setCursorVisible(false);
        return;
      }

      const insideInteractive = Boolean(target.closest("a, button"));
      const insideHero = hero.contains(target);
      setCursorVisible(insideHero && !insideInteractive);
    };

    const hideCursor = () => setCursorVisible(false);

    window.addEventListener("mousemove", updateCursor);
    hero.addEventListener("mouseleave", hideCursor);
    window.addEventListener("scroll", hideCursor, { passive: true });

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      hero.removeEventListener("mouseleave", hideCursor);
      window.removeEventListener("scroll", hideCursor);
    };
  }, [finePointer]);

  const openShowreel = () => {
    setModal({
      tag: content.hero.modalTag,
      title: content.hero.modalTitle,
      desc: content.hero.modalDescription,
      video: heroShowreelVideo,
    });
  };

  const scrollRow = (name: string, direction: number) => {
    const row = rowRefs.current[name];
    if (!row) {
      return;
    }

    const card = row.querySelector<HTMLElement>("figure");
    const step = card ? card.offsetWidth + 16 : Math.round(row.clientWidth * 0.85);

    row.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={revealRootRef}
      className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px] bg-transparent">
        <div
          className="h-full origin-left bg-[var(--gold)]"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <nav className="sticky top-0 z-[80] flex items-center justify-between gap-6 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-[clamp(20px,5vw,64px)] py-4 backdrop-blur-[14px]">
        <a
          href="#top"
          className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ink)] no-underline"
        >
          {content.siteName}
        </a>

        <div className="hidden items-center gap-[clamp(16px,2.4vw,36px)] lg:flex">
          {content.navLinks.map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="navlink relative text-[13px] font-medium text-[var(--muted)] no-underline transition-colors hover:text-[var(--ink)]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#kontakt"
            className="btn-cta rounded-full bg-[var(--gold)] px-[18px] py-[10px] text-[13px] font-semibold text-[var(--bg)] no-underline"
          >
            {content.navCtaLabel}
          </a>
        </div>

        <button
          type="button"
          aria-label="Menue oeffnen"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 flex-col justify-center gap-[5px] rounded-[10px] border border-[var(--line)] bg-transparent px-[9px] lg:hidden"
        >
          <span className="block h-[1.5px] rounded bg-[var(--ink)]" />
          <span className="block h-[1.5px] rounded bg-[var(--ink)]" />
          <span className="block h-[1.5px] rounded bg-[var(--ink)]" />
        </button>
      </nav>

      {menuOpen ? (
        <div className="menu-fade fixed inset-0 z-[110] flex flex-col bg-[var(--bg)] px-[clamp(20px,7vw,40px)] pb-10 pt-[18px] lg:hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ink)]">
              {content.siteName}
            </span>
            <button
              type="button"
              aria-label="Menue schliessen"
              onClick={() => setMenuOpen(false)}
              className="h-11 w-11 rounded-[10px] border border-[var(--line)] bg-transparent text-[22px] leading-none text-[var(--ink)]"
            >
              ✕
            </button>
          </div>

          <div className="my-auto flex flex-col gap-1.5">
            {content.navLinks.map((link, index) => (
              <a
                key={`${link.label}-${link.href}-mobile`}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`font-display text-[clamp(48px,16vw,82px)] leading-[0.98] tracking-[0.02em] no-underline ${
                  link.href === "#kontakt" ? "text-[var(--gold)]" : "text-[var(--ink)]"
                }`}
                style={{
                  animation: `fade-in 0.5s cubic-bezier(.2,.7,.2,1) ${0.05 + index * 0.07}s both`,
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href="#kontakt"
            onClick={() => setMenuOpen(false)}
            className="rounded-full bg-[var(--gold)] px-7 py-[17px] text-center text-base font-semibold text-[var(--bg)] no-underline"
          >
            {content.navCtaLabel}
          </a>
        </div>
      ) : null}

      <header
        id="top"
        ref={heroRef}
        onClick={openShowreel}
        className="relative flex min-h-[90vh] cursor-pointer flex-col justify-end overflow-hidden px-[clamp(20px,5vw,64px)] pb-[clamp(44px,6vw,84px)]"
      >
        {heroBackgroundVideoUrl ? (
          <video
            className="hero-video absolute inset-0 h-full w-full object-cover opacity-40"
            src={heroBackgroundVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(125%_95%_at_72%_8%,transparent_14%,var(--bg)_86%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--bg)_55%,transparent),transparent_30%)]" />
        <div className="font-mono-ui absolute left-1/2 top-[14px] -translate-x-1/2 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--faint)]">
          {content.hero.kicker}
        </div>

        {finePointer ? (
          <div
            className="pointer-events-none fixed left-0 top-0 z-[90] flex items-center gap-3 transition-opacity duration-300 ease-out"
            style={{
              opacity: cursorVisible ? 1 : 0,
              transform: `translate3d(${cursorPosition.x - 33}px, ${cursorPosition.y - 33}px, 0)`,
            }}
          >
            <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[var(--gold)] pl-1 text-xl text-[var(--bg)]">
              ▶
            </span>
            <span className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)] [text-shadow:0_1px_8px_rgba(0,0,0,.7)]">
              {content.hero.cursorLabel}
              <br />
              {content.hero.cursorYear}
            </span>
          </div>
        ) : null}

        <div className="relative mx-auto w-full max-w-[1240px]">
          <div
            data-reveal
            className="reveal font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]"
          >
            {content.hero.eyebrow}
          </div>
          <h1
            data-reveal
            className="reveal font-display mt-[0.1em] text-[clamp(72px,14vw,210px)] leading-[0.86] tracking-[0.01em]"
            style={{ transitionDelay: "0.08s" }}
          >
            {content.hero.titleLead}
            <br />
            the <span className="text-[var(--gold)]">{content.hero.titleAccent}</span>
          </h1>
          <div
            data-reveal
            className="reveal mt-[clamp(28px,3vw,40px)] flex flex-wrap items-end gap-[clamp(28px,4vw,56px)]"
            style={{ transitionDelay: "0.16s" }}
          >
            <p className="m-0 max-w-[480px] text-[clamp(15px,1.2vw,18px)] leading-[1.6] text-[var(--muted)]">
              {content.hero.description}
            </p>
            <div
              className="flex cursor-auto flex-wrap gap-[14px]"
              onClick={(event) => event.stopPropagation()}
            >
              <a
                href="#leistungen"
                className="btn-cta rounded-full bg-[var(--gold)] px-7 py-[15px] text-[15px] font-semibold text-[var(--bg)] no-underline"
              >
                {content.hero.primaryCtaLabel}
              </a>
              <a
                href="#kontakt"
                className="rounded-full border border-[var(--ink)] px-7 py-[14px] text-[15px] font-semibold text-[var(--ink)] no-underline transition hover:bg-[var(--ink)] hover:text-[var(--bg)]"
              >
                {content.hero.secondaryCtaLabel}
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[clamp(40px,8vw,90px)] right-[clamp(22px,4vw,44px)] hidden flex-col items-center gap-[14px] text-[var(--muted)] lg:flex">
          <span className="font-mono-ui [writing-mode:vertical-rl] text-[10px] font-medium uppercase tracking-[0.34em]">
            {content.hero.scrollLabel}
          </span>
          <span className="pulse-y h-[46px] w-px bg-[var(--gold)]" />
        </div>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2.5 text-[var(--muted)] lg:hidden">
          <span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.2em]">
            {content.hero.scrollLabel}
          </span>
          <span className="pulse-x h-px w-[30px] bg-[var(--gold)]" />
        </div>
      </header>

      <div className="overflow-hidden border-y border-[var(--line)] py-[18px]">
        <div className="marquee-track font-display inline-flex whitespace-nowrap text-[clamp(30px,4.6vw,60px)] tracking-[0.02em] text-[var(--faint)]">
          {[0, 1].map((index) => (
            <span key={index}>
              {content.marqueeItems.map((item, itemIndex) => (
                <span key={`${index}-${item}-${itemIndex}`}>
                  {item}
                  &nbsp;&nbsp;<span className="text-[var(--gold)]">·</span>&nbsp;&nbsp;
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section id="leistungen" className="px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)]">
        <div data-reveal className="reveal mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-end justify-between gap-10">
            <div>
              <div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]">
                {content.servicesSection.eyebrow}
              </div>
              <h2 className="font-display mt-[18px] text-[clamp(46px,7vw,104px)] leading-[0.94] tracking-[0.01em]">
                {content.servicesSection.titleLine1}
                <br />
                {content.servicesSection.titleLine2}
              </h2>
            </div>
            <p className="m-0 max-w-[400px] text-[clamp(15px,1.1vw,17px)] leading-[1.6] text-[var(--muted)]">
              {content.servicesSection.description}
            </p>
          </div>

          <div className="mt-[clamp(44px,6vw,72px)] border-t border-[var(--line)]">
            {content.servicesSection.services.map((service) => {
              const isOpen = resolvedActiveService === service.name;

              return (
                <div key={service.name} data-reveal className="reveal border-b border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveService((current) =>
                        current === service.name ? null : service.name,
                      )
                    }
                    className="group grid w-full grid-cols-[clamp(46px,7vw,100px)_1fr_auto] items-center gap-[clamp(14px,4vw,56px)] bg-transparent px-[6px] py-[clamp(24px,3.4vw,42px)] text-left text-[var(--ink)] transition hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] hover:pl-[22px]"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-[clamp(28px,3.4vw,48px)] leading-none text-[var(--gold)]">
                      {service.num}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-4">
                      <span className="font-display text-[clamp(30px,4.4vw,60px)] leading-none tracking-[0.01em]">
                        {service.name}
                      </span>
                      <span className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                        {service.count}
                      </span>
                    </span>
                    <span className="flex h-[clamp(34px,4vw,46px)] w-[clamp(34px,4vw,46px)] items-center justify-center">
                      <span className="text-[var(--gold)] transition-transform duration-300 group-hover:scale-110">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="accordion-in overflow-hidden px-[6px] pb-[clamp(30px,3.6vw,46px)] pt-0.5">
                      <div className="mb-5 flex flex-wrap items-end justify-between gap-6">
                        <p className="m-0 max-w-[580px] text-[clamp(15px,1.1vw,17px)] leading-[1.65] text-[var(--muted)]">
                          {service.desc}
                        </p>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            aria-label="Zurueck"
                            onClick={() => scrollRow(service.name, -1)}
                            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line)] bg-transparent text-base text-[var(--ink)] transition hover:-translate-x-[3px] hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--bg)]"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            aria-label="Weiter"
                            onClick={() => scrollRow(service.name, 1)}
                            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line)] bg-transparent text-base text-[var(--ink)] transition hover:translate-x-[3px] hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--bg)]"
                          >
                            →
                          </button>
                        </div>
                      </div>

                      <div
                        ref={(element) => {
                          rowRefs.current[service.name] = element;
                        }}
                        className="row-scroll -mx-1 flex gap-4 overflow-x-auto overflow-y-hidden px-1 pb-4 pt-1"
                      >
                        {service.items.map((item) => {
                          const itemVideo = item.video ?? heroShowreelVideo ?? null;
                          const itemVideoUrl = getVideoUrl(itemVideo);

                          return (
                            <figure
                              key={`${service.name}-${item.tag}-${item.title}`}
                              className="vidcard relative m-0 aspect-[16/10] w-[clamp(258px,30vw,360px)] flex-none cursor-pointer overflow-hidden rounded-[9px] border border-[var(--line)] bg-[repeating-linear-gradient(135deg,var(--stripe-a)_0_14px,var(--stripe-b)_14px_28px)] transition hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--gold)_60%,transparent)] hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,.75)]"
                              onClick={() =>
                                setModal({
                                  tag: `${service.name} · ${item.tag}`,
                                  title: item.title,
                                  desc: service.desc,
                                  video: itemVideo,
                                })
                              }
                            >
                              {itemVideoUrl ? (
                                <video
                                  className="absolute inset-0 h-full w-full object-cover"
                                  src={itemVideoUrl}
                                  poster={itemVideo?.posterUrl || undefined}
                                  muted
                                  loop
                                  playsInline
                                  autoPlay
                                  preload="none"
                                />
                              ) : null}
                              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,.88),rgba(20,20,20,.05)_52%)]" />
                              <div className="card-overlay pointer-events-none absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] opacity-0 transition-opacity">
                                <span className="font-mono-ui rounded-full bg-[var(--gold)] px-4 py-[9px] text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--bg)]">
                                  {content.servicesSection.watchLabel}
                                </span>
                              </div>
                              {!itemVideoUrl ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_74%,transparent)]">
                                  <span className="font-mono-ui rounded-full border border-[var(--line)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                                    Video folgt
                                  </span>
                                </div>
                              ) : null}
                              <span className="font-mono-ui absolute left-[13px] top-[11px] rounded-full bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] px-[9px] py-[5px] text-[10px] font-medium uppercase tracking-[0.13em] text-[var(--ink)] backdrop-blur-md">
                                {item.tag}
                              </span>
                              <div className="absolute inset-x-[14px] bottom-3 flex items-end justify-between gap-2.5">
                                <span className="font-display text-[26px] leading-[0.95] tracking-[0.02em]">
                                  {item.title}
                                </span>
                                <span className="play-dot flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--gold)] text-[13px] text-[var(--bg)]">
                                  ▶
                                </span>
                              </div>
                            </figure>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="ablauf"
        className="bg-[var(--surface)] px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)]"
      >
        <div data-reveal className="reveal mx-auto max-w-[1240px]">
          <div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]">
            {content.processSection.eyebrow}
          </div>
          <h2 className="font-display mt-[18px] max-w-[16ch] text-[clamp(46px,7vw,104px)] leading-[0.94] tracking-[0.01em]">
            {content.processSection.title}
          </h2>
          <div className="mt-[clamp(44px,6vw,68px)] grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[clamp(24px,3vw,44px)]">
            {content.processSection.steps.map((step, index) => (
              <div
                key={step.num}
                data-reveal
                className="reveal border-t border-[var(--line)] pt-6"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="font-display text-[clamp(50px,5.6vw,76px)] leading-none text-[var(--gold)]">
                  {step.num}
                </div>
                <h3 className="font-display mb-[10px] mt-[14px] text-[clamp(26px,2.8vw,38px)] tracking-[0.01em]">
                  {step.title}
                </h3>
                <p className="m-0 text-[15px] leading-[1.6] text-[var(--muted)]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)]">
        <div data-reveal className="reveal mx-auto max-w-[1240px]">
          <div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]">
            {content.testimonialsSection.eyebrow}
          </div>
          <h2 className="font-display mb-[clamp(40px,5vw,60px)] mt-[18px] text-[clamp(46px,7vw,104px)] leading-[0.94] tracking-[0.01em]">
            {content.testimonialsSection.title}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[18px]">
            {content.testimonialsSection.items.map((testimonial) => (
              <figure
                key={`${testimonial.name}-${testimonial.quote}`}
                className="relative m-0 rounded-[8px] border border-[var(--line)] p-[clamp(28px,3vw,40px)] transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--gold)_40%,transparent)]"
              >
                <span className="font-mono-ui absolute right-4 top-[14px] rounded-full border border-[var(--line)] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--faint)]">
                  {testimonial.badge || content.testimonialsSection.badge}
                </span>
                <div className="font-display h-[30px] text-[60px] leading-[0.5] text-[var(--gold)]">
                  “
                </div>
                <blockquote className="m-0 text-[clamp(19px,1.7vw,24px)] leading-[1.45] tracking-[-0.01em]">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-[14px]">
                  <span className="h-11 w-11 rounded-full bg-[repeating-linear-gradient(135deg,var(--stripe-a)_0_6px,var(--stripe-b)_6px_12px)]" />
                  <span className="font-mono-ui text-xs font-medium text-[var(--muted)]">
                    {testimonial.name}
                    <br />
                    <span className="text-[var(--faint)]">{testimonial.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        id="kontakt"
        className="relative overflow-hidden border-t border-[var(--line)] px-[clamp(20px,5vw,64px)] py-[clamp(96px,13vw,180px)]"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,var(--stripe-a)_0_22px,var(--stripe-b)_22px_44px)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_120%,transparent_30%,var(--bg)_88%)]" />
        <div data-reveal className="reveal relative mx-auto max-w-[980px] text-center">
          <div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]">
            {content.contactSection.eyebrow}
          </div>
          <h2 className="font-display mt-5 text-[clamp(52px,9vw,134px)] leading-[0.92] tracking-[0.01em]">
            {content.contactSection.titleLead}
            <br />
            <span className="text-[var(--gold)]">{content.contactSection.titleAccent}</span>{" "}
            {content.contactSection.titleTrail}
          </h2>
          <p className="mx-auto mt-[26px] max-w-[520px] text-[clamp(15px,1.2vw,18px)] leading-[1.6] text-[var(--muted)]">
            {content.contactSection.description}
          </p>
          <a
            href={`mailto:${content.contactSection.email}`}
            className="btn-cta mt-[34px] inline-block rounded-full bg-[var(--gold)] px-9 py-[17px] text-base font-semibold text-[var(--bg)] no-underline"
          >
            {content.contactSection.ctaLabel}
          </a>
          <div className="font-mono-ui mt-[30px] text-xs font-medium tracking-[0.12em] text-[var(--muted)]">
            <a
              href={`mailto:${content.contactSection.email}`}
              className="text-inherit no-underline"
            >
              {content.contactSection.email}
            </a>
            &nbsp;&nbsp;·&nbsp;&nbsp;{content.contactSection.socialHandle}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-[clamp(20px,5vw,64px)] pb-10 pt-[clamp(48px,6vw,72px)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10">
          <div className="max-w-[300px]">
            <div className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em]">
              {content.siteName}
            </div>
            <p className="font-display mt-[14px] text-[30px] leading-none tracking-[0.02em] text-[var(--muted)]">
              {content.footer.tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-[clamp(40px,6vw,90px)]">
            <div className="flex flex-col gap-3">
              <span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--faint)]">
                {content.footer.menuTitle}
              </span>
              {content.navLinks.map((link) => (
                <a
                  key={`${link.label}-${link.href}-footer`}
                  href={link.href}
                  className="text-sm font-medium text-[var(--muted)] no-underline transition hover:text-[var(--gold)]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--faint)]">
                {content.footer.legalTitle}
              </span>
              <a
                href={content.footer.imprintHref}
                className="text-sm font-medium text-[var(--muted)] no-underline transition hover:text-[var(--gold)]"
              >
                {content.footer.imprintLabel}
              </a>
              <a
                href={content.footer.privacyHref}
                className="text-sm font-medium text-[var(--muted)] no-underline transition hover:text-[var(--gold)]"
              >
                {content.footer.privacyLabel}
              </a>
            </div>
          </div>
        </div>

        <div className="font-mono-ui mx-auto mt-[clamp(40px,5vw,60px)] flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-[var(--line)] pt-6 text-[11px] font-medium tracking-[0.06em] text-[var(--faint)]">
          <span>{content.footer.copyright}</span>
          <span>{content.footer.credits}</span>
        </div>
      </footer>

      {modal ? (
        <div
          className="menu-fade fixed inset-0 z-[200] flex items-center justify-center bg-[color-mix(in_srgb,#0c0c0c_86%,transparent)] px-[clamp(16px,4vw,52px)] py-4 backdrop-blur-[12px]"
          onClick={() => setModal(null)}
        >
          <div
            className="modal-in w-full max-w-[1080px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-[14px] flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--gold)]">
                  {modal.tag}
                </div>
                <h3 className="font-display mt-1.5 text-[clamp(34px,5vw,64px)] tracking-[0.02em] text-[var(--ink)]">
                  {modal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="font-mono-ui rounded-full border border-[var(--line)] px-4 py-[11px] text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--bg)]"
              >
                Schliessen ✕
              </button>
            </div>
            {getVideoUrl(modal.video) ? (
              <video
                src={getVideoUrl(modal.video) || undefined}
                poster={modal.video?.posterUrl || undefined}
                autoPlay
                playsInline
                controls
                loop
                className="block aspect-video w-full rounded-xl border border-[var(--line)] bg-black object-cover"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,black)]">
                <span className="font-mono-ui text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                  Kein Video hinterlegt
                </span>
              </div>
            )}
            <p className="mt-4 max-w-[760px] text-[clamp(14px,1.1vw,16px)] leading-[1.65] text-[var(--muted)]">
              {modal.desc}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { tinaField } from "tinacms/dist/react";

import { getImageUrl, getVideoSourceType, type VideoAsset } from "@/lib/cms/media";
import type { HomeContent } from "@/lib/home-content";
import type { HomepageQuery } from "@/tina/__generated__/types";
import { MobileMenuToggle } from "./mobile-menu-toggle";
import { VideoMedia } from "./video-media";

type ModalState = {
	title: string;
	tag: string;
	desc: string;
	links: {
		label: string;
		href: string;
	}[];
	video: VideoAsset | null;
	serviceName: string | null;
	itemIndex: number | null;
} | null;

type PortfolioSiteProps = {
	content: HomeContent;
	tinaDocument: HomepageQuery["homepage"];
};

export function PortfolioSite({ content, tinaDocument }: PortfolioSiteProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [activeService, setActiveService] = useState<string | null>(content.servicesSection.services[0]?.name ?? null);
	const [modal, setModal] = useState<ModalState>(null);
	const [progress, setProgress] = useState(0);
	const [cursorVisible, setCursorVisible] = useState(false);
	const [cursorPosition, setCursorPosition] = useState({ x: -300, y: -300 });
	const [finePointer, setFinePointer] = useState(false);
	const [isTouchMobile, setIsTouchMobile] = useState(false);
	const [emailCopied, setEmailCopied] = useState(false);
	const [activeProcessStep, setActiveProcessStep] = useState<number | null>(null);
	const [heroParallax, setHeroParallax] = useState(0);
	const [contactParallax, setContactParallax] = useState(0);

	const revealRootRef = useRef<HTMLDivElement | null>(null);
	const heroRef = useRef<HTMLElement | null>(null);
	const contactRef = useRef<HTMLElement | null>(null);
	const modalScrollRef = useRef<HTMLDivElement | null>(null);
	const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const stepCardRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const testimonialCardRefs = useRef<Record<number, HTMLElement | null>>({});
	const ambientGlowRef = useRef<HTMLDivElement | null>(null);
	const ambientTargetRef = useRef({ x: -9999, y: -9999 });
	const ambientCurrentRef = useRef({ x: -9999, y: -9999 });
	const ambientOpacityRef = useRef(0);
	const ambientActiveRef = useRef(false);
	const ambientBoostRef = useRef(false);
	const resolvedActiveService = content.servicesSection.services.some((service) => service.name === activeService) ? activeService : null;
	const heroDocument = tinaDocument.hero;
	const servicesSectionDocument = tinaDocument.servicesSection;
	const processSectionDocument = tinaDocument.processSection;
	const aboutSectionDocument = tinaDocument.aboutSection;
	const testimonialsSectionDocument = tinaDocument.testimonialsSection;
	const partnersSectionDocument = tinaDocument.partnersSection;
	const contactSectionDocument = tinaDocument.contactSection;
	const footerDocument = tinaDocument.footer;
	const heroBackgroundVideoType = getVideoSourceType(content.hero.backgroundVideo);
	const heroShowreelVideo = content.hero.showreelVideo ?? content.hero.backgroundVideo;
	const logoUrl = getImageUrl(content.logo);
	const contactBackgroundImageUrl = getImageUrl(content.contactSection.backgroundImage);
	const aboutPhotoUrl = getImageUrl(content.aboutSection.photo);
	const contactBackgroundVideoType = getVideoSourceType(content.contactSection.backgroundVideo);
	const processProgress = activeProcessStep === null || content.processSection.steps.length === 0 ? 0 : ((activeProcessStep + 1) / content.processSection.steps.length) * 100;
	const modalService = modal?.serviceName ? content.servicesSection.services.find((service) => service.name === modal.serviceName) ?? null : null;
	const modalHasItemNavigation = Boolean(modalService && modal?.itemIndex !== null && modal?.itemIndex !== undefined && (modal?.itemIndex ?? -1) >= 0);
	const modalItemPosition = modalHasItemNavigation ? (modal?.itemIndex ?? 0) + 1 : null;
	const modalItemCount = modalService?.items.length ?? 0;
	const modalItemTag = modalHasItemNavigation && modalService ? modalService.items[modal?.itemIndex ?? 0]?.tag ?? "" : "";
	const modalVideoRatio = getVideoAspectRatioValue(modal?.video) || 16 / 9;
	const modalVideoMaxHeight = "calc(100svh - 220px)";

	const resetModalScroll = () => {
		modalScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
	};

	const openServiceModal = (service: HomeContent["servicesSection"]["services"][number], item: HomeContent["servicesSection"]["services"][number]["items"][number], itemIndex: number) => {
		const itemVideo = item.video ?? heroShowreelVideo ?? null;

		setModal({
			tag: `${service.name} · ${item.tag}`,
			title: item.title,
			desc: item.description || service.desc,
			links: item.links ?? [],
			video: itemVideo,
			serviceName: service.name,
			itemIndex,
		});
	};

	const stepModalItem = (direction: -1 | 1) => {
		if (!modalService || modal?.itemIndex === null || modal?.itemIndex === undefined) {
			return;
		}

		const nextIndex = modal.itemIndex + direction;

		if (nextIndex < 0 || nextIndex >= modalService.items.length) {
			return;
		}

		resetModalScroll();
		openServiceModal(modalService, modalService.items[nextIndex], nextIndex);
	};

	const switchModalService = (serviceName: string) => {
		const nextService = content.servicesSection.services.find((service) => service.name === serviceName) ?? null;

		if (!nextService || nextService.items.length === 0) {
			return;
		}

		const nextIndex = modal?.itemIndex !== null && modal?.itemIndex !== undefined ? Math.min(modal.itemIndex, nextService.items.length - 1) : 0;

		setActiveService(nextService.name);
		resetModalScroll();
		openServiceModal(nextService, nextService.items[nextIndex], nextIndex);
	};

	const syncProgress = useEffectEvent(() => {
		const scrollY = window.scrollY;
		const height = globalThis.document.documentElement.scrollHeight - window.innerHeight;
		const nextProgress = height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0;

		const heroOffset = Math.min(112, scrollY * 0.24);
		const contactRect = contactRef.current?.getBoundingClientRect();
		const contactOffset = contactRect ? Math.max(-34, Math.min(34, ((window.innerHeight - contactRect.top) / (window.innerHeight + contactRect.height) - 0.48) * 76)) : 0;

		setProgress(nextProgress);
		setHeroParallax(heroOffset);
		setContactParallax(contactOffset);
	});

	const handleEscape = useEffectEvent((event: KeyboardEvent) => {
		if (event.key === "Escape") {
			setMenuOpen(false);
			setModal(null);
			return;
		}

		if (!modalHasItemNavigation) {
			return;
		}

		if (event.key === "ArrowLeft") {
			stepModalItem(-1);
		}

		if (event.key === "ArrowRight") {
			stepModalItem(1);
		}
	});

	const updateAmbientGlow = useEffectEvent((event: MouseEvent) => {
		ambientTargetRef.current = { x: event.clientX, y: event.clientY };
		const target = event.target;

		if (!(target instanceof HTMLElement)) {
			ambientActiveRef.current = false;
			return;
		}

		const insideHero = Boolean(heroRef.current?.contains(target));
		const overlayOpen = menuOpen || Boolean(modal);
		ambientActiveRef.current = !insideHero && !overlayOpen;
		ambientBoostRef.current = Boolean(target.closest("a, button"));
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
		const pointerQuery = window.matchMedia("(pointer: coarse)");
		const widthQuery = window.matchMedia("(max-width: 1023px)");
		const updateTouchMobile = () => setIsTouchMobile(pointerQuery.matches && widthQuery.matches);

		updateTouchMobile();
		pointerQuery.addEventListener("change", updateTouchMobile);
		widthQuery.addEventListener("change", updateTouchMobile);

		return () => {
			pointerQuery.removeEventListener("change", updateTouchMobile);
			widthQuery.removeEventListener("change", updateTouchMobile);
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
		globalThis.document.body.style.overflow = menuOpen || modal ? "hidden" : "";
		return () => {
			globalThis.document.body.style.overflow = "";
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
		if (!isTouchMobile || !("IntersectionObserver" in window)) {
			return;
		}

		const cards = Object.values(stepCardRefs.current).filter((card): card is HTMLDivElement => Boolean(card));
		if (cards.length === 0) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) {
						return;
					}

					const index = Number(entry.target.getAttribute("data-step-index"));
					if (Number.isNaN(index)) {
						return;
					}

					setActiveProcessStep(index);
					cards.forEach((card) => card.classList.toggle("is-active", card === entry.target));
				});
			},
			{ rootMargin: "-45% 0px -45% 0px", threshold: 0 },
		);

		cards.forEach((card) => observer.observe(card));

		return () => {
			cards.forEach((card) => card.classList.remove("is-active"));
			observer.disconnect();
		};
	}, [isTouchMobile, content.processSection.steps.length]);

	useEffect(() => {
		if (!isTouchMobile || !("IntersectionObserver" in window)) {
			return;
		}

		const cards = Object.values(testimonialCardRefs.current).filter((card): card is HTMLElement => Boolean(card));
		if (cards.length === 0) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) {
						return;
					}

					cards.forEach((card) => card.classList.toggle("is-active", card === entry.target));
				});
			},
			{ rootMargin: "-45% 0px -45% 0px", threshold: 0 },
		);

		cards.forEach((card) => observer.observe(card));

		return () => {
			cards.forEach((card) => card.classList.remove("is-active"));
			observer.disconnect();
		};
	}, [isTouchMobile, content.testimonialsSection.items.length]);

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

	useEffect(() => {
		const glow = ambientGlowRef.current;
		if (!glow || !finePointer) {
			return;
		}

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reducedMotion) {
			return;
		}

		const handleMouseMove = (event: MouseEvent) => updateAmbientGlow(event);
		const hideGlow = () => {
			ambientActiveRef.current = false;
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseleave", hideGlow);
		window.addEventListener("blur", hideGlow);

		let frameId = 0;

		const tick = () => {
			const target = ambientTargetRef.current;
			const current = ambientCurrentRef.current;

			current.x += (target.x - current.x) * 0.06;
			current.y += (target.y - current.y) * 0.06;

			const targetOpacity = ambientActiveRef.current ? (ambientBoostRef.current ? 0.45 : 0.14) : 0;
			ambientOpacityRef.current += (targetOpacity - ambientOpacityRef.current) * 0.08;

			const scale = ambientActiveRef.current && ambientBoostRef.current ? 1.3 : 1;

			glow.style.transform = `translate3d(${current.x - 40}px, ${current.y - 40}px, 0) scale(${scale})`;
			glow.style.opacity = String(ambientOpacityRef.current);

			frameId = window.requestAnimationFrame(tick);
		};

		frameId = window.requestAnimationFrame(tick);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseleave", hideGlow);
			window.removeEventListener("blur", hideGlow);
			window.cancelAnimationFrame(frameId);
		};
	}, [finePointer]);

	const openShowreel = () => {
		setModal({
			tag: content.hero.modalTag,
			title: content.hero.modalTitle,
			desc: content.hero.modalDescription,
			links: [],
			video: heroShowreelVideo,
			serviceName: null,
			itemIndex: null,
		});
		resetModalScroll();
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

	const copyEmail = async () => {
		const email = content.contactSection.email.trim();

		if (!email) {
			return;
		}

		const fallbackCopy = () => {
			const input = document.createElement("input");
			input.value = email;
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
		};

		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(email);
			} else {
				fallbackCopy();
			}

			setEmailCopied(true);
			window.setTimeout(() => {
				setEmailCopied(false);
			}, 1800);
		} catch {
			fallbackCopy();
			setEmailCopied(true);
			window.setTimeout(() => {
				setEmailCopied(false);
			}, 1800);
		}
	};

	const renderLogo = (className: string) => {
		if (logoUrl) {
			return <img src={logoUrl} alt={content.logo?.alt || content.siteName} className={className} />;
		}

		return <span>{content.siteName}</span>;
	};

	function getVideoAspectRatio(video?: VideoAsset | null) {
		if (!video?.width || !video?.height) {
			return null;
		}

		return `${video.width} / ${video.height}`;
	}

	function getVideoAspectRatioValue(video?: VideoAsset | null) {
		if (!video?.width || !video?.height) {
			return null;
		}

		return video.width / video.height;
	}

	return (
		<div ref={revealRootRef} className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
			<div className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px] bg-transparent">
				<div className="h-full origin-left bg-[var(--gold)]" style={{ transform: `scaleX(${progress})` }} />
			</div>

			{finePointer ? (
				<div
					ref={ambientGlowRef}
					aria-hidden="true"
					className="pointer-events-none fixed left-0 top-0 z-[75] h-[80px] w-[80px] rounded-full mix-blend-screen blur-[20px] will-change-transform"
					style={{
						background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)",
						opacity: 0,
						transform: "translate3d(-9999px, -9999px, 0)",
					}}
				/>
			) : null}

			<nav className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between gap-6 bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-[clamp(20px,5vw,64px)] py-4 backdrop-blur-[14px]">
				<a href="#top" className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ink)] no-underline" data-tina-field={tinaField(tinaDocument, "logo")}>
					{renderLogo("h-8 w-auto max-w-[180px] object-contain")}
				</a>

				<div className="hidden items-center gap-[clamp(16px,2.4vw,36px)] lg:flex">
					{content.navLinks.map((link, index) => (
						<a key={`${link.label}-${link.href}`} href={link.href} className="navlink relative text-[13px] font-medium text-[var(--muted)] no-underline transition-colors hover:text-[var(--ink)]" data-tina-field={tinaField(tinaDocument.navLinks?.[index], "label")}>
							{link.label}
						</a>
					))}
					<a href={`mailto:${content.contactSection.email}`} className="btn-cta rounded-full bg-[var(--gold)] px-[18px] py-[10px] text-[13px] font-semibold text-[var(--bg)] no-underline" data-tina-field={tinaField(tinaDocument, "navCtaLabel")}>
						{content.navCtaLabel}
					</a>
				</div>

				<button
					type="button"
					aria-label="Menue oeffnen"
					aria-expanded={menuOpen}
					onClick={() => setMenuOpen(true)}
					className="flex h-11 w-11 items-center justify-center bg-transparent p-0 text-[var(--ink)] opacity-90 transition hover:opacity-100 lg:hidden"
				>
					<MobileMenuToggle open={false} className="h-8 w-8" />
				</button>
			</nav>

			{menuOpen ? (
				<div className="menu-fade fixed inset-0 z-[110] flex flex-col bg-[var(--bg)] px-[clamp(20px,7vw,40px)] pb-10 pt-[18px] lg:hidden">
					<div className="flex items-center justify-between">
						<span className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ink)]" data-tina-field={tinaField(tinaDocument, "logo")}>
							{renderLogo("h-8 w-auto max-w-[160px] object-contain")}
						</span>
						<button
							type="button"
							aria-label="Menue schliessen"
							onClick={() => setMenuOpen(false)}
							className="flex h-11 w-11 items-center justify-center bg-transparent p-0 text-[var(--ink)] opacity-90 transition hover:opacity-100"
						>
							<MobileMenuToggle open className="h-8 w-8" />
						</button>
					</div>

					<div className="my-auto flex flex-col gap-1.5">
						{content.navLinks.map((link, index) => (
							<a
								key={`${link.label}-${link.href}-mobile`}
								href={link.href}
								onClick={() => setMenuOpen(false)}
								className={`font-display text-[clamp(48px,16vw,82px)] leading-[0.98] tracking-[0.02em] no-underline ${link.href === "#kontakt" ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}
								style={{
									animation: `fade-in 0.5s cubic-bezier(.2,.7,.2,1) ${0.05 + index * 0.07}s both`,
								}}
								data-tina-field={tinaField(tinaDocument.navLinks?.[index], "label")}
							>
								{link.label}
							</a>
						))}
					</div>

					<a href={`mailto:${content.contactSection.email}`} onClick={() => setMenuOpen(false)} className="rounded-full bg-[var(--gold)] px-7 py-[17px] text-center text-base font-semibold text-[var(--bg)] no-underline" data-tina-field={tinaField(tinaDocument, "navCtaLabel")}>
						{content.navCtaLabel}
					</a>
				</div>
			) : null}

			<header id="top" ref={heroRef} onClick={openShowreel} className="relative flex min-h-svh cursor-pointer flex-col justify-end overflow-hidden px-[clamp(20px,5vw,64px)] pb-[clamp(44px,6vw,84px)]">
				{heroBackgroundVideoType ? (
					<div className="pointer-events-none absolute inset-[-10%] will-change-transform" style={{ transform: `translate3d(0, ${heroParallax}px, 0)` }}>
						<VideoMedia
							asset={content.hero.backgroundVideo}
							title={content.hero.backgroundVideo?.title || content.hero.modalTitle || "Hero Video"}
							className="hero-video h-full w-full object-cover opacity-40"
							autoPlay
							muted
							loop
							playsInline
							preload="auto"
							background={heroBackgroundVideoType === "vimeo"}
							pointerEventsNone
						/>
					</div>
				) : null}
				<div className="absolute inset-0 bg-[radial-gradient(125%_95%_at_72%_8%,transparent_14%,var(--bg)_86%)]" />
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--bg)_55%,transparent),transparent_30%)]" />
				{finePointer ? (
					<div
						className="pointer-events-none fixed left-0 top-0 z-[90] flex items-center gap-3 transition-opacity duration-300 ease-out"
						style={{
							opacity: cursorVisible ? 1 : 0,
							transform: `translate3d(${cursorPosition.x - 33}px, ${cursorPosition.y - 33}px, 0)`,
						}}
					>
						<span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[var(--gold)] text-[var(--bg)]">
							<Play className="h-6 w-6 fill-current" />
						</span>
						<span className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)] [text-shadow:0_1px_8px_rgba(0,0,0,.7)]">
							{content.hero.cursorLabel}
							<br />
							{content.hero.cursorYear}
						</span>
					</div>
				) : null}

				<div className="relative mx-auto w-full max-w-[1240px]">
					<div data-reveal className="reveal font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(heroDocument, "eyebrow")}>
						{content.hero.eyebrow}
					</div>
					<h1 data-reveal className="reveal font-display mt-[0.1em] text-[clamp(72px,14vw,210px)] leading-[0.86] tracking-[0.01em]" style={{ transitionDelay: "0.08s" }} data-tina-field={tinaField(heroDocument, "titleLead")}>
						{content.hero.titleLead}
						<br />
						the <span className="text-[var(--gold)]">{content.hero.titleAccent}</span>
					</h1>
					<div data-reveal className="reveal mt-[clamp(28px,3vw,40px)] flex flex-wrap items-end gap-[clamp(28px,4vw,56px)]" style={{ transitionDelay: "0.16s" }}>
						<p className="m-0 max-w-[480px] text-[clamp(15px,1.2vw,18px)] leading-[1.6] text-[var(--muted)]" data-tina-field={tinaField(heroDocument, "description")}>
							{content.hero.description}
						</p>
						<div className="flex cursor-auto flex-wrap gap-[14px]" onClick={(event) => event.stopPropagation()}>
							<a href="#leistungen" className="btn-cta rounded-full bg-[var(--gold)] px-7 py-[15px] text-[15px] font-semibold text-[var(--bg)] no-underline" data-tina-field={tinaField(heroDocument, "primaryCtaLabel")}>
								{content.hero.primaryCtaLabel}
							</a>
							<a href="#kontakt" className="btn-cta rounded-full border border-[var(--ink)] px-7 py-[14px] text-[15px] font-semibold text-[var(--ink)] no-underline hover:bg-[var(--ink)] hover:text-[var(--bg)]" data-tina-field={tinaField(heroDocument, "secondaryCtaLabel")}>
								{content.hero.secondaryCtaLabel}
							</a>
						</div>
					</div>
				</div>

				<div className="absolute bottom-[clamp(40px,8vw,90px)] right-[clamp(22px,4vw,44px)] hidden flex-col items-center gap-[14px] text-[var(--muted)] lg:flex">
					<span className="font-mono-ui [writing-mode:vertical-rl] text-[10px] font-medium uppercase tracking-[0.34em]">{content.hero.scrollLabel}</span>
					<span className="pulse-y h-[46px] w-px bg-[var(--gold)]" />
				</div>
				<div className="absolute top-[clamp(76px,18vw,100px)] right-[clamp(20px,5vw,28px)] flex flex-col items-center gap-[10px] text-[var(--muted)] lg:hidden">
					<span className="font-mono-ui [writing-mode:vertical-rl] text-[10px] font-medium uppercase tracking-[0.34em]">{content.hero.scrollLabel}</span>
					<span className="pulse-y h-[36px] w-px bg-[var(--gold)]" />
				</div>
			</header>

			<div className="overflow-hidden border-y border-[var(--line)] py-5">
				<div className="marquee-track font-display inline-flex items-center whitespace-nowrap leading-none text-[clamp(30px,4.6vw,60px)] tracking-[0.02em] text-[var(--faint)]">
					{[0, 1].map((index) => (
						<span key={index}>
							{content.marqueeItems.map((item, itemIndex) => (
								<span key={`${index}-${item}-${itemIndex}`} data-tina-field={tinaField(tinaDocument, "marqueeItems", itemIndex)}>
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
							<div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(servicesSectionDocument, "eyebrow")}>
								{content.servicesSection.eyebrow}
							</div>
							<h2 className="font-display mt-[18px] text-[clamp(46px,7vw,104px)] leading-[0.94] tracking-[0.01em]" data-tina-field={tinaField(servicesSectionDocument, "titleLine1")}>
								{content.servicesSection.titleLine1}
								<br />
								{content.servicesSection.titleLine2}
							</h2>
						</div>
						<p className="m-0 max-w-[400px] text-[clamp(15px,1.1vw,17px)] leading-[1.6] text-[var(--muted)]" data-tina-field={tinaField(servicesSectionDocument, "description")}>
							{content.servicesSection.description}
						</p>
					</div>

					<div className="mt-[clamp(44px,6vw,72px)] border-t border-[var(--line)]">
						{content.servicesSection.services.map((service, serviceIndex) => {
							const isOpen = resolvedActiveService === service.name;
							const serviceDocument = servicesSectionDocument?.services?.[serviceIndex];

							return (
								<div key={service.name} data-reveal className="reveal border-b border-[var(--line)]">
									<button
										type="button"
										onClick={() => setActiveService((current) => (current === service.name ? null : service.name))}
										className="group grid w-full cursor-pointer grid-cols-[clamp(46px,7vw,100px)_1fr_auto] items-center gap-[clamp(14px,4vw,56px)] bg-transparent px-[6px] py-[clamp(24px,3.4vw,42px)] text-left text-[var(--ink)] transition duration-500 ease-out hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] hover:pl-[22px]"
										aria-expanded={isOpen}
										data-tina-field={tinaField(serviceDocument, "name")}
									>
										<span className="font-display text-[clamp(28px,3.4vw,48px)] leading-none text-[var(--gold)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5">{service.num}</span>
										<span className="flex flex-wrap items-baseline gap-4">
											<span className="font-display text-[clamp(30px,4.4vw,60px)] leading-none tracking-[0.01em] transition-transform duration-500 ease-out group-hover:translate-x-1.5">{service.name}</span>
											<span className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)] transition-colors duration-500 ease-out group-hover:text-[var(--ink)]">{service.count}</span>
										</span>
										<span className="flex h-[clamp(46px,5.4vw,64px)] w-[clamp(46px,5.4vw,64px)] items-center justify-center">
											<Play className={`h-7 w-7 fill-current text-[var(--gold)] transition-transform duration-500 ease-out ${isOpen ? "rotate-90 scale-110" : "rotate-0 group-hover:rotate-180 group-hover:scale-110"}`} />
										</span>
									</button>

									<div className={`accordion-shell ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
										<div className="accordion-panel">
											<div className="accordion-content overflow-hidden px-[6px] pb-[clamp(30px,3.6vw,46px)] pt-[clamp(16px,2vw,28px)]">
												<div className="mb-5 flex flex-wrap items-end justify-between gap-6">
													<p className="m-0 max-w-[580px] text-[clamp(15px,1.1vw,17px)] leading-[1.65] text-[var(--muted)]">{service.desc}</p>
													<div className="flex gap-2.5">
														<button
															type="button"
															aria-label="Zurueck"
															disabled={!isOpen}
															onClick={() => scrollRow(service.name, -1)}
															className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line)] bg-transparent text-base text-[var(--ink)] transition duration-300 ease-out hover:-translate-x-[3px] hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--bg)] disabled:pointer-events-none disabled:opacity-30"
														>
															<ChevronLeft className="h-5 w-5" />
														</button>
														<button
															type="button"
															aria-label="Weiter"
															disabled={!isOpen}
															onClick={() => scrollRow(service.name, 1)}
															className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line)] bg-transparent text-base text-[var(--ink)] transition duration-300 ease-out hover:translate-x-[3px] hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--bg)] disabled:pointer-events-none disabled:opacity-30"
														>
															<ChevronRight className="h-5 w-5" />
														</button>
													</div>
												</div>

												<div
													ref={(element) => {
														rowRefs.current[service.name] = element;
													}}
													className="row-scroll -mx-1 flex gap-4 overflow-x-auto overflow-y-hidden px-1 pb-4 pt-1"
												>
													{service.items.map((item, itemIndex) => {
														const itemVideo = item.video ?? heroShowreelVideo ?? null;
														const itemHasVideo = Boolean(getVideoSourceType(itemVideo));
														const itemDocument = serviceDocument?.items?.[itemIndex];

														return (
															<figure
																key={`${service.name}-${item.tag}-${item.title}`}
																className="vidcard relative m-0 aspect-square w-[clamp(258px,30vw,360px)] flex-none cursor-pointer overflow-hidden rounded-[9px] border border-[var(--line)] bg-[repeating-linear-gradient(135deg,var(--stripe-a)_0_14px,var(--stripe-b)_14px_28px)]"
																onClick={() => {
																	resetModalScroll();
																	openServiceModal(service, item, itemIndex);
																}}
															>
																{itemHasVideo ? (
																	<VideoMedia
																		asset={itemVideo}
																		title={itemVideo?.title || item.title}
																		className="absolute inset-0 h-full w-full object-cover"
																		poster={itemVideo?.posterUrl || undefined}
																		muted
																		loop
																		playsInline
																		autoPlay
																		preload="none"
																		background={getVideoSourceType(itemVideo) === "vimeo"}
																		pointerEventsNone
																		vimeoCover
																	/>
																) : null}
																<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,.88),rgba(20,20,20,.05)_52%)]" />
																<div className="card-overlay pointer-events-none absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] opacity-0 transition-opacity duration-500">
																	<span className="font-mono-ui rounded-full bg-[var(--gold)] px-4 py-[9px] text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--bg)]">{content.servicesSection.watchLabel}</span>
																</div>
																{!itemHasVideo ? (
																	<div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_74%,transparent)]">
																		<span className="font-mono-ui rounded-full border border-[var(--line)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Video folgt</span>
																	</div>
																) : null}
																<span className="font-mono-ui absolute left-[13px] top-[11px] rounded-full bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] px-[9px] py-[5px] text-[10px] font-medium uppercase tracking-[0.13em] text-[var(--ink)] backdrop-blur-md">{item.tag}</span>
																<div className="absolute inset-x-[14px] bottom-3 flex items-end justify-between gap-2.5">
																	<span className="font-display text-[26px] leading-[0.95] tracking-[0.02em]" data-tina-field={tinaField(itemDocument, "title")}>
																		{item.title}
																	</span>
																	<span className="play-dot flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--gold)] text-[var(--bg)]">
																		<Play className="h-[15px] w-[15px] fill-current" />
																	</span>
																</div>
															</figure>
														);
													})}
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			<section id="ablauf" className="px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)]">
				<div data-reveal className="reveal mx-auto max-w-[1240px]">
					<div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(processSectionDocument, "eyebrow")}>
						{content.processSection.eyebrow}
					</div>
					<h2 className="font-display mt-[18px] max-w-[16ch] text-[clamp(46px,7vw,104px)] leading-[0.94] tracking-[0.01em]" data-tina-field={tinaField(processSectionDocument, "title")}>
						{content.processSection.title}
					</h2>
					<div className="mt-[clamp(28px,4vw,40px)] hidden lg:block">
						<div className="h-px w-full bg-[color-mix(in_srgb,var(--gold)_20%,transparent)]">
							<div className="h-full bg-[var(--gold)] transition-[width] duration-500 ease-out" style={{ width: `${processProgress}%` }} />
						</div>
					</div>
					<div className="mt-[clamp(44px,6vw,68px)] grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[clamp(24px,3vw,44px)]">
						{content.processSection.steps.map((step, index) => (
							<div
								key={step.num}
								ref={(el) => {
									stepCardRefs.current[index] = el;
								}}
								data-reveal
								data-step-index={index}
								tabIndex={0}
								onMouseEnter={() => setActiveProcessStep(index)}
								onFocus={() => setActiveProcessStep(index)}
								className="reveal step-card relative rounded-[8px] p-[clamp(20px,2.4vw,28px)] outline-none focus-visible:text-[var(--ink)]"
								style={{ transitionDelay: `${index * 0.1}s` }}
							>
								<div className="font-display text-[clamp(44px,5vw,68px)] leading-none text-[var(--gold)]">{step.num}</div>
								<h3 className="font-display mb-[10px] mt-[14px] text-[clamp(26px,2.8vw,38px)] tracking-[0.01em]">{step.title}</h3>
								<p className="m-0 max-w-[30ch] text-[15px] leading-[1.6] text-[var(--muted)]">{step.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section id="ueber-mich" className="px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)]">
				<div className="mx-auto grid max-w-[1240px] gap-[clamp(36px,5vw,64px)] lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-center">
					<div data-reveal className="reveal lift-card group order-2 overflow-hidden rounded-[10px] border border-[var(--line)] lg:order-1" data-tina-field={tinaField(aboutSectionDocument, "photo")}>
						{aboutPhotoUrl ? (
							<img
								src={aboutPhotoUrl}
								alt={content.aboutSection.photo?.alt || content.aboutSection.title}
								className="aspect-[4/5] w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
							/>
						) : (
							<div className="aspect-[4/5] w-full bg-[repeating-linear-gradient(135deg,var(--stripe-a)_0_14px,var(--stripe-b)_14px_28px)] transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]" />
						)}
					</div>

					<div data-reveal className="reveal order-1 lg:order-2" style={{ transitionDelay: "0.08s" }}>
						<div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(aboutSectionDocument, "eyebrow")}>
							{content.aboutSection.eyebrow}
						</div>
						<h2 className="font-display mt-[18px] text-[clamp(40px,5.6vw,72px)] leading-[0.98] tracking-[0.01em]" data-tina-field={tinaField(aboutSectionDocument, "title")}>
							{content.aboutSection.title}
						</h2>
						<p className="m-0 mt-6 max-w-[560px] text-[clamp(15px,1.1vw,17px)] leading-[1.65] text-[var(--muted)]" data-tina-field={tinaField(aboutSectionDocument, "description")}>
							{content.aboutSection.description}
						</p>

						{content.aboutSection.facts.length > 0 ? (
							<div className="mt-[clamp(28px,3.4vw,40px)] flex flex-wrap gap-[clamp(20px,3vw,40px)]">
								{content.aboutSection.facts.map((fact) => (
									<div key={`${fact.label}-${fact.value}`}>
										<div className="font-display text-[clamp(24px,2.4vw,32px)] leading-none text-[var(--gold)]">{fact.value}</div>
										<div className="font-mono-ui mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--faint)]">{fact.label}</div>
									</div>
								))}
							</div>
						) : null}
					</div>
				</div>
			</section>

			<section className="px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)]">
				<div data-reveal className="reveal mx-auto max-w-[1240px]">
					<div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(testimonialsSectionDocument, "eyebrow")}>
						{content.testimonialsSection.eyebrow}
					</div>
					<h2 className="font-display mb-[clamp(40px,5vw,60px)] mt-[18px] text-[clamp(46px,7vw,104px)] leading-[0.94] tracking-[0.01em]" data-tina-field={tinaField(testimonialsSectionDocument, "title")}>
						{content.testimonialsSection.title}
					</h2>
					<div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[18px]">
						{content.testimonialsSection.items.map((testimonial, index) => (
							<figure
								key={`${testimonial.name}-${testimonial.quote}`}
								ref={(el) => {
									testimonialCardRefs.current[index] = el;
								}}
								data-reveal
								className="reveal lift-card relative m-0 rounded-[8px] border border-[var(--line)] p-[clamp(28px,3vw,40px)]"
								style={{ transitionDelay: `${index * 0.08}s` }}
							>
								<span className="font-mono-ui absolute right-4 top-[14px] rounded-full border border-[var(--line)] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--faint)]">{testimonial.badge || content.testimonialsSection.badge}</span>
								<div className="font-display h-[30px] text-[60px] leading-[0.5] text-[var(--gold)]">“</div>
								<blockquote className="m-0 text-[clamp(19px,1.7vw,24px)] leading-[1.45] tracking-[-0.01em]">{testimonial.quote}</blockquote>
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

			<section className="relative z-10 bg-[var(--bg)] px-[clamp(20px,5vw,64px)] py-[clamp(28px,3.4vw,44px)]">
				<div data-reveal className="reveal mx-auto max-w-[1240px]">
					<div className="font-mono-ui text-center text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(partnersSectionDocument, "eyebrow")}>
						{content.partnersSection.eyebrow}
					</div>
					<h2 className="font-display mt-[14px] text-center text-[clamp(26px,2.8vw,36px)] leading-none tracking-[0.01em]" data-tina-field={tinaField(partnersSectionDocument, "title")}>
						{content.partnersSection.title}
					</h2>
					<div className="mt-[clamp(32px,4vw,48px)] flex flex-wrap items-center justify-center gap-[clamp(32px,5vw,64px)]">
						{content.partnersSection.logos.map((partner, index) => {
							const partnerLogoUrl = getImageUrl(partner.logo);

							if (!partnerLogoUrl) {
								return null;
							}

							const logoImage = (
								<img
									src={partnerLogoUrl}
									alt={partner.logo?.alt || partner.name}
									className="h-8 w-auto max-w-[140px] object-contain grayscale opacity-50 transition duration-300 ease-out hover:opacity-100 hover:grayscale-0"
								/>
							);

							return partner.href ? (
								<a key={`${partner.name}-${index}`} href={partner.href} target="_blank" rel="noreferrer noopener" className="inline-flex">
									{logoImage}
								</a>
							) : (
								<span key={`${partner.name}-${index}`} className="inline-flex">
									{logoImage}
								</span>
							);
						})}
					</div>
				</div>
			</section>

			<section id="kontakt" ref={contactRef} className="relative px-[clamp(20px,5vw,64px)] py-[clamp(96px,13vw,180px)]">
				{content.contactSection.backgroundType === "video" && contactBackgroundVideoType ? (
					<div className="pointer-events-none absolute inset-x-[-8%] -top-[clamp(70px,10vw,120px)] bottom-[-8%] will-change-transform" style={{ transform: `translate3d(0, ${contactParallax}px, 0)` }}>
						<VideoMedia
							asset={content.contactSection.backgroundVideo}
							title={content.contactSection.backgroundVideo?.title || `${content.contactSection.titleLead} ${content.contactSection.titleAccent}`.trim() || "Kontakt Hintergrundvideo"}
							className="h-full w-full object-cover opacity-28"
							autoPlay
							muted
							loop
							playsInline
							preload="auto"
							background={contactBackgroundVideoType === "vimeo"}
							pointerEventsNone
						/>
					</div>
				) : null}
				{content.contactSection.backgroundType === "image" && contactBackgroundImageUrl ? (
					<div className="pointer-events-none absolute inset-x-[-8%] -top-[clamp(70px,10vw,120px)] bottom-[-8%] will-change-transform" style={{ transform: `translate3d(0, ${contactParallax}px, 0)` }}>
						<img src={contactBackgroundImageUrl} alt={content.contactSection.backgroundImage?.alt || "Kontakt Hintergrund"} className="h-full w-full object-cover opacity-28" />
					</div>
				) : null}
				<div className="absolute inset-x-0 -top-[clamp(70px,10vw,120px)] bottom-0 bg-[radial-gradient(120%_100%_at_50%_120%,transparent_36%,var(--bg)_100%)]" />
				<div data-reveal className="reveal relative mx-auto max-w-[980px] text-center">
					<div className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]" data-tina-field={tinaField(contactSectionDocument, "eyebrow")}>
						{content.contactSection.eyebrow}
					</div>
					<h2 data-reveal className="reveal font-display mt-5 text-[clamp(52px,9vw,134px)] leading-[0.92] tracking-[0.01em]" style={{ transitionDelay: "0.06s" }} data-tina-field={tinaField(contactSectionDocument, "titleLead")}>
						{content.contactSection.titleLead}
						<br />
						<span className="text-[var(--gold)]">{content.contactSection.titleAccent}</span> {content.contactSection.titleTrail}
					</h2>
					<p data-reveal className="reveal mx-auto mt-[26px] max-w-[520px] text-[clamp(15px,1.2vw,18px)] leading-[1.6] text-[var(--muted)]" style={{ transitionDelay: "0.12s" }} data-tina-field={tinaField(contactSectionDocument, "description")}>
						{content.contactSection.description}
					</p>
					<a
						href={`mailto:${content.contactSection.email}`}
						data-reveal
						className="reveal btn-cta mt-[34px] inline-block rounded-full bg-[var(--gold)] px-9 py-[17px] text-base font-semibold text-[var(--bg)] no-underline"
						style={{ transitionDelay: "0.18s" }}
						data-tina-field={tinaField(contactSectionDocument, "ctaLabel")}
					>
						{content.contactSection.ctaLabel}
					</a>
					<div data-reveal className="reveal font-mono-ui mt-[30px] text-xs font-medium tracking-[0.12em] text-[var(--muted)]" style={{ transitionDelay: "0.24s" }}>
						<button type="button" onClick={() => void copyEmail()} title="E-Mail kopieren" className="soft-link cursor-copy text-inherit underline-offset-4 hover:text-[var(--gold)] hover:underline">
							{emailCopied ? "E-Mail kopiert" : content.contactSection.email}
						</button>
						{content.contactSection.socialLinks.map((link, index) => (
							<span key={`${link.label}-${link.href}`}>
								&nbsp;&nbsp;·&nbsp;&nbsp;
								<a href={link.href} target="_blank" rel="noreferrer" className="soft-link text-inherit no-underline hover:text-[var(--gold)]" data-tina-field={tinaField(contactSectionDocument?.socialLinks?.[index], "label")}>
									{link.label}
								</a>
							</span>
						))}
					</div>
				</div>
			</section>

			<footer className="relative z-10 bg-[var(--bg)] px-[clamp(20px,5vw,64px)] pb-10 pt-[clamp(48px,6vw,72px)]">
				<div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10">
					<div data-reveal className="reveal max-w-[300px]">
						<div className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em]" data-tina-field={tinaField(tinaDocument, "logo")}>
							{renderLogo("h-10 w-auto max-w-[220px] object-contain")}
						</div>
						<p className="font-display mt-[14px] text-[30px] leading-none tracking-[0.02em] text-[var(--muted)]" data-tina-field={tinaField(footerDocument, "tagline")}>
							{content.footer.tagline}
						</p>
					</div>

					<div data-reveal className="reveal flex flex-wrap gap-[clamp(40px,6vw,90px)]" style={{ transitionDelay: "0.08s" }}>
						<div className="flex flex-col gap-3">
							<span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--faint)]">{content.footer.menuTitle}</span>
							{content.navLinks.map((link) => (
								<a key={`${link.label}-${link.href}-footer`} href={link.href} className="soft-link text-sm font-medium text-[var(--muted)] no-underline hover:text-[var(--gold)]">
									{link.label}
								</a>
							))}
						</div>

						<div className="flex flex-col gap-3">
							<span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--faint)]">{content.footer.legalTitle}</span>
							<a href={content.footer.imprintHref} className="soft-link text-sm font-medium text-[var(--muted)] no-underline hover:text-[var(--gold)]">
								{content.footer.imprintLabel}
							</a>
							<a href={content.footer.privacyHref} className="soft-link text-sm font-medium text-[var(--muted)] no-underline hover:text-[var(--gold)]">
								{content.footer.privacyLabel}
							</a>
						</div>
					</div>
				</div>

				<div data-reveal className="reveal font-mono-ui mx-auto mt-[clamp(40px,5vw,60px)] flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-[var(--line)] pt-6 text-[11px] font-medium tracking-[0.06em] text-[var(--faint)]" style={{ transitionDelay: "0.14s" }}>
					<span>{content.footer.copyright}</span>
					<span>{content.footer.credits}</span>
				</div>
			</footer>

			{modal ? (
				<div className="menu-fade fixed inset-0 z-[200] overflow-y-auto bg-[color-mix(in_srgb,#0c0c0c_72%,transparent)] px-[clamp(16px,4vw,52px)] py-5 backdrop-blur-[10px]" onClick={() => setModal(null)}>
					<div className="flex min-h-full items-start justify-center">
						<div
							className="modal-in flex min-h-[min(640px,calc(100svh-40px))] max-h-[calc(100svh-40px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_94%,black)] shadow-[0_30px_80px_-34px_rgba(0,0,0,0.8)]"
							onClick={(event) => event.stopPropagation()}
						>
							<div className="relative border-b border-[var(--line)] px-[clamp(18px,3vw,28px)] pb-5 pt-[clamp(18px,3vw,24px)]">
										<button
											type="button"
											onClick={() => setModal(null)}
											aria-label="Schliessen"
											className="absolute right-[clamp(18px,3vw,28px)] top-[clamp(18px,3vw,24px)] flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--bg)]"
										>
											<X className="h-[18px] w-[18px]" />
										</button>
									<div className="flex flex-wrap items-end justify-between gap-4 pr-[112px] md:pr-[168px]">
									<div>
										{modalService ? (
											<div className="flex flex-wrap items-center gap-2.5">
												<div className="relative">
													<select
														value={modalService.name}
														onChange={(event) => switchModalService(event.target.value)}
														className="font-mono-ui w-fit appearance-none rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_82%,black)] pl-4 pr-10 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--gold)] outline-none transition hover:border-[var(--gold)] focus:border-[var(--gold)]"
													>
														{content.servicesSection.services.map((service) => (
															<option key={service.name} value={service.name}>
																{service.name}
															</option>
														))}
													</select>
													<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold)]">
														<ChevronDown className="h-4 w-4" />
													</span>
												</div>
												{modalItemTag ? <span className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">{modalItemTag}</span> : null}
											</div>
										) : (
											<div className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--gold)]">{modal.tag}</div>
										)}
										<h3 className="font-display mt-1.5 text-[clamp(34px,5vw,64px)] tracking-[0.02em] text-[var(--ink)]">{modal.title}</h3>
									</div>
									<div className="absolute right-[clamp(18px,3vw,28px)] top-[calc(clamp(18px,3vw,24px)+52px)] flex items-center gap-2.5">
										{modalHasItemNavigation ? (
											<>
												<button
													type="button"
													onClick={() => stepModalItem(-1)}
													disabled={(modal?.itemIndex ?? 0) <= 0}
													aria-label="Zurueck"
													className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[var(--line)] text-[18px] leading-none text-[var(--ink)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-35"
												>
													<ChevronLeft className="h-[18px] w-[18px]" />
												</button>
												<span className="font-mono-ui px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
													{modalItemPosition} / {modalItemCount}
												</span>
												<button
													type="button"
													onClick={() => stepModalItem(1)}
													disabled={(modal?.itemIndex ?? 0) >= modalItemCount - 1}
													aria-label="Weiter"
													className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[var(--line)] text-[18px] leading-none text-[var(--ink)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-35"
												>
													<ChevronRight className="h-[18px] w-[18px]" />
												</button>
											</>
										) : null}
									</div>
								</div>
							</div>
							<div ref={modalScrollRef} className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
								<div className="px-[clamp(18px,3vw,28px)] pb-[clamp(18px,3vw,28px)] pt-5">
									<div>
										{getVideoSourceType(modal.video) ? (
											<div
												className="mx-auto w-full overflow-hidden rounded-xl border border-[var(--line)] bg-black"
												style={{
													aspectRatio: getVideoAspectRatio(modal.video) || "16 / 9",
													width: `min(100%, calc(${modalVideoMaxHeight} * ${modalVideoRatio}))`,
													maxHeight: modalVideoMaxHeight,
												}}
											>
												<VideoMedia asset={modal.video} title={modal.title} className="block h-full w-full object-cover" poster={modal.video?.posterUrl || undefined} autoPlay playsInline controls loop />
											</div>
										) : (
											<div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,black)]">
												<span className="font-mono-ui text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Kein Video hinterlegt</span>
											</div>
										)}
									</div>
									<div className="mx-auto mt-[clamp(22px,3vw,30px)] w-full max-w-[920px]">
										<p className="m-0 text-[clamp(15px,1.18vw,17px)] leading-[1.75] text-[var(--muted)]">{modal.desc}</p>
										{modal.links.length ? (
											<div className="mt-5 flex flex-wrap gap-2.5">
												{modal.links.map((link) => (
													<a
														key={`${link.label}-${link.href}`}
														href={link.href}
														target="_blank"
														rel="noreferrer"
														className="font-mono-ui rounded-full border border-[var(--line)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)] no-underline transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
													>
														{link.label || link.href}
													</a>
												))}
											</div>
										) : null}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}

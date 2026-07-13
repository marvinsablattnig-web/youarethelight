"use client";

import { useState } from "react";

import { getImageUrl } from "@/lib/cms/media";
import type { HomeContent } from "@/lib/home-content";
import { MobileMenuToggle } from "./mobile-menu-toggle";

type SiteHeaderProps = {
	content: HomeContent;
	homeHref?: string;
};

export function SiteHeader({ content, homeHref = "" }: SiteHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const logoUrl = getImageUrl(content.logo);

	const renderLogo = (className: string, fallbackSrc = "/logo.svg") => <img src={logoUrl || fallbackSrc} alt={content.logo?.alt || content.siteName} className={className} />;

	return (
		<>
			<nav className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between gap-6 bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-[clamp(20px,5vw,64px)] py-4 backdrop-blur-[14px]">
				<a href={homeHref || "#top"} className="font-mono-ui text-[13px]  font-medium uppercase tracking-[0.2em] text-[var(--ink)] no-underline">
					{renderLogo("h-8 w-auto max-w-[180px] scale-150 object-contain", "/logo-wide.svg")}
				</a>

				<div className="hidden items-center gap-[clamp(16px,2.4vw,36px)] lg:flex">
					{content.navLinks.map((link) => (
						<a key={`${link.label}-${link.href}`} href={`${homeHref}${link.href}`} className="navlink relative text-[13px] font-medium text-[var(--muted)] no-underline transition-colors hover:text-[var(--ink)]">
							{link.label}
						</a>
					))}
					<a href={`mailto:${content.contactSection.email}`} className="btn-cta rounded-full bg-[var(--gold)] px-[18px] py-[10px] text-[13px] font-semibold text-[var(--bg)] no-underline">
						{content.navCtaLabel}
					</a>
				</div>

				<button type="button" aria-label="Menü öffnen" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center bg-transparent p-0 text-[var(--ink)] opacity-90 transition hover:opacity-100 lg:hidden">
					<MobileMenuToggle open={false} className="h-8 w-8" />
				</button>
			</nav>

			{menuOpen ? (
				<div className="menu-fade fixed inset-0 z-[110] flex flex-col bg-[var(--bg)] px-[clamp(20px,7vw,40px)] pb-10 pt-[18px] lg:hidden">
					<div className="flex items-center justify-between">
						<span className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ink)]">{renderLogo("h-8 w-auto max-w-[180px] scale-150 object-contain", "/logo-wide.svg")}</span>
						<button type="button" aria-label="Menü schließen" onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center bg-transparent p-0 text-[var(--ink)] opacity-90 transition hover:opacity-100">
							<MobileMenuToggle open className="h-8 w-8" />
						</button>
					</div>

					<div className="my-auto flex flex-col gap-1.5">
						{content.navLinks.map((link, index) => (
							<a
								key={`${link.label}-${link.href}-mobile`}
								href={`${homeHref}${link.href}`}
								onClick={() => setMenuOpen(false)}
								className={`font-display text-[clamp(48px,16vw,82px)] leading-[0.98] tracking-[0.02em] no-underline ${link.href === "#kontakt" ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}
								style={{
									animation: `fade-in 0.5s cubic-bezier(.2,.7,.2,1) ${0.05 + index * 0.07}s both`,
								}}
							>
								{link.label}
							</a>
						))}
					</div>

					<a href={`mailto:${content.contactSection.email}`} onClick={() => setMenuOpen(false)} className="rounded-full bg-[var(--gold)] px-7 py-[17px] text-center text-base font-semibold text-[var(--bg)] no-underline">
						{content.navCtaLabel}
					</a>
				</div>
			) : null}
		</>
	);
}

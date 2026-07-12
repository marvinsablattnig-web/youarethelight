"use client";

import { getImageUrl } from "@/lib/cms/media";
import { useCookieConsent } from "@/lib/cookie-consent";
import type { HomeContent } from "@/lib/home-content";

type SiteFooterProps = {
	content: HomeContent;
};

export function SiteFooter({ content }: SiteFooterProps) {
	const { openSettings } = useCookieConsent();
	const logoUrl = getImageUrl(content.logo);

	return (
		<footer className="relative z-10 bg-[var(--bg)] px-[clamp(20px,5vw,64px)] pb-10 pt-[clamp(48px,6vw,72px)]">
			<div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10">
				<div className="flex max-w-[360px] items-center">
					<img src={logoUrl || "/logo.svg"} alt={content.logo?.alt || content.siteName} className="h-full max-h-[220px] w-auto object-contain" />
				</div>

				<div className="flex flex-wrap gap-[clamp(40px,6vw,90px)]">
					<div className="flex flex-col gap-3">
						<span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--faint)]">{content.footer.menuTitle}</span>
						{content.navLinks.map((link) => (
							<a key={`${link.label}-${link.href}-footer`} href={`/${link.href}`} className="soft-link text-sm font-medium text-[var(--muted)] no-underline hover:text-[var(--gold)]">
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

			<div className="font-mono-ui mx-auto mt-[clamp(40px,5vw,60px)] flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-[var(--line)] pt-6 text-[11px] font-medium tracking-[0.06em] text-[var(--faint)]">
				<span>{content.footer.copyright}</span>
				<div className="flex flex-wrap items-center gap-4">
					<button type="button" onClick={openSettings} className="underline underline-offset-4 hover:text-[var(--gold)]">
						Cookie-Einstellungen
					</button>
					<span>{content.footer.credits}</span>
				</div>
			</div>
		</footer>
	);
}

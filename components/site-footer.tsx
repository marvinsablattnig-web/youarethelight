import { getImageUrl } from "@/lib/cms/media";
import type { HomeContent } from "@/lib/home-content";

type SiteFooterProps = {
	content: HomeContent;
};

export function SiteFooter({ content }: SiteFooterProps) {
	const logoUrl = getImageUrl(content.logo);

	return (
		<footer className="border-t border-[var(--line)] px-[clamp(20px,5vw,64px)] pb-10 pt-[clamp(48px,6vw,72px)]">
			<div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10">
				<div className="max-w-[300px]">
					<div className="font-mono-ui text-[13px] font-medium uppercase tracking-[0.2em]">
						{logoUrl ? (
							<img src={logoUrl} alt={content.logo?.alt || content.siteName} className="h-10 w-auto max-w-[220px] object-contain" />
						) : (
							content.siteName
						)}
					</div>
					<p className="font-display mt-[14px] text-[30px] leading-none tracking-[0.02em] text-[var(--muted)]">
						{content.footer.tagline}
					</p>
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
				<span>{content.footer.credits}</span>
			</div>
		</footer>
	);
}

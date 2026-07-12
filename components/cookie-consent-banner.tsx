"use client";

import Link from "next/link";

import { useCookieConsent } from "@/lib/cookie-consent";

export function CookieConsentBanner() {
	const { consent, isSettingsOpen, vimeoAllowed, acceptAll, rejectOptional, setVimeo, openSettings, closeSettings } = useCookieConsent();

	if (consent && !isSettingsOpen) {
		return null;
	}

	return (
		<div className="fixed inset-x-0 bottom-0 z-[150] px-[clamp(16px,4vw,28px)] pb-[clamp(16px,3vw,24px)]">
			<div className="mx-auto max-w-[760px] rounded-[16px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,black)] p-[clamp(20px,3vw,28px)] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)] backdrop-blur-[16px]">
				<p className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]">Cookies &amp; Datenschutz</p>
				<p className="m-0 mt-3 text-[14px] leading-[1.6] text-[var(--muted)]">
					Wir verwenden technisch notwendige Cookies, damit die Website funktioniert. Videos können über Vimeo eingebunden
					sein – dabei setzt Vimeo eigene Cookies und lädt Inhalte von externen Servern. Diese externen Inhalte laden wir
					nur, wenn du zustimmst. Mehr dazu in unserer{" "}
					<Link href="/datenschutz" className="soft-link text-[var(--ink)] underline underline-offset-4 hover:text-[var(--gold)]">
						Datenschutzerklärung
					</Link>
					.
				</p>

				{isSettingsOpen ? (
					<div className="mt-4 rounded-[12px] border border-[var(--line)] p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="m-0 text-[13px] font-medium text-[var(--ink)]">Notwendig</p>
								<p className="m-0 text-[12px] text-[var(--faint)]">Immer aktiv – für den Betrieb der Website erforderlich.</p>
							</div>
							<span className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--faint)]">An</span>
						</div>

						<div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
							<div>
								<p className="m-0 text-[13px] font-medium text-[var(--ink)]">Externe Medien (Vimeo)</p>
								<p className="m-0 text-[12px] text-[var(--faint)]">Erlaubt das Laden von eingebetteten Vimeo-Videos.</p>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={vimeoAllowed}
								onClick={() => setVimeo(!vimeoAllowed)}
								className={`relative h-6 w-11 flex-none rounded-full p-0 transition-colors duration-300 ${vimeoAllowed ? "bg-[var(--gold)]" : "bg-[color-mix(in_srgb,var(--ink)_18%,transparent)]"}`}
							>
								<span
									className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--bg)] transition-transform duration-300 ${vimeoAllowed ? "translate-x-5" : "translate-x-0"}`}
								/>
							</button>
						</div>
					</div>
				) : null}

				<div className="mt-5 flex flex-wrap items-center gap-3">
					{isSettingsOpen ? (
						<button
							type="button"
							onClick={closeSettings}
							className="btn-cta rounded-full bg-[var(--gold)] px-6 py-[11px] text-[13px] font-semibold text-[var(--bg)] no-underline"
						>
							Fertig
						</button>
					) : (
						<>
							<button
								type="button"
								onClick={acceptAll}
								className="btn-cta rounded-full bg-[var(--gold)] px-6 py-[11px] text-[13px] font-semibold text-[var(--bg)] no-underline"
							>
								Alle akzeptieren
							</button>
							<button
								type="button"
								onClick={rejectOptional}
								className="rounded-full border border-[var(--line)] px-6 py-[11px] text-[13px] font-semibold text-[var(--ink)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
							>
								Nur notwendige
							</button>
							<button
								type="button"
								onClick={openSettings}
								className="soft-link px-2 text-[13px] font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--gold)]"
							>
								Einstellungen
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

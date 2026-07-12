import { homeContent } from "@/lib/home-content";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader content={homeContent} homeHref="/" />

      <main className="px-[clamp(20px,5vw,64px)] pb-[clamp(28px,5vw,48px)]">
        <div className="mx-auto max-w-[1040px]">
          <div className="pt-[clamp(112px,14vw,148px)]">
            <p className="font-mono-ui text-xs font-medium uppercase tracking-[0.24em] text-[var(--gold)]">
              {eyebrow}
            </p>
            <h1 className="font-display mt-4 text-[clamp(52px,9vw,110px)] leading-[0.92] tracking-[0.01em]">
              {title}
            </h1>
            <p className="mt-6 max-w-[760px] text-[clamp(15px,1.2vw,18px)] leading-[1.7] text-[var(--muted)]">
              {intro}
            </p>
          </div>

          <div className="mt-[clamp(40px,6vw,72px)] grid gap-6">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-[clamp(22px,3vw,34px)]"
              >
                <h2 className="font-display text-[clamp(28px,3.5vw,42px)] leading-none tracking-[0.02em]">
                  {section.title}
                </h2>
                <div className="mt-4 grid gap-3 text-[15px] leading-[1.75] text-[var(--muted)]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="m-0 whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter content={homeContent} />
    </div>
  );
}

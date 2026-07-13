import { getImageUrl } from "@/lib/cms/media";
import type { HomeContent } from "@/lib/home-content";

type ComingSoonProps = {
  content: HomeContent;
};

export function ComingSoon({ content }: ComingSoonProps) {
  const logoUrl = getImageUrl(content.logo);
  const email = content.contactSection.email;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 py-16 text-center text-[var(--ink)]">
      <img
        src={logoUrl || "/logo-wide.svg"}
        alt={content.logo?.alt || content.siteName}
        className="h-[clamp(48px,8vw,88px)] w-auto max-w-[320px] object-contain"
      />
      <h1 className="font-display mt-10 text-[clamp(48px,10vw,120px)] leading-[0.95] tracking-tight">
        Coming <span className="text-[var(--gold)]">soon</span>
      </h1>
      <p className="mt-6 max-w-[480px] text-[15px] leading-relaxed text-[var(--muted)]">
        Wir arbeiten gerade an unserem neuen Auftritt. Bald ist es soweit.
      </p>
      {email ? (
        <a
          href={`mailto:${email}`}
          className="btn-cta mt-10 rounded-full bg-[var(--gold)] px-8 py-4 text-[14px] font-semibold text-[var(--bg)] no-underline"
        >
          {email}
        </a>
      ) : null}
    </main>
  );
}

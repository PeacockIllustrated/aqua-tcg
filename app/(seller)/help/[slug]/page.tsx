import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HELP_PAGES } from "@/lib/help-content";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return Object.keys(HELP_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return { title: HELP_PAGES[slug]?.title ?? "Help" };
}

export default async function HelpPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = HELP_PAGES[slug];
  if (!page) notFound();

  return (
    <div className="max-w-[760px] mx-auto px-5 py-10 md:py-14 flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link href="/" className="font-display text-[11px] tracking-wider text-muted hover:text-ink w-fit">
          ← Home
        </Link>
        <h1 className="font-display text-[34px] md:text-[48px] leading-[0.95] tracking-tight">
          {page.title}
        </h1>
        <p className="text-[15px] text-secondary max-w-[60ch]">{page.intro}</p>
      </header>
      <div className="flex flex-col gap-4">
        {page.sections.map((s) => (
          <section key={s.heading} className="pop-card rounded-md p-5 flex flex-col gap-2">
            <h2 className="font-display text-[16px] tracking-tight">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="text-[14px] text-secondary leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <nav className="flex flex-wrap gap-2 font-display text-[11px] tracking-wider">
        {Object.entries(HELP_PAGES)
          .filter(([s]) => s !== slug)
          .map(([s, p]) => (
            <Link key={s} href={`/help/${s}`} className="px-3 py-1.5 border-2 border-ink rounded-sm bg-paper-strong hover:bg-tint">
              {p.title}
            </Link>
          ))}
      </nav>
    </div>
  );
}

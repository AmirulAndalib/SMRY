"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { competitorSlugs, competitors, type CompetitorData } from "@/lib/comparisons/competitors";
import { Check, X } from "@/components/ui/icons";

function FeatureCell({ value, label }: { value: string | boolean; label: string }) {
  if (value === true)
    return (
      <span className="flex items-center justify-center">
        <Check className="size-5 text-emerald-500" />
        <span className="sr-only">{label}: Yes</span>
      </span>
    );
  if (value === false)
    return (
      <span className="flex items-center justify-center">
        <X className="size-5 text-muted-foreground/40" />
        <span className="sr-only">{label}: No</span>
      </span>
    );
  return <span className="text-sm text-foreground">{value}</span>;
}

export function ComparisonContent({ data }: { data: CompetitorData }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to SMRY
          </Link>
          <Link href="/">
            <Image
              src="/logo.svg"
              width={64}
              height={20}
              alt="SMRY — AI article reader and paywall bypass"
              className="dark:invert"
            />
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-16">
        {/* Breadcrumb for SEO crawlability */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                SMRY
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span className="text-foreground font-medium">
                {data.headline}
              </span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {data.headline}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            {data.subheadline}
          </p>
        </header>

        {/* Intro — keyword in first 100 words */}
        <section className="mb-16" aria-label="Overview">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {data.intro}
          </p>
        </section>

        {/* Feature Comparison Table */}
        <section className="mb-16" aria-labelledby="feature-comparison">
          <h2
            id="feature-comparison"
            className="text-xl font-semibold tracking-tight text-foreground mb-6"
          >
            {data.name} vs SMRY: Feature Comparison
          </h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full border-collapse" role="table">
              <caption className="sr-only">
                Feature comparison between SMRY and {data.name}
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left py-3 pr-4 text-sm font-medium text-foreground w-1/2">
                    Feature
                  </th>
                  <th scope="col" className="text-center py-3 px-4 text-sm font-medium text-foreground w-1/4">
                    SMRY
                  </th>
                  <th scope="col" className="text-center py-3 pl-4 text-sm font-medium text-foreground w-1/4">
                    {data.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-muted/30" : ""}
                  >
                    <td className="py-3 pr-4 text-sm text-foreground">
                      {row.feature}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <FeatureCell value={row.smry} label={`SMRY ${row.feature}`} />
                    </td>
                    <td className="py-3 pl-4 text-center">
                      <FeatureCell value={row.competitor} label={`${data.name} ${row.feature}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Key Differences */}
        <section className="mb-16" aria-labelledby="key-differences">
          <h2
            id="key-differences"
            className="text-xl font-semibold tracking-tight text-foreground mb-8"
          >
            Key Differences Between SMRY and {data.name}
          </h2>
          <div className="space-y-10">
            {data.differences.map((diff, i) => (
              <div key={i} className="flex gap-4">
                <span
                  className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">
                    {diff.heading}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {diff.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-16" aria-labelledby="verdict">
          <h2
            id="verdict"
            className="text-xl font-semibold tracking-tight text-foreground mb-6"
          >
            The Verdict: Which Should You Use?
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {data.verdict}
          </p>
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-xl border border-border bg-muted/30 p-8 text-center" aria-label="Try SMRY">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Try SMRY free
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Paste any article URL and see the difference. No account needed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Read an article now →
          </Link>
        </section>

        {/* FAQ — proper heading hierarchy for SEO */}
        <section className="mb-16" aria-labelledby="faq">
          <h2
            id="faq"
            className="text-xl font-semibold tracking-tight text-foreground mb-8"
          >
            Frequently Asked Questions
          </h2>
          <dl className="space-y-8">
            {data.faqs.map((faq, i) => (
              <div key={i}>
                <dt className="text-[15px] font-semibold text-foreground mb-2">
                  {faq.question}
                </dt>
                <dd className="text-[15px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Internal links to other comparisons — improves crawlability */}
        {competitorSlugs.filter((s) => s !== data.slug).length > 0 && (
          <section className="mb-12" aria-labelledby="more-comparisons">
            <h2
              id="more-comparisons"
              className="text-sm font-medium text-muted-foreground mb-4"
            >
              More Comparisons
            </h2>
            <div className="flex flex-wrap gap-3">
              {competitorSlugs
                .filter((s) => s !== data.slug)
                .map((slug) => (
                  <Link
                    key={slug}
                    href={`/compare/${slug}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    SMRY vs {competitors[slug].name}
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Footer nav — internal linking */}
        <footer className="border-t border-border pt-8 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Back to SMRY
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/guide"
              className="hover:text-foreground transition-colors"
            >
              Paywall Guide
            </Link>
            <Link
              href="/pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing →
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}

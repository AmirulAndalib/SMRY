import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { competitors, competitorSlugs } from "@/lib/comparisons/competitors";
import { ComparisonContent } from "@/components/pages/comparison-content";
import { JsonLd, faqSchema } from "@/components/seo/json-ld";
import { generateAlternates } from "@/lib/seo/alternates";

export const dynamic = "force-static";

export function generateStaticParams() {
  const params: { locale: string; competitor: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of competitorSlugs) {
      params.push({ locale, competitor: slug });
    }
  }
  return params;
}

type Props = {
  params: Promise<{ locale: string; competitor: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor: slug } = await params;
  const data = competitors[slug];

  if (!data) {
    return { title: "Comparison | SMRY" };
  }

  return {
    title: data.title,
    description: data.description,
    alternates: generateAlternates(`/compare/${slug}`),
    openGraph: {
      title: data.title,
      description: data.description,
      url: `https://smry.ai/compare/${slug}`,
      type: "website",
      siteName: "smry.ai",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { locale, competitor: slug } = await params;
  setRequestLocale(locale);

  const data = competitors[slug];
  if (!data) {
    notFound();
  }

  return (
    <>
      <JsonLd data={faqSchema(data.faqs)} />
      <ComparisonContent data={data} />
    </>
  );
}

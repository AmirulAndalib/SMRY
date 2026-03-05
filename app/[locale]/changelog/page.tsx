import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ChangelogContent } from '@/components/pages/changelog-content';
import { generateAlternates } from '@/lib/seo/alternates';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Changelog — Latest Updates, Features & Improvements | SMRY",
  description:
    'See what we shipped this week. New features, bug fixes, and improvements to SMRY — the AI-powered article reader and paywall bypass tool. We ship updates regularly.',
  alternates: generateAlternates('/changelog'),
  openGraph: {
    title: "Changelog — Latest Updates, Features & Improvements | SMRY",
    description:
      'See what we shipped this week. New features, bug fixes, and improvements to SMRY — the AI-powered article reader and paywall bypass tool. We ship updates regularly.',
    url: 'https://smry.ai/changelog',
  },
  twitter: {
    title: "Changelog — Latest Updates, Features & Improvements | SMRY",
    description:
      'See what we shipped this week. New features, bug fixes, and improvements to SMRY — the AI-powered article reader and paywall bypass tool. We ship updates regularly.',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ChangelogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChangelogContent />;
}

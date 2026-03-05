import { setRequestLocale } from 'next-intl/server';
import { HistoryPageContent } from '@/components/pages/history-content';
import type { Metadata } from 'next';
import { generateNoIndexAlternates } from '@/lib/seo/alternates';

// Force static generation - auth is handled client-side
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Your Reading History — Previously Read Articles | SMRY',
  description:
    'Browse your reading history and revisit previously summarized articles on SMRY. Your history is stored locally in your browser for privacy.',
  alternates: generateNoIndexAlternates('/history'),
  robots: {
    index: false,
    follow: true,
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HistoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HistoryPageContent />;
}

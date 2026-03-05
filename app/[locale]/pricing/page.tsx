import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PricingContent } from '@/components/pages/pricing-content';
import { generateAlternates } from '@/lib/seo/alternates';

// Force static generation - auth is handled client-side by PricingContent
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Pricing — Free & Pro Plans for Paywall Bypass & AI Summaries | SMRY',
  description:
    'Start reading paywalled articles for free with SMRY. Upgrade to Pro for unlimited AI summaries, chat with articles, and priority access. No commitment, cancel anytime.',
  alternates: generateAlternates('/pricing'),
  openGraph: {
    title: 'Pricing — Free & Pro Plans for Paywall Bypass & AI Summaries | SMRY',
    description:
      'Start reading paywalled articles for free with SMRY. Upgrade to Pro for unlimited AI summaries, chat with articles, and priority access. No commitment, cancel anytime.',
    url: 'https://smry.ai/pricing',
  },
  twitter: {
    title: 'Pricing — Free & Pro Plans for Paywall Bypass & AI Summaries | SMRY',
    description:
      'Start reading paywalled articles for free with SMRY. Upgrade to Pro for unlimited AI summaries, chat with articles, and priority access. No commitment, cancel anytime.',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PricingContent />;
}

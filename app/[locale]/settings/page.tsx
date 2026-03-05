import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SettingsContent } from '@/components/pages/settings-content';
import { generateAlternates } from '@/lib/seo/alternates';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Reader Settings — Fonts, Themes & Preferences | SMRY',
  description:
    'Customize your SMRY reading experience. Choose from 10 themes, 5 fonts, adjust text size and spacing, and set your preferred language. Changes apply instantly.',
  alternates: generateAlternates('/settings'),
  robots: { index: false, follow: true },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsContent />;
}

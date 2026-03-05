import type { Metadata } from "next";
import { ChatPageContent } from "@/components/features/chat-page-content";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "AI Chat — Ask Questions About Any Article | SMRY",
  description:
    "Chat with AI to ask questions about any article. Get instant answers, explanations, and deeper insights. Conversations stored locally for privacy. Free to try.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "AI Chat — Ask Questions About Any Article | SMRY",
    description:
      "Chat with AI to ask questions about any article. Get instant answers, explanations, and deeper insights. Free to try.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat — Ask Questions About Any Article | SMRY",
    description:
      "Chat with AI to ask questions about any article. Get instant answers, explanations, and deeper insights. Free to try.",
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChatPageContent />;
}

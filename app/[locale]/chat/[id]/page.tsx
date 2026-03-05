import type { Metadata } from "next";
import { ChatPageContent } from "@/components/features/chat-page-content";
import { setRequestLocale } from "next-intl/server";

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
  params: Promise<{ locale: string; id: string }>;
};

export default async function ChatThreadPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ChatPageContent threadId={id} />;
}

/**
 * Competitor data for "SMRY vs X" comparison pages.
 * Add new competitors here — the page template handles the rest.
 */

export interface FeatureComparison {
  feature: string;
  smry: string | boolean;
  competitor: string | boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface CompetitorData {
  /** URL slug: "12ft" → /vs/12ft */
  slug: string;
  /** Display name */
  name: string;
  /** Their domain */
  domain: string;
  /** SEO: page title (50-60 chars ideal) */
  title: string;
  /** SEO: meta description (120-160 chars ideal) */
  description: string;
  /** Hero headline */
  headline: string;
  /** Hero subheadline — one sentence */
  subheadline: string;
  /** Short intro paragraph */
  intro: string;
  /** Key differences — 3-4 honest points */
  differences: {
    heading: string;
    body: string;
  }[];
  /** Side-by-side feature table */
  features: FeatureComparison[];
  /** Verdict paragraph — honest, not salesy */
  verdict: string;
  /** FAQ for JSON-LD rich snippets */
  faqs: FAQ[];
}

export const competitors: Record<string, CompetitorData> = {
  "12ft": {
    slug: "12ft",
    name: "12ft.io",
    domain: "12ft.io",
    title: "SMRY vs 12ft.io — Which Paywall Bypass Tool Is Better in 2026?",
    description:
      "Honest comparison of SMRY and 12ft.io for bypassing paywalls. See which tool reads more sites, summarizes articles with AI, and actually works in 2026.",
    headline: "SMRY vs 12ft.io",
    subheadline:
      "Both tools help you read paywalled articles. Here's how they actually compare.",
    intro:
      "12ft.io was one of the first popular paywall bypass tools, built on the idea that if a page is free for Google's crawler, it should be free for you. It worked well for years — until publishers caught on and started blocking it. SMRY takes a different approach: instead of relying on a single method, it runs three extraction sources in parallel and uses a classifier to pick the best result. It also adds AI-powered summaries and chat.",
    differences: [
      {
        heading: "12ft.io relies on one method. SMRY uses three.",
        body: "12ft.io proxies pages through Google's cache. When a publisher blocks that route, you get nothing. SMRY runs three independent extraction sources in parallel — its own parser, web archives, and cached versions — then an XGBoost classifier picks the highest-quality result. If one source fails, the others still work.",
      },
      {
        heading: "SMRY adds AI on top of the article.",
        body: "12ft.io shows you the article and stops there. SMRY gives you an AI-powered summary, lets you chat with the article to ask questions, and can read it aloud with text-to-speech. It's a reader, not just an unblocker.",
      },
      {
        heading: "12ft.io is simpler. That's both its strength and weakness.",
        body: "If all you want is to remove a paywall overlay, 12ft.io's simplicity is appealing — paste a URL, get the page. But that simplicity means no fallbacks when it fails, no reading mode, no highlights, no export. SMRY is a full reading environment.",
      },
      {
        heading: "Site coverage has shifted.",
        body: "12ft.io's coverage has declined as major publishers (NYT, WSJ, Bloomberg) have hardened their paywalls against proxy-based tools. SMRY's multi-source approach maintains broader coverage, though hard paywalls (sites requiring login) remain inaccessible to both tools.",
      },
    ],
    features: [
      { feature: "Free tier", smry: true, competitor: true },
      { feature: "AI-powered summary", smry: true, competitor: false },
      { feature: "Chat with article", smry: true, competitor: false },
      { feature: "Text-to-speech", smry: true, competitor: false },
      { feature: "Multiple extraction sources", smry: "3 sources + classifier", competitor: "Google cache only" },
      { feature: "Reader mode", smry: true, competitor: false },
      { feature: "Highlights & notes", smry: true, competitor: false },
      { feature: "Export (Markdown, Notion)", smry: true, competitor: false },
      { feature: "Works on mobile", smry: true, competitor: true },
      { feature: "No browser extension needed", smry: true, competitor: true },
      { feature: "Account required", smry: "Optional (for Pro)", competitor: false },
      { feature: "Clean URL format", smry: "smry.ai/article-url", competitor: "12ft.io/article-url" },
    ],
    verdict:
      "If you just want a quick, minimal paywall bypass and the site you're reading happens to work with 12ft.io, it does the job. But if you want broader site coverage, AI summaries, the ability to chat with articles, or a proper reading experience with highlights and export — SMRY does more. Both are free to try, so the best way to decide is to paste the same article into both and see which one delivers.",
    faqs: [
      {
        question: "Is 12ft.io still working in 2026?",
        answer:
          "12ft.io still works for some sites, but its coverage has declined significantly as publishers have blocked Google cache proxying. Many major news sites (NYT, WSJ, Washington Post) no longer work with 12ft.io.",
      },
      {
        question: "Is SMRY free like 12ft.io?",
        answer:
          "Yes, SMRY has a free tier that lets you read and summarize articles. The Pro plan adds unlimited AI chat, more summaries, and priority access, but the core reading and bypass functionality is free.",
      },
      {
        question: "Which tool bypasses more paywalls?",
        answer:
          "SMRY generally has broader coverage because it uses three independent extraction sources instead of one. However, neither tool can bypass hard paywalls that require a paid login (like the WSJ or Financial Times).",
      },
      {
        question: "Can I use both SMRY and 12ft.io?",
        answer:
          "Absolutely. Some people use 12ft.io for quick lookups and SMRY when they want AI summaries or when 12ft.io fails on a particular site. There's no conflict between using both.",
      },
    ],
  },

  removepaywall: {
    slug: "removepaywall",
    name: "RemovePaywall",
    domain: "removepaywall.com",
    title: "SMRY vs RemovePaywall — Paywall Bypass Comparison for 2026",
    description:
      "Compare SMRY and RemovePaywall side-by-side. Feature comparison, site coverage, AI capabilities, and which tool actually works for bypassing paywalls in 2026.",
    headline: "SMRY vs RemovePaywall",
    subheadline:
      "Two different approaches to reading paywalled content. Here's what each one actually does.",
    intro:
      "RemovePaywall.com is a straightforward paywall bypass tool — paste a URL, and it tries to fetch the article through web archives and cached versions. It's been a reliable option for years. SMRY started with the same goal but evolved into a full AI reading environment: it bypasses paywalls, summarizes articles, lets you chat with the content, and provides a clean reader mode with highlights and export.",
    differences: [
      {
        heading: "RemovePaywall is a bypass tool. SMRY is a reading tool.",
        body: "RemovePaywall focuses on one job: getting past the paywall and showing you the article. SMRY does that too, but then adds AI summaries, a chat interface for asking questions about the article, text-to-speech, highlights, and export to tools like Notion and Obsidian.",
      },
      {
        heading: "Extraction approach differs.",
        body: "RemovePaywall primarily uses web archive lookups (Google cache, Wayback Machine). SMRY runs three extraction sources in parallel and uses an XGBoost classifier to pick the best result. This means SMRY can often recover content even when one source is unavailable.",
      },
      {
        heading: "RemovePaywall has no reader mode.",
        body: "RemovePaywall shows you the raw article page (or a cached version). SMRY parses the content into a clean, distraction-free reader view with customizable fonts, dark mode, and adjustable line spacing. You can also switch to the original HTML or an iframe view.",
      },
      {
        heading: "Privacy considerations.",
        body: "Both tools process article URLs server-side. SMRY stores no article content after processing — it's fetched, parsed, and streamed. Chat history can be kept locally in your browser (IndexedDB) or synced to the server for Pro users.",
      },
    ],
    features: [
      { feature: "Free tier", smry: true, competitor: true },
      { feature: "AI-powered summary", smry: true, competitor: false },
      { feature: "Chat with article", smry: true, competitor: false },
      { feature: "Text-to-speech", smry: true, competitor: false },
      { feature: "Multiple extraction sources", smry: "3 sources + classifier", competitor: "Archive-based" },
      { feature: "Reader mode", smry: "3 view modes", competitor: false },
      { feature: "Highlights & notes", smry: true, competitor: false },
      { feature: "Export (Markdown, Notion)", smry: true, competitor: false },
      { feature: "Dark mode", smry: "10 themes", competitor: false },
      { feature: "Works on mobile", smry: true, competitor: true },
      { feature: "No browser extension needed", smry: true, competitor: true },
      { feature: "Account required", smry: "Optional (for Pro)", competitor: false },
      { feature: "Keyboard shortcuts", smry: "20+ shortcuts", competitor: false },
    ],
    verdict:
      "RemovePaywall is a solid, no-frills bypass tool. If all you need is to read one article behind a paywall, it works. But if you read paywalled content regularly and want AI summaries, the ability to ask questions about what you read, or a proper reading environment — SMRY gives you significantly more. Both are free to start, so try pasting the same URL into each and see which experience you prefer.",
    faqs: [
      {
        question: "Is RemovePaywall free?",
        answer:
          "Yes, RemovePaywall is free to use. SMRY also has a free tier that includes paywall bypass and AI summaries, with a Pro plan for unlimited usage.",
      },
      {
        question: "Which tool has better site coverage?",
        answer:
          "Both tools have similar coverage for archive-based bypass. SMRY adds its own parser as a third source, which can sometimes access content that archive-only tools miss. Neither can bypass hard paywalls requiring paid subscriptions.",
      },
      {
        question: "Does SMRY store my reading history?",
        answer:
          "Article history is stored locally in your browser (localStorage) only. SMRY does not track which articles you read on the server. Pro users can optionally sync chat threads to the cloud.",
      },
      {
        question: "Can I use RemovePaywall and SMRY together?",
        answer:
          "Yes. Some users use RemovePaywall for quick access and SMRY when they want AI features or when RemovePaywall doesn't work for a particular site.",
      },
    ],
  },
};

/** All valid competitor slugs for static generation */
export const competitorSlugs = Object.keys(competitors);

/**
 * Generates share URLs for various social platforms
 */

export interface ShareUrls {
  x: string;
  linkedin: string;
  reddit: string;
}

/**
 * Generates a clean smry.ai URL from an original article URL.
 * Uses the clean slug format: https://smry.ai/https://example.com/article
 * (The proxy-redirect middleware handles routing these to /proxy?url=...)
 */
export function getSmryUrl(originalUrl: string): string {
  if (!originalUrl) {
    return "https://smry.ai/";
  }

  // Strip protocol for the slug, then prepend https://
  // smry.ai/https://example.com/article is the clean format
  const withProtocol = /^https?:\/\//i.test(originalUrl)
    ? originalUrl
    : `https://${originalUrl}`;

  return `https://smry.ai/${withProtocol}`;
}

/** Encode text for use in a Text Fragment directive. */
function encodeTextFragment(text: string): string {
  return encodeURIComponent(text).replace(/-/g, "%2D");
}

/**
 * Build a #:~:text= fragment directive for browser scroll-to-text.
 * Uses start,end form for selections longer than 8 words.
 * @see https://developer.mozilla.org/en-US/docs/Web/URI/Fragment/Text_fragments
 */
function buildTextFragment(selectedText: string): string {
  const trimmed = selectedText.trim();
  const words = trimmed.split(/\s+/);

  if (words.length <= 8) {
    const fragmentText = trimmed.length <= 80 ? trimmed : trimmed.slice(0, 80);
    return `#:~:text=${encodeTextFragment(fragmentText)}`;
  }

  const startText = words.slice(0, 4).join(" ");
  const endText = words.slice(-4).join(" ");
  return `#:~:text=${encodeTextFragment(startText)},${encodeTextFragment(endText)}`;
}

/**
 * Build a shareable snippet URL with OG metadata support (for social sharing).
 * Uses /proxy?url=...&snippet=... format so the server generates a custom OG image.
 */
export function buildSnippetUrl(articleUrl: string, selectedText: string): string {
  const trimmed = selectedText.trim();
  const ogSnippet = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
  const base = `https://smry.ai/proxy?url=${encodeURIComponent(articleUrl)}&snippet=${encodeURIComponent(ogSnippet)}`;
  return `${base}${buildTextFragment(selectedText)}`;
}

/**
 * Build a clean copy-friendly URL with text fragment (for copy attribution).
 * Uses the clean slug format: smry.ai/https://example.com/article#:~:text=...
 * Much shorter than buildSnippetUrl — no encoded query params.
 */
export function buildCopyUrl(articleUrl: string, selectedText?: string): string {
  const base = getSmryUrl(articleUrl);
  if (!selectedText) return base;
  return `${base}${buildTextFragment(selectedText)}`;
}

/**
 * Build a copy-attribution string for the given article URL.
 * Uses clean slug format for prettier URLs in pasted text (Medium/Bloomberg-style).
 */
export function buildCopyAttribution(articleUrl: string | undefined, selectedText?: string): string {
  if (!articleUrl) return "";
  return `\n\nRead more on smry.ai: ${buildCopyUrl(articleUrl, selectedText)}`;
}

/**
 * Generates share URLs for social platforms
 * @param originalUrl - The original article URL
 * @param title - Optional article title for richer share text (used on X/Twitter)
 */
export function generateShareUrls(originalUrl: string, title?: string): ShareUrls {
  const smryUrl = getSmryUrl(originalUrl);

  // X/Twitter: include article title for context if available
  const xShareText = title
    ? `${title} — read on smry.ai\n${smryUrl}`
    : smryUrl;

  return {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(smryUrl)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(smryUrl)}&title=${encodeURIComponent(title || "")}`,
  };
}

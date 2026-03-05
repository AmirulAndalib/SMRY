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

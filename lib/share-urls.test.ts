import { describe, expect, it } from "bun:test";
import { getSmryUrl, generateShareUrls } from "./share-urls";

describe("getSmryUrl", () => {
  it("generates clean smry.ai URL from original article URL (no protocol)", () => {
    const originalUrl = "www.theatlantic.com/technology/archive/2017/11/the-big-unanswered-questions-about-paywalls/547091";
    const result = getSmryUrl(originalUrl);
    expect(result).toBe(`https://smry.ai/https://${originalUrl}`);
  });

  it("handles URL with https:// prefix", () => {
    const originalUrl = "https://example.com/article";
    const result = getSmryUrl(originalUrl);
    expect(result).toBe("https://smry.ai/https://example.com/article");
  });

  it("handles URL with http:// prefix", () => {
    const originalUrl = "http://example.com/article";
    const result = getSmryUrl(originalUrl);
    expect(result).toBe("https://smry.ai/http://example.com/article");
  });

  it("handles simple domain", () => {
    const originalUrl = "example.com";
    const result = getSmryUrl(originalUrl);
    expect(result).toBe("https://smry.ai/https://example.com");
  });

  it("handles empty originalUrl", () => {
    const result = getSmryUrl("");
    expect(result).toBe("https://smry.ai/");
  });
});

describe("generateShareUrls", () => {
  const testUrl = "https://www.theatlantic.com/technology/archive/2017/11/the-big-unanswered-questions-about-paywalls/547091";
  const testTitle = "The Big Unanswered Questions About Paywalls";

  describe("X/Twitter share URL", () => {
    it("includes article title when provided", () => {
      const { x } = generateShareUrls(testUrl, testTitle);
      const expectedSmryUrl = `https://smry.ai/${testUrl}`;
      const expectedText = `${testTitle} — read on smry.ai\n${expectedSmryUrl}`;
      expect(x).toBe(`https://twitter.com/intent/tweet?text=${encodeURIComponent(expectedText)}`);
    });

    it("falls back to URL only when no title", () => {
      const { x } = generateShareUrls(testUrl);
      const expectedSmryUrl = `https://smry.ai/${testUrl}`;
      expect(x).toBe(`https://twitter.com/intent/tweet?text=${encodeURIComponent(expectedSmryUrl)}`);
    });

    it("handles empty URL gracefully", () => {
      const { x } = generateShareUrls("");
      expect(x).toBe(`https://twitter.com/intent/tweet?text=${encodeURIComponent("https://smry.ai/")}`);
    });
  });

  describe("LinkedIn share URL", () => {
    it("uses clean URL format", () => {
      const { linkedin } = generateShareUrls(testUrl);
      const expectedSmryUrl = `https://smry.ai/${testUrl}`;
      expect(linkedin).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(expectedSmryUrl)}`);
    });
  });

  describe("Reddit share URL", () => {
    it("uses clean URL format with title", () => {
      const { reddit } = generateShareUrls(testUrl, testTitle);
      const expectedSmryUrl = `https://smry.ai/${testUrl}`;
      expect(reddit).toBe(`https://www.reddit.com/submit?url=${encodeURIComponent(expectedSmryUrl)}&title=${encodeURIComponent(testTitle)}`);
    });
  });

  describe("URL encoding", () => {
    it("properly encodes special characters in URLs", () => {
      const urlWithParams = "https://example.com/article?id=123&category=tech";
      const { x, linkedin, reddit } = generateShareUrls(urlWithParams);
      const expectedSmryUrl = `https://smry.ai/${urlWithParams}`;

      expect(x).toContain(encodeURIComponent(expectedSmryUrl));
      expect(linkedin).toContain(encodeURIComponent(expectedSmryUrl));
      expect(reddit).toContain(encodeURIComponent(expectedSmryUrl));
    });
  });
});

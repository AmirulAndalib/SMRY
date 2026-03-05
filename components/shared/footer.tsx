import { Link } from "@/i18n/navigation";
import { competitorSlugs, competitors } from "@/lib/comparisons/competitors";

const footerLinks = [
  { label: "Status", href: "https://smry.openstatus.dev/", external: true },
  { label: "Pricing", href: "/pricing" },
  { label: "Changelog", href: "/changelog" },
  { label: "Contact", href: "https://smryai.userjot.com/", external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background">
      <div className="mx-auto max-w-xl px-6 py-8">
        {/* Compare section */}
        <div className="mb-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">
            Compare
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {competitorSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/compare/${slug}`}
                className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                SMRY vs {competitors[slug].name}
              </Link>
            ))}
          </div>
        </div>

        {/* Existing footer links */}
        <div className="flex flex-col items-center gap-4 border-t border-border/20 pt-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <p className="text-[11px] text-muted-foreground/50">
            © {new Date().getFullYear()} smry
          </p>
        </div>
      </div>
    </footer>
  );
}

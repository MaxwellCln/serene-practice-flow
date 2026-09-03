import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Sessions" },
  { href: "/#approach", label: "Approach" },
  { href: "/#faq", label: "FAQs" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="font-display text-lg leading-tight tracking-tight">
          {site.shortName}
          <span className="block text-[11px] tracking-widest text-muted-foreground uppercase">
            Psychotherapy
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Button asChild size="sm" className="rounded-full px-5">
          <Link to="/book">Book</Link>
        </Button>
      </div>
    </header>
  );
}

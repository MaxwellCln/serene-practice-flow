import { Link } from "@tanstack/react-router";

import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sand">
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-12 text-sm text-muted-foreground">
        <p className="font-display text-base text-foreground">{site.practiceName}</p>
        <p>
          {site.credentials} · {site.location} · {site.email}
        </p>
        <nav className="flex flex-wrap gap-5">
          <Link to="/faqs" className="transition-colors hover:text-foreground">
            FAQs
          </Link>
          <Link to="/resources" className="transition-colors hover:text-foreground">
            Books &amp; resources
          </Link>
          <Link to="/workshops" className="transition-colors hover:text-foreground">
            Workshops &amp; speaking
          </Link>
        </nav>
        <p className="max-w-2xl">{site.legal.crisisNote}</p>
        <p className="pt-2 text-xs">
          © {new Date().getFullYear()} {site.practiceName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

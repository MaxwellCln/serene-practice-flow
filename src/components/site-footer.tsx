import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sand">
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-12 text-sm text-muted-foreground">
        <p className="font-display text-base text-foreground">{site.practiceName}</p>
        <p>
          {site.credentials} · {site.location} · {site.email}
        </p>
        <p className="max-w-2xl">{site.legal.crisisNote}</p>
        <p className="pt-2 text-xs">
          © {new Date().getFullYear()} {site.practiceName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

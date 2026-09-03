import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: `Workshops & speaking | ${site.shortName}` },
      { name: "description", content: site.workshops.intro },
      { property: "og:title", content: `Workshops & speaking | ${site.practiceName}` },
      { property: "og:description", content: site.workshops.intro },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkshopsPage,
});

function WorkshopsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pt-14 pb-20 md:pt-20">
        <h1 className="text-4xl text-balance md:text-5xl">{site.workshops.heading}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {site.workshops.intro}
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {site.workshops.offerings.map((item) => (
            <article
              key={item.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-7"
            >
              <h2 className="text-xl">{item.title}</h2>
              <p className="mt-2 text-xs tracking-wide text-accent uppercase">{item.format}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 rounded-3xl bg-sand p-8">
          <p className="max-w-xl leading-relaxed text-muted-foreground">{site.workshops.cta}</p>
          <Button asChild variant="secondary" className="mt-6 rounded-full px-6">
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

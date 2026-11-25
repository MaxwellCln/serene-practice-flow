import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

const title = `How online therapy works | ${site.practiceName}`;

export const Route = createFileRoute("/online-therapy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: site.onlineTherapy.intro },
      { property: "og:title", content: title },
      { property: "og:description", content: site.onlineTherapy.intro },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnlineTherapyPage,
});

function OnlineTherapyPage() {
  const page = site.onlineTherapy;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-14 pb-20 md:pt-20">
        <h1 className="text-4xl text-balance md:text-5xl">{page.heading}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{page.intro}</p>
        <div className="mt-12 grid gap-5">
          {page.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-border bg-card p-7">
              <h2 className="text-xl">{section.heading}</h2>
              <div className="mt-3 space-y-2">
                {section.body.map((line) => (
                  <p key={line} className="leading-relaxed text-muted-foreground">{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 rounded-3xl bg-sand p-8">
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            Ready when you are. Book a session and Valerie will be in touch on WhatsApp.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link to="/book">Book a session</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

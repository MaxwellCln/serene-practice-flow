import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: `Privacy policy | ${site.practiceName}` },
    { name: "description", content: `How ${site.practiceName} collects, uses and protects your information.` },
    { property: "og:title", content: `Privacy policy | ${site.practiceName}` },
    { property: "og:description", content: `How ${site.practiceName} collects, uses and protects your information.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <div className="min-h-screen bg-background"><SiteHeader />
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-sm uppercase text-primary">Your privacy</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">{site.privacy.heading}</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{site.privacy.intro}</p>
      <div className="mt-12 space-y-10">
        {site.privacy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="mt-3 leading-relaxed text-muted-foreground">{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-12 max-w-xl text-xs text-muted-foreground">{site.legal.crisisNote}</p>
    </main><SiteFooter /></div>;
}

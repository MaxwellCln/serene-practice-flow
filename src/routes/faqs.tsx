import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: `FAQs | ${site.shortName} Psychotherapy` },
      { name: "description", content: site.faqPage.intro },
      { property: "og:title", content: `FAQs | ${site.practiceName}` },
      { property: "og:description", content: site.faqPage.intro },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqsPage,
});

function FaqsPage() {
  const faqs = [...site.faqs, ...site.faqPage.extra];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-14 pb-20 md:pt-20">
        <h1 className="text-4xl text-balance md:text-5xl">{site.faqPage.heading}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{site.faqPage.intro}</p>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 rounded-3xl bg-sand p-8">
          <h2 className="text-2xl">{site.contact.heading}</h2>
          <p className="mt-3 text-muted-foreground">{site.contact.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <Link to="/book">Book a session</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-6">
              <a href={`mailto:${site.email}`}>Email {site.shortName.split(" ")[0]}</a>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

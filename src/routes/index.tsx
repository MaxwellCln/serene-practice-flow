import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Mail, MapPin, Phone } from "lucide-react";

import roomImage from "@/assets/room.jpg";
import therapistAsset from "@/assets/therapist.jpg.asset.json";
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
import { listServices } from "@/lib/booking.functions";
import { formatMoney } from "@/lib/time";

export const Route = createFileRoute("/")({
  loader: () => listServices(),
  head: () => ({
    meta: [
      { title: `${site.shortName} | Psychotherapy in Limerick City & online` },
      {
        name: "description",
        content: `${site.credentials} offering therapy in Limerick City and online for anxiety, trauma, grief, relationship issues and burnout. Book a session in a few clicks.`,
      },
      { property: "og:title", content: `${site.practiceName}` },
      { property: "og:description", content: site.hero.body },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-8 text-center text-muted-foreground">
      We couldn&apos;t load the page just now. Please refresh.
    </div>
  ),
});

function Home() {
  const services = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-20 md:grid-cols-2 md:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs tracking-wide text-secondary-foreground uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {site.hero.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl leading-[1.08] text-balance md:text-6xl">
              {site.hero.heading}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              {site.hero.body}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/book">{site.hero.primaryCta}</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full px-6">
                <a href="#approach">{site.hero.secondaryCta}</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {site.credentials} · {site.location}
            </p>
          </div>
          <div className="relative">
            <img
              src={roomImage}
              alt="A calm therapy room with two armchairs and soft daylight"
              width={1600}
              height={1200}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-sm"
            />
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-y border-border bg-sand">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <img
              src={therapistImage}
              alt={`${site.shortName}, ${site.credentials}`}
              loading="lazy"
              width={1008}
              height={1264}
              className="aspect-[4/5] w-full max-w-sm rounded-3xl object-cover"
            />
            <div>
              <h2 className="text-3xl md:text-4xl">{site.about.heading}</h2>
              {site.about.body.map((para) => (
                <p key={para} className="mt-5 leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
              <ul className="mt-8 space-y-3">
                {site.about.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Reasons clients seek support */}
        <section id="reasons" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl md:text-4xl">{site.reasons.heading}</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">{site.reasons.intro}</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {site.reasons.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-border bg-card px-5 py-4 text-sm leading-relaxed text-card-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl md:text-4xl">{site.servicesSection.heading}</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">{site.servicesSection.note}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-7"
              >
                <h3 className="text-xl">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <p className="mt-6 font-display text-2xl text-primary">
                  {formatMoney(service.price_cents, service.currency)}
                </p>
                <p className="text-xs text-muted-foreground">{service.duration_minutes} minutes</p>
                <Button asChild variant="secondary" className="mt-6 rounded-full">
                  <Link to="/book" search={{ service: service.slug }}>
                    Book this
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        {/* Approach */}
        <section id="approach" className="border-y border-border bg-sand">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl md:text-4xl">{site.approach.heading}</h2>
            <p className="mt-3 text-muted-foreground">{site.approach.intro}</p>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {site.approach.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="font-display text-3xl text-accent">0{i + 1}</span>
                  <h3 className="mt-3 text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ + contact */}
        <section id="faq" className="mx-auto grid max-w-6xl gap-14 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl md:text-4xl">Common questions</h2>
            <Accordion type="single" collapsible className="mt-6">
              {site.faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div id="contact" className="rounded-3xl bg-primary p-9 text-primary-foreground">
            <h2 className="text-3xl text-primary-foreground">{site.contact.heading}</h2>
            <p className="mt-3 leading-relaxed opacity-90">{site.contact.body}</p>
            <div className="mt-8 space-y-3 text-sm">
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:underline">
                <Mail className="h-4 w-4" aria-hidden /> {site.email}
              </a>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Phone className="h-4 w-4" aria-hidden /> {site.phone}
              </a>
              <p className="flex items-center gap-3 opacity-90">
                <MapPin className="h-4 w-4" aria-hidden /> {site.location}
              </p>
            </div>
            <Button asChild variant="secondary" size="lg" className="mt-9 rounded-full px-7">
              <Link to="/book">Book a session</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

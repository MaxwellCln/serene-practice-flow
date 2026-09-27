import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, Monitor } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: `Contact | ${site.shortName}` },
    { name: "description", content: `Contact ${site.shortName} about online psychotherapy sessions.` },
    { property: "og:title", content: `Contact | ${site.shortName}` },
    { property: "og:description", content: `Get in touch with ${site.shortName} about online psychotherapy.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ContactPage,
});

function ContactPage() {
  return <div className="min-h-screen bg-background"><SiteHeader />
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-sm uppercase text-primary">Get in touch</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Contact Valerie</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{site.contact.body}</p>
      <div className="mt-12 grid gap-6 border-y border-border py-8 text-sm sm:grid-cols-2">
        <a className="flex items-center gap-3 break-all hover:underline" href={`mailto:${site.email}`}><Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden />{site.email}</a>
        <a className="flex items-center gap-3 hover:underline" href={`tel:${site.phone.replace(/\s/g, "")}`}><Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />{site.phone}</a>
        <p className="flex items-center gap-3 text-muted-foreground"><Monitor className="h-5 w-5 shrink-0 text-primary" aria-hidden />All sessions online · {site.language}</p>
      </div>
      <Button asChild size="lg" className="mt-10 rounded-full"><Link to="/book">Book an online session</Link></Button>
      <p className="mt-10 max-w-xl text-xs text-muted-foreground">{site.legal.crisisNote}</p>
    </main><SiteFooter /></div>;
}
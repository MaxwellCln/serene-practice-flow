import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/content/site";
import { useSession } from "@/hooks/use-session";
import { createBooking, listAvailability, listServices } from "@/lib/booking.functions";
import { startCheckout } from "@/lib/payments.functions";
import { formatMoney, formatPracticeDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ service: z.string().optional() }),
  loader: async () => ({
    services: await listServices(),
    availability: await listAvailability(),
  }),
  head: () => ({
    meta: [
      { title: `Book a session | ${site.shortName}` },
      {
        name: "description",
        content: `Choose a session type, pick a time that suits you and confirm securely. ${site.availability.timezoneLabel}.`,
      },
      { property: "og:title", content: `Book a session | ${site.shortName}` },
      {
        property: "og:description",
        content: "Pick a session type and a time that suits you, and confirm in a couple of minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-8 text-center text-muted-foreground">
      The booking calendar didn&apos;t load. Please refresh and try again.
    </div>
  ),
});

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function BookPage() {
  const { services, availability } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const submitBooking = useServerFn(createBooking);
  const openCheckout = useServerFn(startCheckout);

  const [serviceId, setServiceId] = useState<string | null>(
    () => services.find((s) => s.slug === search.service)?.id ?? null,
  );
  const [slot, setSlot] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string>(availability[0]?.date ?? "");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const day = availability.find((d) => d.date === activeDate) ?? availability[0];
  const step = !service ? 1 : !slot ? 2 : 3;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!service || !slot) return;
    const parsed = detailsSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await submitBooking({
        data: {
          serviceId: service.id,
          startsAt: slot,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone ?? "",
          notes: parsed.data.notes ?? "",
          origin: window.location.origin,
        },
      });
      if (result.error || !result.bookingId) {
        toast.error(result.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      if (result.requiresPayment) {
        const checkout = await openCheckout({
          data: { bookingId: result.bookingId, origin: window.location.origin },
        });
        if (checkout.status === "redirect") {
          window.location.href = checkout.url;
          return;
        }
        if (checkout.status === "error") toast.error(checkout.message);
      }
      if (!result.emailSent) {
        toast.message(
          "Email confirmations aren't switched on yet — your details are on the next page.",
        );
      }
      navigate({ to: "/booking/$id", params: { id: result.bookingId } });
    } catch {
      toast.error("We couldn't complete your booking. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to site
        </Link>
        <h1 className="mt-6 text-4xl">Book a session</h1>
        <p className="mt-3 text-muted-foreground">
          Three short steps. Times shown in {site.availability.timezoneLabel}.
        </p>

        <ol className="mt-8 flex gap-2 text-xs tracking-wide uppercase">
          {["Session", "Time", "Details"].map((label, i) => (
            <li
              key={label}
              className={cn(
                "flex-1 rounded-full border px-3 py-2 text-center",
                step > i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {/* Step 1 — service */}
        <section className="mt-10">
          <h2 className="text-2xl">Choose a session</h2>
          <div className="mt-5 grid gap-3">
            {services.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setServiceId(option.id);
                  setSlot(null);
                }}
                className={cn(
                  "rounded-2xl border bg-card p-5 text-left transition-colors",
                  option.id === serviceId
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-lg">{option.title}</span>
                  <span className="text-sm text-primary">
                    {formatMoney(option.price_cents, option.currency)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{option.duration_minutes} minutes</p>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2 — time */}
        {service && (
          <section className="mt-12">
            <h2 className="text-2xl">Pick a time</h2>
            {availability.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                There are no free slots in the next few weeks. Please email {site.email}.
              </p>
            ) : (
              <>
                <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                  {availability.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setActiveDate(d.date)}
                      className={cn(
                        "shrink-0 rounded-xl border px-4 py-3 text-sm whitespace-nowrap",
                        d.date === (day?.date ?? "")
                          ? "border-primary bg-secondary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {formatPracticeDate(`${d.date}T12:00:00Z`)}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {day?.slots.map((s) => (
                    <button
                      key={s.iso}
                      type="button"
                      onClick={() => setSlot(s.iso)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-sm",
                        s.iso === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Step 3 — details */}
        {service && slot && !session && !sessionLoading && (
          <section className="mt-12 rounded-3xl border border-border bg-card p-8">
            <h2 className="text-2xl">Sign in to confirm</h2>
            <p className="mt-3 text-muted-foreground">
              Bookings are held in a private client account, so your details and session history stay
              secure. It takes a moment to create one.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link to="/auth" search={{ mode: "signup", redirect: "/book" }}>
                  Create an account
                </Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/auth" search={{ mode: "signin", redirect: "/book" }}>
                  Sign in
                </Link>
              </Button>
            </div>
          </section>
        )}

        {service && slot && session && (
          <section className="mt-12">
            <h2 className="text-2xl">Your details</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {service.title} · {formatPracticeDate(slot)} ·{" "}
              {day?.slots.find((s) => s.iso === slot)?.time} ·{" "}
              {formatMoney(service.price_cents, service.currency)}
            </p>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  maxLength={100}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors["name"] && <p className="text-sm text-destructive">{errors["name"]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  maxLength={255}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors["email"] && <p className="text-sm text-destructive">{errors["email"]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Anything you&apos;d like me to know? (optional)</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                {service.requires_payment
                  ? `Continue to payment · ${formatMoney(service.price_cents, service.currency)}`
                  : "Confirm booking"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {site.servicesSection.note} Your details are stored securely and never shared.
              </p>
            </form>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, CreditCard } from "lucide-react";
import { z } from "zod";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { getBookingSummary } from "@/lib/booking.functions";
import { confirmCheckout } from "@/lib/payments.functions";
import { formatMoney, formatPracticeDate, formatPracticeTime } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/booking/$id")({
  validateSearch: z.object({ session_id: z.string().optional(), cancelled: z.string().optional() }),
  loaderDeps: ({ search }) => ({ sessionId: search.session_id }),
  loader: async ({ params, deps }) => {
    if (deps.sessionId) {
      await confirmCheckout({ data: { bookingId: params.id, sessionId: deps.sessionId } });
    }
    return getBookingSummary({ data: { id: params.id } });
  },
  head: () => ({
    meta: [
      { title: `Your booking | ${site.shortName}` },
      { name: "description", content: "Your session details and what happens next." },
      { property: "og:title", content: `Your booking | ${site.shortName}` },
      { property: "og:description", content: "Your session details and what happens next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingConfirmation,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-8 text-center text-muted-foreground">
      We couldn&apos;t load this booking. Please email {site.email}.
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-8">Booking not found.</div>
  ),
});

function BookingConfirmation() {
  const booking = Route.useLoaderData();
  const { cancelled } = Route.useSearch();

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="text-3xl">We couldn&apos;t find that booking</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/book">Try booking again</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const paid = booking.paymentStatus === "paid";
  const notRequired = booking.paymentStatus === "not_required";
  const awaitingPayment = !paid && !notRequired;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-9">
          <CalendarCheck className="h-8 w-8 text-primary" aria-hidden />
          <h1 className="mt-5 text-3xl">
            {awaitingPayment && cancelled ? "Your slot is held" : "You're booked in"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {paid || notRequired
              ? "A confirmation has been noted against your booking. I look forward to meeting you."
              : "Your slot is reserved. Payment will be arranged by email before the session."}
          </p>

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Session</dt>
              <dd>{booking.serviceTitle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">When</dt>
              <dd className="text-right">
                {formatPracticeDate(booking.startsAt)}, {formatPracticeTime(booking.startsAt)} (
                {site.availability.timezoneLabel})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Length</dt>
              <dd>{booking.durationMinutes} minutes</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fee</dt>
              <dd className="flex items-center gap-2">
                {formatMoney(booking.amountCents, booking.currency)}
                {paid && <span className="text-primary">· paid</span>}
                {awaitingPayment && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" aria-hidden /> due
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-sm text-muted-foreground">
            Need to change something? Email{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            or call {site.phone}. Free cancellation up to 24 hours before.
          </p>

          <Button asChild variant="secondary" className="mt-8 rounded-full">
            <Link to="/">Back to the site</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

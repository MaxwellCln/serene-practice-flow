import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/content/site";
import { getMyAccount, updateMyProfile } from "@/lib/account.functions";
import { cancelMyBooking, listMyBookings } from "@/lib/booking.functions";
import { formatMoney, formatPracticeDate, formatPracticeTime } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: `Your account | ${site.shortName}` },
      { name: "description", content: "Your upcoming sessions and contact details." },
      { property: "og:title", content: `Your account | ${site.shortName}` },
      { property: "og:description", content: "Your upcoming sessions and contact details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchAccount = useServerFn(getMyAccount);
  const fetchBookings = useServerFn(listMyBookings);
  const saveProfile = useServerFn(updateMyProfile);
  const cancelBooking = useServerFn(cancelMyBooking);

  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount({}) });
  const bookings = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchBookings({}) });

  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account.data) setForm({ fullName: account.data.fullName, phone: account.data.phone });
  }, [account.data]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveProfile({ data: { fullName: form.fullName, phone: form.phone } });
      toast.success("Details saved.");
      queryClient.invalidateQueries({ queryKey: ["account"] });
    } catch {
      toast.error("We couldn't save your details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelBooking({ data: { id } });
      toast.success("Booking cancelled.");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch {
      toast.error("We couldn't cancel that booking. Please email us.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl">Your account</h1>
            <p className="mt-2 text-muted-foreground">{account.data?.email}</p>
          </div>
          <div className="flex gap-2">
            {account.data?.isAdmin && (
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/admin">Admin dashboard</Link>
              </Button>
            )}
            <Button asChild className="rounded-full">
              <Link to="/book">Book a session</Link>
            </Button>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl">Your sessions</h2>
          {bookings.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : (bookings.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              You don&apos;t have any sessions yet.{" "}
              <Link to="/book" className="underline">
                Book your first one
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {(bookings.data ?? []).map((b) => (
                <li key={b.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="font-display text-lg">{b.serviceTitle}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatMoney(b.amountCents, b.currency)} ·{" "}
                      {b.paymentStatus === "paid"
                        ? "paid"
                        : b.paymentStatus === "not_required"
                          ? "no fee"
                          : "payment due"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatPracticeDate(b.startsAt)}, {formatPracticeTime(b.startsAt)} ·{" "}
                    {b.durationMinutes} minutes · {b.status}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" variant="secondary" className="rounded-full">
                      <Link to="/booking/$id" params={{ id: b.id }}>
                        View
                      </Link>
                    </Button>
                    {b.status !== "cancelled" && new Date(b.startsAt) > new Date() && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => handleCancel(b.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14">
          <h2 className="text-2xl">Your details</h2>
          <form onSubmit={handleSave} className="mt-5 grid max-w-md gap-5">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                maxLength={100}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
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
            <Button type="submit" className="w-fit rounded-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Save details
            </Button>
          </form>
          <Button
            variant="ghost"
            className="mt-8 rounded-full"
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await import("@/integrations/supabase/client").then((m) => m.supabase.auth.signOut());
              navigate({ to: "/auth", replace: true });
            }}
          >
            Sign out
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

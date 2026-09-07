import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/content/site";
import { useSession } from "@/hooks/use-session";
import { deleteMyAccount, getMyAccount, updateMyProfile } from "@/lib/account.functions";
import {
  CHANGE_CUTOFF_HOURS,
  cancelMyBooking,
  listAvailability,
  listMyBookings,
  rescheduleMyBooking,
} from "@/lib/booking.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const rescheduleBooking = useServerFn(rescheduleMyBooking);
  const fetchAvailability = useServerFn(listAvailability);
  const removeAccount = useServerFn(deleteMyAccount);

  const { session } = useSession();
  const signedIn = Boolean(session);

  const account = useQuery({
    queryKey: ["account"],
    queryFn: () => fetchAccount({}),
    enabled: signedIn,
    retry: false,
  });
  const bookings = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => fetchBookings({}),
    enabled: signedIn,
    retry: false,
  });

  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [movingTo, setMovingTo] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const availability = useQuery({
    queryKey: ["availability"],
    queryFn: () => fetchAvailability({}),
    enabled: rescheduleId !== null,
  });

  function noteEmail(emailSent: boolean | undefined) {
    if (!emailSent) {
      toast.message("Email confirmations aren't switched on yet — check this page for the details.");
    }
  }

  async function handleCancel(id: string) {
    try {
      const result = await cancelBooking({ data: { id, origin: window.location.origin } });
      if (!result.ok) {
        toast.error(result.error ?? "We couldn't cancel that booking.");
        return;
      }
      toast.success("Booking cancelled.");
      noteEmail(result.emailSent);
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch {
      toast.error("We couldn't cancel that booking. Please contact the practice.");
    }
  }

  async function handleReschedule(iso: string) {
    if (!rescheduleId) return;
    setMovingTo(iso);
    try {
      const result = await rescheduleBooking({
        data: { id: rescheduleId, startsAt: iso, origin: window.location.origin },
      });
      if (!result.ok) {
        toast.error(result.error ?? "We couldn't move that session.");
        return;
      }
      toast.success("Your session has been moved.");
      noteEmail(result.emailSent);
      setRescheduleId(null);
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    } catch {
      toast.error("We couldn't move that session. Please contact the practice.");
    } finally {
      setMovingTo(null);
    }
  }

  const canChange = (startsAt: string) =>
    new Date(startsAt).getTime() - Date.now() > CHANGE_CUTOFF_HOURS * 3_600_000;

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
          <p className="mt-2 text-sm text-muted-foreground">
            You can reschedule or cancel online up to {CHANGE_CUTOFF_HOURS} hours before a session.
            Closer than that, please contact the practice on {site.phone}.
          </p>
          {!signedIn || bookings.isLoading ? (
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="secondary" className="rounded-full">
                      <Link to="/booking/$id" params={{ id: b.id }}>
                        View
                      </Link>
                    </Button>
                    {b.status !== "cancelled" &&
                      new Date(b.startsAt) > new Date() &&
                      (canChange(b.startsAt) ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-full"
                            onClick={() => setRescheduleId(b.id)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => handleCancel(b.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Within {CHANGE_CUTOFF_HOURS} hours of your session — please call{" "}
                          {site.phone} to change it.
                        </p>
                      ))}
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

        <section className="mt-14">
          <h2 className="text-2xl">Account settings</h2>

          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-lg">Password</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;ll email you a secure link to choose a new password.
              </p>
              <Button
                variant="secondary"
                className="mt-4 rounded-full"
                onClick={async () => {
                  const email = account.data?.email;
                  if (!email) return;
                  const { supabase } = await import("@/integrations/supabase/client");
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error("We couldn't send that email. Please try again.");
                  else toast.success(`Reset link sent to ${email}.`);
                }}
              >
                Change password
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-lg">Email address</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Changing the email address on your account isn&apos;t supported at the moment. If you
                need it changed, email{" "}
                <a href={`mailto:${site.email}`} className="underline">
                  {site.email}
                </a>{" "}
                or call {site.phone} and we&apos;ll sort it with you.
              </p>
            </div>

            <div className="rounded-2xl border border-destructive/40 bg-card p-5">
              <h3 className="font-display text-lg">Delete your account</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This removes your sign-in and your saved contact details for good. Any upcoming
                sessions are cancelled. For our records, past appointment and payment entries are
                kept, with your personal details removed.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-4 rounded-full" disabled={deleting}>
                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                    Delete my account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This can&apos;t be undone. Type DELETE below to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmDelete">Confirmation</Label>
                    <Input
                      id="confirmDelete"
                      value={confirmText}
                      autoComplete="off"
                      placeholder="DELETE"
                      onChange={(e) => setConfirmText(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">Keep my account</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-full"
                      disabled={confirmText.trim() !== "DELETE" || deleting}
                      onClick={async (event) => {
                        event.preventDefault();
                        setDeleting(true);
                        try {
                          await removeAccount({ data: { confirm: "DELETE" } });
                          await queryClient.cancelQueries();
                          queryClient.clear();
                          const { supabase } = await import("@/integrations/supabase/client");
                          await supabase.auth.signOut();
                          toast.success("Your account has been deleted.");
                          navigate({ to: "/", replace: true });
                        } catch {
                          toast.error(
                            "We couldn't delete your account. Please contact the practice.",
                          );
                        } finally {
                          setDeleting(false);
                        }
                      }}
                    >
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>
      </main>
      <Dialog open={rescheduleId !== null} onOpenChange={(open) => !open && setRescheduleId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Choose a new time</DialogTitle>
            <DialogDescription>
              Times shown are {site.availability.timezoneLabel} and are at least{" "}
              {CHANGE_CUTOFF_HOURS} hours away.
            </DialogDescription>
          </DialogHeader>
          {availability.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading available times…</p>
          ) : (availability.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No times are free at the moment. Please contact the practice on {site.phone}.
            </p>
          ) : (
            <div className="grid gap-5">
              {(availability.data ?? []).map((day) => (
                <div key={day.date}>
                  <p className="font-display text-base">
                    {day.label}, {formatPracticeDate(day.slots[0]!.iso)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.slots.map((slot) => (
                      <Button
                        key={slot.iso}
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        disabled={movingTo !== null}
                        onClick={() => handleReschedule(slot.iso)}
                      >
                        {movingTo === slot.iso && (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden />
                        )}
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </div>
  );
}

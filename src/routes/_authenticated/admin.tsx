import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { site } from "@/content/site";
import { useSession } from "@/hooks/use-session";
import { claimFirstAdmin, getMyAccount } from "@/lib/account.functions";
import {
  addAvailabilityBlock,
  addAvailabilitySlot,
  closeAvailabilitySlot,
  getAdminData,
  getWeekAvailability,
  reopenAvailabilitySlot,
  removeAvailabilityBlock,
  setServiceActive,
  updateBookingAdmin,
} from "@/lib/admin.functions";
import {
  createAdminInvite,
  listAdminInvites,
  revokeAdminInvite,
} from "@/lib/admin-invite.functions";
import { listAvailability } from "@/lib/booking.functions";
import { Badge } from "@/components/ui/badge";
import {
  formatMoney,
  formatPracticeDate,
  formatPracticeTime,
  practiceDateKey,
} from "@/lib/time";

/** Only this address may claim the very first dashboard access. */
const BOOTSTRAP_ADMIN_EMAIL = "mclein568@gmail.com";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `Practice dashboard | ${site.shortName}` },
      { name: "description", content: "Private dashboard for managing bookings and availability." },
      { property: "og:title", content: `Practice dashboard | ${site.shortName}` },
      {
        property: "og:description",
        content: "Private dashboard for managing bookings and availability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const statuses = ["pending", "confirmed", "completed", "cancelled"] as const;
const paymentStatuses = ["unpaid", "invoice_pending", "paid", "refunded", "not_required"] as const;

function AdminPage() {
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const fetchData = useServerFn(getAdminData);
  const claimAdmin = useServerFn(claimFirstAdmin);
  const patchBooking = useServerFn(updateBookingAdmin);
  const toggleService = useServerFn(setServiceActive);
  const addBlock = useServerFn(addAvailabilityBlock);
  const deleteBlock = useServerFn(removeAvailabilityBlock);
  const fetchAvailability = useServerFn(listAvailability);

  const { session } = useSession();
  const account = useQuery({
    queryKey: ["account"],
    queryFn: () => fetchAccount({}),
    enabled: Boolean(session),
    retry: false,
  });
  const isAdmin = account.data?.isAdmin ?? false;

  const data = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchData({}),
    enabled: isAdmin,
  });

  const availability = useQuery({
    queryKey: ["admin-availability"],
    queryFn: () => fetchAvailability({}),
    enabled: isAdmin,
  });

  const [block, setBlock] = useState({ startsAt: "", endsAt: "", reason: "" });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
  };

  if (!session || account.isLoading) {
    return <Shell>Loading…</Shell>;
  }

  if (!isAdmin) {
    const email = (account.data?.email ?? "").toLowerCase();
    const canBootstrap = email === BOOTSTRAP_ADMIN_EMAIL;
    return (
      <Shell>
        <h1 className="text-3xl">Practice dashboard</h1>
        {canBootstrap ? (
          <>
            <p className="mt-3 max-w-lg text-muted-foreground">
              This area is private to the practice team. As the initial account holder you can claim
              dashboard access once — it only works while no one else has it yet.
            </p>
            <Button
              className="mt-6 rounded-full"
              onClick={async () => {
                const result = await claimAdmin({});
                if (result.granted) {
                  toast.success("Dashboard access granted.");
                  queryClient.invalidateQueries({ queryKey: ["account"] });
                } else {
                  toast.error(
                    "Access couldn't be granted. Confirm your email address, or ask an existing dashboard owner for an invitation.",
                  );
                }
              }}
            >
              Claim initial access
            </Button>
          </>
        ) : (
          <p className="mt-3 max-w-lg text-muted-foreground">
            This area is private to the practice team. Access is by invitation only — ask an
            existing dashboard owner to send an invitation to your email address.
          </p>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Not what you were looking for?{" "}
          <Link to="/account" className="underline">
            Go to your account
          </Link>
          .
        </p>
      </Shell>
    );
  }


  const bookings = data.data?.bookings ?? [];
  const services = data.data?.services ?? [];
  const blocks = data.data?.blocks ?? [];
  const now = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.startsAt) >= now && b.status !== "cancelled",
  );
  const openSlots = (availability.data ?? []).reduce((sum, d) => sum + d.slots.length, 0);

  // Group upcoming sessions and free slots by day, so the next fortnight reads at a glance.
  const dayMap = new Map<
    string,
    { label: string; sessions: typeof upcoming; slots: { time: string; iso: string }[] }
  >();
  for (const b of upcoming) {
    const key = practiceDateKey(new Date(b.startsAt));
    const entry = dayMap.get(key) ?? { label: formatPracticeDate(b.startsAt), sessions: [], slots: [] };
    entry.sessions.push(b);
    dayMap.set(key, entry);
  }
  for (const day of availability.data ?? []) {
    const entry =
      dayMap.get(day.date) ??
      { label: formatPracticeDate(`${day.date}T12:00:00Z`), sessions: [], slots: [] };
    entry.slots = day.slots;
    dayMap.set(day.date, entry);
  }
  const scheduleDays = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 14);

  return (
    <Shell>
      <div className="rounded-3xl border border-border bg-secondary/40 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
            Admin dashboard
          </Badge>
          <span className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{account.data?.email}</span>
          </span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl">Valerie&apos;s practice dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Private to the practice team. Client details are never shown anywhere else on the site.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Upcoming sessions", value: upcoming.length },
            { label: "Open slots (next 28 days)", value: openSlots },
            { label: "Bookings all time", value: bookings.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="font-display text-2xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <Button asChild variant="secondary" className="rounded-full">
            <Link to="/account">Your account</Link>
          </Button>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl">Schedule at a glance</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upcoming client sessions and the slots still free, in {site.availability.timezoneLabel}.
        </p>
        {data.isLoading || availability.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : scheduleDays.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nothing scheduled and no slots open yet. Check the weekly availability and time-off
            settings below.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4">
            {scheduleDays.map(([key, day]) => (
              <li key={key} className="rounded-2xl border border-border bg-card p-5">
                <p className="font-display text-lg">{day.label}</p>
                {day.sessions.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No sessions booked.</p>
                ) : (
                  <ul className="mt-3 grid gap-3">
                    {day.sessions
                      .slice()
                      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                      .map((b) => (
                        <li
                          key={b.id}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-display text-base">
                              {formatPracticeTime(b.startsAt)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {b.serviceTitle} · {b.durationMinutes} min
                            </span>
                            <Badge variant="secondary" className="rounded-full">
                              {b.status}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              {b.paymentStatus.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="mt-2 break-words text-sm">
                            {b.clientName} ·{" "}
                            <a className="underline" href={`mailto:${b.clientEmail}`}>
                              {b.clientEmail}
                            </a>
                            {b.clientPhone ? (
                              <>
                                {" · "}
                                <a className="underline" href={`tel:${b.clientPhone}`}>
                                  {b.clientPhone}
                                </a>
                              </>
                            ) : null}
                          </p>
                        </li>
                      ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Free slots
                  </span>
                  {day.slots.length === 0 ? (
                    <span className="text-sm text-muted-foreground">None left this day.</span>
                  ) : (
                    day.slots.map((s) => (
                      <span
                        key={s.iso}
                        className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        {s.time}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/40 p-5">
        <p className="text-sm text-muted-foreground">
          Automatic booking emails to clients are ready to go, but they can only be sent once a
          verified sending domain is set up for the practice. Until then clients see their session
          details on screen and in their own account, and no email is sent.
        </p>
      </section>


      <section className="mt-12">
        <h2 className="text-2xl">All bookings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Change a session&apos;s status (including cancelling it) and record payment here.
        </p>
        {data.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {bookings.map((b) => (
              <li key={b.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="font-display text-lg">
                    {formatPracticeDate(b.startsAt)}, {formatPracticeTime(b.startsAt)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {b.serviceTitle} · {b.durationMinutes} min ·{" "}
                    {formatMoney(b.amountCents, b.currency)}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {b.clientName} ·{" "}
                  <a className="underline" href={`mailto:${b.clientEmail}`}>
                    {b.clientEmail}
                  </a>
                  {b.clientPhone ? ` · ${b.clientPhone}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Select
                    value={b.status}
                    onValueChange={async (value) => {
                      await patchBooking({ data: { id: b.id, status: value as never } });
                      refresh();
                    }}
                  >
                    <SelectTrigger className="w-44 rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={b.paymentStatus}
                    onValueChange={async (value) => {
                      await patchBooking({ data: { id: b.id, paymentStatus: value as never } });
                      refresh();
                    }}
                  >
                    <SelectTrigger className="w-52 rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WeekAheadEditor isAdmin={isAdmin} />

      <section className="mt-14">
        <h2 className="text-2xl">Usual weekly pattern</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These are the times offered to clients most weeks ({site.availability.timezoneLabel}).
          Use the week ahead above to open or close individual times. Clients can book up to{" "}
          {site.availability.horizonDays} days ahead and must book, move or cancel at least{" "}
          {site.availability.noticeHours} hours in advance. To change the standing pattern, ask
          your website contact to update the practice hours.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {site.availability.days.map((day) => (
            <li key={day.weekday} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-lg">{day.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{day.times.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Session types</h2>
        <ul className="mt-5 grid gap-3">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div>
                <p className="font-display text-lg">{s.title}</p>
                <p className="text-sm text-muted-foreground">
                  {s.durationMinutes} min · {formatMoney(s.priceCents, s.currency)}
                </p>
              </div>
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                Bookable
                <Switch
                  checked={s.isActive}
                  onCheckedChange={async (checked) => {
                    await toggleService({ data: { id: s.id, isActive: checked } });
                    refresh();
                  }}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Time off</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Block out holidays or busy periods — blocked times disappear from the booking calendar.
        </p>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await addBlock({ data: block });
            if (!result.ok) {
              toast.error(result.error ?? "Please check those dates.");
              return;
            }
            setBlock({ startsAt: "", endsAt: "", reason: "" });
            toast.success("Time blocked.");
            refresh();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="datetime-local"
              required
              value={block.startsAt}
              onChange={(e) => setBlock({ ...block, startsAt: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="datetime-local"
              required
              value={block.endsAt}
              onChange={(e) => setBlock({ ...block, endsAt: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Note (optional)</Label>
            <Input
              id="reason"
              maxLength={120}
              value={block.reason}
              onChange={(e) => setBlock({ ...block, reason: e.target.value })}
            />
          </div>
          <Button type="submit" className="rounded-full">
            Block
          </Button>
        </form>

        {blocks.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">No time off blocked at the moment.</p>
        )}
        <ul className="mt-6 grid gap-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span>
                {formatPracticeDate(b.startsAt)} {formatPracticeTime(b.startsAt)} →{" "}
                {formatPracticeDate(b.endsAt)} {formatPracticeTime(b.endsAt)}
                {b.reason ? ` · ${b.reason}` : ""}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={async () => {
                  await deleteBlock({ data: { id: b.id } });
                  refresh();
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <AdminAccessSection />
    </Shell>

  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-14">{children}</main>
      <SiteFooter />
    </div>
  );
}

function AdminAccessSection() {
  const queryClient = useQueryClient();
  const fetchInvites = useServerFn(listAdminInvites);
  const sendInvite = useServerFn(createAdminInvite);
  const revoke = useServerFn(revokeAdminInvite);

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastLink, setLastLink] = useState<{ link: string; emailSent: boolean } | null>(null);

  const invites = useQuery({ queryKey: ["admin-invites"], queryFn: () => fetchInvites({}) });

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await sendInvite({
        data: { email: email.trim(), origin: window.location.origin },
      });
      setLastLink({ link: result.link, emailSent: result.emailSent });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      if (result.emailSent) {
        toast.success("Invitation email sent.");
      } else {
        toast.info("Invitation created — copy the link below and share it directly.");
      }
    } catch {
      toast.error("That invitation couldn't be created. Please check the email address.");
    } finally {
      setBusy(false);
    }
  }

  const rows = invites.data ?? [];

  return (
    <section className="mt-14">
      <h2 className="text-2xl">Dashboard access</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Invite someone to manage the practice dashboard. The link works only once, expires after 48
        hours, and only grants access to a signed-in person whose confirmed email matches the
        invitation.
      </p>

      <form className="mt-5 flex flex-wrap items-end gap-4" onSubmit={handleInvite}>
        <div className="grid min-w-64 flex-1 gap-2">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            required
            maxLength={255}
            placeholder="valerie@example.ie"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="rounded-full" disabled={busy}>
          Send invitation
        </Button>
      </form>

      {lastLink && (
        <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-5 text-sm">
          <p className="font-medium">
            {lastLink.emailSent
              ? "Invitation emailed. You can also share this link directly:"
              : "Email sending isn't set up yet, so no email was sent. Share this link privately instead:"}
          </p>
          <p className="mt-3 break-all rounded-xl bg-background px-4 py-3 font-mono text-xs">
            {lastLink.link}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 rounded-full"
            onClick={async () => {
              await navigator.clipboard.writeText(lastLink.link);
              toast.success("Link copied.");
            }}
          >
            Copy link
          </Button>
          {!lastLink.emailSent && (
            <p className="mt-3 text-xs text-muted-foreground">
              To send invitations by email, a verified sending domain must be connected to the site
              first.
            </p>
          )}
        </div>
      )}

      <ul className="mt-6 grid gap-2">
        {rows.map((invite) => (
          <li
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
          >
            <span>
              {invite.email} ·{" "}
              <span className="text-muted-foreground">
                {invite.status === "pending"
                  ? `expires ${formatPracticeDate(invite.expiresAt)} ${formatPracticeTime(invite.expiresAt)}`
                  : invite.status === "accepted"
                    ? "accepted"
                    : invite.status === "revoked"
                      ? "withdrawn"
                      : "expired"}
              </span>
            </span>
            {invite.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={async () => {
                  await revoke({ data: { id: invite.id } });
                  queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
                  toast.success("Invitation withdrawn.");
                }}
              >
                Withdraw
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Admin-only editor for opening and closing individual times in the coming week. */
function WeekAheadEditor({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const fetchWeek = useServerFn(getWeekAvailability);
  const addSlot = useServerFn(addAvailabilitySlot);
  const closeSlot = useServerFn(closeAvailabilitySlot);
  const reopenSlot = useServerFn(reopenAvailabilitySlot);

  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState({ date: "", time: "" });

  const week = useQuery({
    queryKey: ["admin-week"],
    queryFn: () => fetchWeek({}),
    enabled: isAdmin,
    retry: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-week"] });
    queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
    queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  };

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    setBusy(key);
    try {
      const result = await fn();
      if (!result.ok) toast.error(result.error ?? "That didn't work.");
      else {
        toast.success(done);
        refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin) return null;

  const days = week.data ?? [];

  return (
    <section className="mt-14">
      <h2 className="text-2xl">The week ahead</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Open or close individual times for the next seven days ({site.availability.timezoneLabel}).
        Closed times disappear from the booking page straight away; times with a session booked
        can&apos;t be closed until that session is cancelled.
      </p>

      <form
        className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.date || !draft.time) {
            toast.error("Choose a date and a time.");
            return;
          }
          void run("add", () => addSlot({ data: draft }), "Time opened.").then(() =>
            setDraft({ date: "", time: "" }),
          );
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="extra-date">Add a date</Label>
          <Input
            id="extra-date"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="extra-time">Start time</Label>
          <Input
            id="extra-time"
            type="time"
            step={900}
            value={draft.time}
            onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
          />
        </div>
        <Button type="submit" className="rounded-full" disabled={busy === "add"}>
          Open this time
        </Button>
      </form>

      {week.isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading the week…</p>
      ) : days.every((d) => d.slots.length === 0) ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No times are set for the next seven days. Add one above and it becomes bookable
          immediately.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4">
          {days.map((day) => (
            <li key={day.date} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-lg">{day.label}</p>
              {day.slots.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nothing offered this day. Add a time above if you&apos;d like to work.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {day.slots.map((slot) => (
                    <li
                      key={slot.iso}
                      className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-background py-1 pl-3 pr-1 text-sm"
                    >
                      <span className="font-medium">{slot.time}</span>
                      {slot.state === "booked" ? (
                        <>
                          <Badge variant="secondary" className="rounded-full">
                            {slot.clientName}
                          </Badge>
                          <span className="pr-2 text-xs text-muted-foreground">booked</span>
                        </>
                      ) : slot.state === "past" ? (
                        <span className="pr-2 text-xs text-muted-foreground">passed</span>
                      ) : slot.state === "closed" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-3 text-xs"
                          disabled={busy === slot.iso}
                          onClick={() =>
                            void run(slot.iso, () => reopenSlot({ data: { iso: slot.iso } }), "Time opened.")
                          }
                        >
                          Closed · reopen
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-3 text-xs"
                          disabled={busy === slot.iso}
                          onClick={() =>
                            void run(slot.iso, () => closeSlot({ data: { iso: slot.iso } }), "Time closed.")
                          }
                        >
                          Open · close
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

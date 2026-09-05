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
import { claimFirstAdmin, getMyAccount } from "@/lib/account.functions";
import {
  addAvailabilityBlock,
  getAdminData,
  removeAvailabilityBlock,
  setServiceActive,
  updateBookingAdmin,
} from "@/lib/admin.functions";
import {
  createAdminInvite,
  listAdminInvites,
  revokeAdminInvite,
} from "@/lib/admin-invite.functions";
import { formatMoney, formatPracticeDate, formatPracticeTime } from "@/lib/time";

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

  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount({}) });
  const isAdmin = account.data?.isAdmin ?? false;

  const data = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchData({}),
    enabled: isAdmin,
  });

  const [block, setBlock] = useState({ startsAt: "", endsAt: "", reason: "" });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-data"] });

  if (account.isLoading) {
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
  const upcoming = bookings.filter((b) => new Date(b.startsAt) >= new Date());

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Practice dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            {upcoming.length} upcoming {upcoming.length === 1 ? "session" : "sessions"} ·{" "}
            {bookings.length} total
          </p>
        </div>
        <Button asChild variant="secondary" className="rounded-full">
          <Link to="/account">Your account</Link>
        </Button>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl">Bookings</h2>
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

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { useSession } from "@/hooks/use-session";
import { acceptAdminInvite, type AcceptInviteStatus } from "@/lib/admin-invite.functions";

export const Route = createFileRoute("/admin-invite")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: `Dashboard invitation | ${site.shortName}` },
      { name: "description", content: "Accept an invitation to manage the practice dashboard." },
      { property: "og:title", content: `Dashboard invitation | ${site.shortName}` },
      {
        property: "og:description",
        content: "Accept an invitation to manage the practice dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminInvitePage,
});

const messages: Record<Exclude<AcceptInviteStatus, "granted">, string> = {
  invalid: "This invitation link isn't valid. Please ask for a new one.",
  revoked: "This invitation has been withdrawn. Please ask for a new one.",
  already_used: "This invitation has already been used.",
  expired: "This invitation has expired. Please ask for a new one.",
  email_unconfirmed:
    "Please confirm your email address first — check your inbox for the confirmation link, then open this invitation again.",
  email_mismatch:
    "You're signed in with a different email address than the one this invitation was sent to. Sign out, sign in with the invited address, and open the link again.",
  not_signed_in: "Please sign in first, then open this invitation link again.",
};

function AdminInvitePage() {
  const { token } = Route.useSearch();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const accept = useServerFn(acceptAdminInvite);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AcceptInviteStatus | null>(null);

  const returnPath = `/admin-invite?token=${encodeURIComponent(token ?? "")}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8">
          <h1 className="text-3xl">Practice dashboard invitation</h1>

          {!token ? (
            <p className="mt-4 text-sm text-muted-foreground">
              This invitation link is incomplete. Please open the full link you were sent.
            </p>
          ) : loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !session ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Sign in with the email address this invitation was sent to — or create your account
                first. You&apos;ll come straight back here to finish.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link to="/auth" search={{ redirect: returnPath, mode: "signin" }}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full">
                  <Link to="/auth" search={{ redirect: returnPath, mode: "signup" }}>
                    Create an account
                  </Link>
                </Button>
              </div>
            </>
          ) : result === "granted" ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                You now have access to the practice dashboard.
              </p>
              <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/admin" })}>
                Open the dashboard
              </Button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Signed in as {session.user.email}. Accept the invitation to manage bookings and
                availability.
              </p>
              {result && (
                <p className="mt-4 rounded-2xl border border-border bg-secondary/50 p-4 text-sm">
                  {messages[result]}
                </p>
              )}
              <Button
                className="mt-6 rounded-full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const response = await accept({ data: { token } });
                    setResult(response.status);
                  } catch {
                    setResult("invalid");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                Accept invitation
              </Button>
            </>
          )}

          <p className="mt-8 text-sm text-muted-foreground">
            <Link to="/" className="underline hover:text-foreground">
              Back to the site
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

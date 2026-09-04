import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/content/site";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    redirect: z.string().optional(),
    mode: z.enum(["signin", "signup"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: `Client sign in | ${site.shortName}` },
      {
        name: "description",
        content: "Sign in or create a client account to book and manage your therapy sessions.",
      },
      { property: "og:title", content: `Client sign in | ${site.shortName}` },
      {
        property: "og:description",
        content: "Sign in or create a client account to book and manage your therapy sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/book";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(search.mode ?? "signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(search.redirect), replace: true });
    });
  }, [navigate, search.redirect]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
        return;
      }

      if (mode === "signup") {
        if (form.name.trim().length < 2) {
          toast.error("Please enter your name.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("confirm");
          return;
        }
        toast.success("Account created.");
        navigate({ to: safePath(search.redirect), replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      toast.success("Welcome back.");
      navigate({ to: safePath(search.redirect), replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8">
          <h1 className="text-3xl">
            {mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Sign in"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "reset"
              ? "We'll email you a secure link to choose a new password."
              : "Your account keeps your bookings and contact details private and in one place."}
          </p>

          {sent ? (
            <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-5 text-sm">
              {sent === "confirm"
                ? "Check your email to confirm your account, then sign in to finish booking."
                : "If that email is registered, a reset link is on its way."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              {mode === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    maxLength={100}
                    autoComplete="name"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  autoComplete="email"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {mode !== "reset" && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              )}
              <Button type="submit" size="lg" className="rounded-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                {mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
              </Button>
            </form>
          )}

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            {mode !== "signup" && (
              <p>
                New here?{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    setMode("signup");
                    setSent(null);
                  }}
                >
                  Create an account
                </button>
              </p>
            )}
            {mode !== "signin" && (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    setMode("signin");
                    setSent(null);
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
            {mode !== "reset" && (
              <p>
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    setMode("reset");
                    setSent(null);
                  }}
                >
                  Forgotten your password?
                </button>
              </p>
            )}
            <p className="pt-2">
              <Link to="/" className="underline hover:text-foreground">
                Back to the site
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

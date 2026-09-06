import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, LogIn, LogOut, User, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function AccountMenu() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const email = session?.user.email ?? "";
  const initial = email.trim().charAt(0).toUpperCase() || "?";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleChangePassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error("We couldn't send the password email. Please try again.");
    else toast.success(`We've sent a password reset link to ${email}.`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 rounded-full"
          aria-label={session ? `Account menu for ${email}` : "Account menu"}
        >
          {session ? (
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
            >
              {initial}
            </span>
          ) : (
            <User className="h-5 w-5" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-2xl border-border bg-card p-2"
      >
        {loading ? (
          <DropdownMenuLabel className="px-3 py-2 text-xs font-normal text-muted-foreground">
            Checking your account…
          </DropdownMenuLabel>
        ) : session ? (
          <>
            <DropdownMenuLabel className="px-3 py-2">
              <span className="block text-xs text-muted-foreground">Signed in as</span>
              <span className="block truncate text-sm">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/account" className="cursor-pointer px-3 py-2.5">
                <User className="mr-2 h-4 w-4" aria-hidden />
                My account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-xl px-3 py-2.5"
              onSelect={(e) => {
                e.preventDefault();
                void handleChangePassword();
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" aria-hidden />
              Change password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-xl px-3 py-2.5"
              onSelect={(e) => {
                e.preventDefault();
                void handleSignOut();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden />
              Log out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/auth" search={{ mode: "signin" }} className="cursor-pointer px-3 py-2.5">
                <LogIn className="mr-2 h-4 w-4" aria-hidden />
                Sign in
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/auth" search={{ mode: "signup" }} className="cursor-pointer px-3 py-2.5">
                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                Create account
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

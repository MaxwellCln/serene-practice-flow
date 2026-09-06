import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Account = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  isAdmin: boolean;
};

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Account> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    return {
      id: context.userId,
      email: (profile?.email as string) || String(context.claims["email"] ?? ""),
      fullName: (profile?.full_name as string) ?? "",
      phone: (profile?.phone as string) ?? "",
      isAdmin: Boolean(isAdmin),
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(100),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone || null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** One-time bootstrap: the first signed-in account may claim the admin role. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin");
    if (error) throw new Error(error.message);
    return { granted: Boolean(data) };
  });

/**
 * Self-service account deletion.
 * Booking/payment records are retained for the practice's records but stripped
 * of personal details; the profile row and the auth user are removed.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(data))
  .handler(async ({ context }) => {
    const userId = context.userId;

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin) {
      throw new Error("Administrator accounts can't be deleted from here.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Cancel any future sessions so the slot is released.
    await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gt("starts_at", new Date().toISOString());

    // Keep the financial/appointment record, remove the personal details.
    const { error: anonError } = await supabaseAdmin
      .from("bookings")
      .update({
        client_name: "Deleted client",
        client_email: `deleted+${userId}@removed.invalid`,
        client_phone: null,
        notes: null,
        user_id: null,
      })
      .eq("user_id", userId);
    if (anonError) throw new Error(anonError.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileError) throw new Error(profileError.message);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

    return { ok: true };
  });

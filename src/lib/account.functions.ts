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

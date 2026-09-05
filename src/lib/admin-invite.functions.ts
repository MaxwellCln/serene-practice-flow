import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { site } from "@/content/site";

export type AdminInvite = {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
};

const INVITE_TTL_HOURS = 48;

function inviteStatus(row: {
  accepted_at: string | null;
  revoked_at: string | null;
  expires_at: string;
}): AdminInvite["status"] {
  if (row.accepted_at) return "accepted";
  if (row.revoked_at) return "revoked";
  if (new Date(row.expires_at) <= new Date()) return "expired";
  return "pending";
}

function safeOrigin(origin: string | undefined) {
  if (!origin) return "";
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

async function assertAdmin(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const listAdminInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInvite[]> => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("admin_invitations")
      .select("id, email, expires_at, created_at, accepted_at, revoked_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      email: row.email as string,
      expiresAt: row.expires_at as string,
      createdAt: row.created_at as string,
      acceptedAt: (row.accepted_at as string | null) ?? null,
      revokedAt: (row.revoked_at as string | null) ?? null,
      status: inviteStatus(row as never),
    }));
  });

export const createAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        origin: z.string().trim().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);

    const email = data.email.toLowerCase();
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { error } = await context.supabase.rpc("create_admin_invite", {
      _email: email,
      _token: token,
      _expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);

    const origin = safeOrigin(data.origin);
    const link = `${origin}/admin-invite?token=${token}`;

    const { sendAdminInviteEmail } = await import("./admin-invite-email.server");
    const result = await sendAdminInviteEmail({
      to: email,
      practiceName: site.shortName,
      link,
      expiresAt,
    });

    return {
      link,
      expiresAt,
      emailSent: result.sent,
      emailReason: result.sent ? null : result.reason,
    };
  });

export const revokeAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("admin_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .is("accepted_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AcceptInviteStatus =
  | "granted"
  | "invalid"
  | "revoked"
  | "already_used"
  | "expired"
  | "email_unconfirmed"
  | "email_mismatch"
  | "not_signed_in";

export const acceptAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().trim().min(20).max(200) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ status: AcceptInviteStatus }> => {
    const { data: result, error } = await context.supabase.rpc("accept_admin_invite", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    return { status: (result as AcceptInviteStatus) ?? "invalid" };
  });

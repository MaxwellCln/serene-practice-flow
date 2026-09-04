import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminBooking = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  amountCents: number;
  currency: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceTitle: string;
};

export type AdminService = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  durationMinutes: number;
  isActive: boolean;
};

export type AdminBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
};

export type AdminData = {
  bookings: AdminBooking[];
  services: AdminService[];
  blocks: AdminBlock[];
};

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

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminData> => {
    await assertAdmin(context as never);
    const supabase = context.supabase;

    const [bookingsRes, servicesRes, blocksRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, starts_at, duration_minutes, status, payment_status, amount_cents, currency, client_name, client_email, client_phone, services(title)",
        )
        .order("starts_at", { ascending: true }),
      supabase
        .from("services")
        .select("id, title, slug, price_cents, currency, duration_minutes, is_active")
        .order("sort_order", { ascending: true }),
      supabase
        .from("availability_blocks")
        .select("id, starts_at, ends_at, reason")
        .order("starts_at", { ascending: true }),
    ]);

    if (bookingsRes.error) throw new Error(bookingsRes.error.message);
    if (servicesRes.error) throw new Error(servicesRes.error.message);
    if (blocksRes.error) throw new Error(blocksRes.error.message);

    return {
      bookings: (bookingsRes.data ?? []).map((b) => ({
        id: b.id as string,
        startsAt: b.starts_at as string,
        durationMinutes: b.duration_minutes as number,
        status: b.status as string,
        paymentStatus: b.payment_status as string,
        amountCents: b.amount_cents as number,
        currency: b.currency as string,
        clientName: b.client_name as string,
        clientEmail: b.client_email as string,
        clientPhone: (b.client_phone as string | null) ?? null,
        serviceTitle: (b as unknown as { services?: { title?: string } }).services?.title ?? "Session",
      })),
      services: (servicesRes.data ?? []).map((s) => ({
        id: s.id as string,
        title: s.title as string,
        slug: s.slug as string,
        priceCents: s.price_cents as number,
        currency: s.currency as string,
        durationMinutes: s.duration_minutes as number,
        isActive: Boolean(s.is_active),
      })),
      blocks: (blocksRes.data ?? []).map((b) => ({
        id: b.id as string,
        startsAt: b.starts_at as string,
        endsAt: b.ends_at as string,
        reason: (b.reason as string) ?? "",
      })),
    };
  });

export const updateBookingAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
        paymentStatus: z.enum(["unpaid", "paid", "invoice_pending", "refunded", "not_required"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const patch: { status?: string; payment_status?: string } = {};
    if (data.status) patch.status = data.status;
    if (data.paymentStatus) patch.payment_status = data.paymentStatus;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase.from("bookings").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setServiceActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("services")
      .update({ is_active: data.isActive })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addAvailabilityBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        startsAt: z.string().min(1),
        endsAt: z.string().min(1),
        reason: z.string().trim().max(120).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const start = new Date(data.startsAt);
    const end = new Date(data.endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return { ok: false, error: "The end time must be after the start time." };
    }
    const { error } = await context.supabase.from("availability_blocks").insert({
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      reason: data.reason || "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAvailabilityBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase.from("availability_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

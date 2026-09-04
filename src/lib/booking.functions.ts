import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { site } from "@/content/site";
import { practiceDateKey, practiceTimeToUtc } from "@/lib/time";

export type Service = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  requires_payment: boolean;
};

export type DayAvailability = {
  date: string;
  label: string;
  slots: { time: string; iso: string }[];
};

export const listServices = createServerFn({ method: "GET" }).handler(async (): Promise<Service[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id, slug, title, description, duration_minutes, price_cents, currency, requires_payment")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
});

export const listAvailability = createServerFn({ method: "GET" }).handler(
  async (): Promise<DayAvailability[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    const earliest = now + site.availability.noticeHours * 3_600_000;
    const horizonEnd = new Date(now + site.availability.horizonDays * 86_400_000);

    const { data: booked, error } = await supabaseAdmin
      .from("bookings")
      .select("starts_at")
      .neq("status", "cancelled")
      .gte("starts_at", new Date(now).toISOString())
      .lte("starts_at", horizonEnd.toISOString());
    if (error) throw new Error(error.message);
    const taken = new Set((booked ?? []).map((b) => new Date(b.starts_at as string).toISOString()));

    const { data: blocks, error: blockError } = await supabaseAdmin
      .from("availability_blocks")
      .select("starts_at, ends_at")
      .gte("ends_at", new Date(now).toISOString())
      .lte("starts_at", horizonEnd.toISOString());
    if (blockError) throw new Error(blockError.message);
    const ranges = (blocks ?? []).map((b) => [
      new Date(b.starts_at as string).getTime(),
      new Date(b.ends_at as string).getTime(),
    ]) as [number, number][];

    const days: DayAvailability[] = [];
    for (let i = 0; i <= site.availability.horizonDays; i++) {
      const day = new Date(now + i * 86_400_000);
      const dateKey = practiceDateKey(day);
      const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
      const rule = site.availability.days.find((d) => d.weekday === weekday);
      if (!rule) continue;

      const slots = rule.times
        .map((time) => ({ time, iso: practiceTimeToUtc(dateKey, time).toISOString() }))
        .filter((s) => {
          const t = new Date(s.iso).getTime();
          if (t <= earliest || taken.has(s.iso)) return false;
          return !ranges.some(([start, end]) => t >= start && t < end);
        });

      if (slots.length > 0) days.push({ date: dateKey, label: rule.label, slots });
    }
    return days;
  },
);

const bookingInput = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateBookingResult = {
  bookingId: string;
  requiresPayment: boolean;
  checkoutUrl?: string;
  error?: string;
};

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bookingInput.parse(data))
  .handler(async ({ data, context }): Promise<CreateBookingResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id, title, duration_minutes, price_cents, currency, requires_payment, is_active")
      .eq("id", data.serviceId)
      .maybeSingle();
    if (serviceError) throw new Error(serviceError.message);
    if (!service || !service.is_active)
      return { bookingId: "", requiresPayment: false, error: "That session type is no longer available." };

    const startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      return { bookingId: "", requiresPayment: false, error: "That time slot is not valid." };
    }
    if (startsAt.getTime() < Date.now() + site.availability.noticeHours * 3_600_000) {
      return { bookingId: "", requiresPayment: false, error: "That time is too soon — please choose a later slot." };
    }

    const { data: blocked } = await supabaseAdmin
      .from("availability_blocks")
      .select("id")
      .lte("starts_at", startsAt.toISOString())
      .gt("ends_at", startsAt.toISOString())
      .maybeSingle();
    if (blocked) {
      return { bookingId: "", requiresPayment: false, error: "That time is no longer available. Please pick another." };
    }

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        service_id: service.id,
        user_id: context.userId,
        starts_at: startsAt.toISOString(),
        duration_minutes: service.duration_minutes,
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone || null,
        notes: data.notes || null,
        status: service.requires_payment ? "pending" : "confirmed",
        payment_status: service.requires_payment ? "unpaid" : "not_required",
        amount_cents: service.price_cents,
        currency: service.currency,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { bookingId: "", requiresPayment: false, error: "Sorry — that slot was just taken. Please pick another." };
      }
      throw new Error(error.message);
    }

    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.name, phone: data.phone || null })
      .eq("id", context.userId);

    return { bookingId: booking.id as string, requiresPayment: Boolean(service.requires_payment) };
  });

export const getBookingSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: booking, error } = await context.supabase
      .from("bookings")
      .select(
        "id, starts_at, duration_minutes, status, payment_status, amount_cents, currency, services(title)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) return null;
    return {
      id: booking.id as string,
      startsAt: booking.starts_at as string,
      durationMinutes: booking.duration_minutes as number,
      status: booking.status as string,
      paymentStatus: booking.payment_status as string,
      amountCents: booking.amount_cents as number,
      currency: booking.currency as string,
      serviceTitle:
        (booking as unknown as { services?: { title?: string } }).services?.title ?? "Session",
    };
  });

export type MyBooking = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  amountCents: number;
  currency: string;
  serviceTitle: string;
};

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyBooking[]> => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, starts_at, duration_minutes, status, payment_status, amount_cents, currency, services(title)",
      )
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((b) => ({
      id: b.id as string,
      startsAt: b.starts_at as string,
      durationMinutes: b.duration_minutes as number,
      status: b.status as string,
      paymentStatus: b.payment_status as string,
      amountCents: b.amount_cents as number,
      currency: b.currency as string,
      serviceTitle: (b as unknown as { services?: { title?: string } }).services?.title ?? "Session",
    }));
  });

export const cancelMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

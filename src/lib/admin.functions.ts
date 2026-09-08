import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { site } from "@/content/site";
import {
  formatPracticeDate,
  formatPracticeTime,
  practiceDateKey,
  practiceTimeToUtc,
} from "@/lib/time";

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
  isOnline: boolean;
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
        .select("id, title, slug, price_cents, currency, duration_minutes, is_active, is_online")
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
        isOnline: Boolean(s.is_online),
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

/** ── Week-ahead availability editing ───────────────────────────── */

export type WeekSlot = {
  iso: string;
  time: string;
  state: "booked" | "open" | "closed" | "past";
  source: "weekly" | "extra";
  clientName?: string;
  bookingStatus?: string;
};

export type WeekDay = {
  date: string;
  label: string;
  slots: WeekSlot[];
};

/** Length of the window closed when an admin removes a single slot (minutes). */
const SLOT_CLOSE_MINUTES = 30;
const WEEK_DAYS = 7;

export const getWeekAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeekDay[]> => {
    await assertAdmin(context as never);
    const supabase = context.supabase;

    const now = Date.now();
    const startIso = new Date(now - 86_400_000).toISOString();
    const endIso = new Date(now + (WEEK_DAYS + 1) * 86_400_000).toISOString();

    const [bookingsRes, blocksRes, extrasRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("starts_at, client_name, status")
        .neq("status", "cancelled")
        .gte("starts_at", startIso)
        .lte("starts_at", endIso),
      supabase.from("availability_blocks").select("starts_at, ends_at").gte("ends_at", startIso),
      supabase
        .from("availability_extras")
        .select("starts_at")
        .gte("starts_at", startIso)
        .lte("starts_at", endIso),
    ]);
    if (bookingsRes.error) throw new Error(bookingsRes.error.message);
    if (blocksRes.error) throw new Error(blocksRes.error.message);
    if (extrasRes.error) throw new Error(extrasRes.error.message);

    const bookedBy = new Map<string, { clientName: string; status: string }>();
    for (const b of bookingsRes.data ?? []) {
      bookedBy.set(new Date(b.starts_at as string).toISOString(), {
        clientName: b.client_name as string,
        status: b.status as string,
      });
    }
    const ranges = (blocksRes.data ?? []).map((b) => [
      new Date(b.starts_at as string).getTime(),
      new Date(b.ends_at as string).getTime(),
    ]) as [number, number][];

    const extrasByDay = new Map<string, string[]>();
    for (const e of extrasRes.data ?? []) {
      const iso = new Date(e.starts_at as string).toISOString();
      const key = practiceDateKey(new Date(iso));
      extrasByDay.set(key, [...(extrasByDay.get(key) ?? []), iso]);
    }

    const days: WeekDay[] = [];
    for (let i = 0; i < WEEK_DAYS; i++) {
      const dateKey = practiceDateKey(new Date(now + i * 86_400_000));
      const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
      const rule = site.availability.days.find((d) => d.weekday === weekday);
      const extras = extrasByDay.get(dateKey) ?? [];

      const seen = new Set<string>();
      const slots: WeekSlot[] = [];
      const candidates: { iso: string; source: "weekly" | "extra" }[] = [
        ...(rule?.times ?? []).map((time) => ({
          iso: practiceTimeToUtc(dateKey, time).toISOString(),
          source: "weekly" as const,
        })),
        ...extras.map((iso) => ({ iso, source: "extra" as const })),
      ];

      for (const c of candidates) {
        if (seen.has(c.iso)) continue;
        seen.add(c.iso);
        const t = new Date(c.iso).getTime();
        const booking = bookedBy.get(c.iso);
        const closed = ranges.some(([start, end]) => t >= start && t < end);
        const state: WeekSlot["state"] = booking
          ? "booked"
          : closed
            ? "closed"
            : t <= now
              ? "past"
              : "open";
        slots.push({
          iso: c.iso,
          time: formatPracticeTime(c.iso),
          state,
          source: c.source,
          ...(booking
            ? { clientName: booking.clientName, bookingStatus: booking.status }
            : {}),
        });
      }

      slots.sort((a, b) => a.iso.localeCompare(b.iso));
      days.push({ date: dateKey, label: formatPracticeDate(`${dateKey}T12:00:00Z`), slots });
    }
    return days;
  });

export const addAvailabilitySlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ date: z.string().min(8), time: z.string().min(4) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const start = practiceTimeToUtc(data.date, data.time);
    if (Number.isNaN(start.getTime())) return { ok: false, error: "That date and time isn't valid." };
    if (start.getTime() <= Date.now()) return { ok: false, error: "Choose a time in the future." };

    const iso = start.toISOString();
    const { data: existing } = await context.supabase
      .from("bookings")
      .select("id")
      .eq("starts_at", iso)
      .neq("status", "cancelled")
      .maybeSingle();
    if (existing) return { ok: false, error: "There is already a session booked at that time." };

    // Re-opening a time that was previously closed off.
    const { data: blocks } = await context.supabase
      .from("availability_blocks")
      .select("id, starts_at, ends_at");
    for (const b of blocks ?? []) {
      const s = new Date(b.starts_at as string).getTime();
      const e = new Date(b.ends_at as string).getTime();
      if (start.getTime() >= s && start.getTime() < e) {
        await context.supabase.from("availability_blocks").delete().eq("id", b.id as string);
      }
    }

    const { error } = await context.supabase
      .from("availability_extras")
      .upsert({ starts_at: iso }, { onConflict: "starts_at" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeAvailabilitySlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ iso: z.string().min(10) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const start = new Date(data.iso);
    if (Number.isNaN(start.getTime())) return { ok: false, error: "That time isn't valid." };

    const { data: booked } = await context.supabase
      .from("bookings")
      .select("id")
      .eq("starts_at", start.toISOString())
      .neq("status", "cancelled")
      .maybeSingle();
    if (booked) {
      return { ok: false, error: "That time has a session booked — cancel the session first." };
    }

    await context.supabase.from("availability_extras").delete().eq("starts_at", start.toISOString());

    const { error } = await context.supabase.from("availability_blocks").insert({
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + SLOT_CLOSE_MINUTES * 60_000).toISOString(),
      reason: "Single time closed",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reopenAvailabilitySlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ iso: z.string().min(10) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const start = new Date(data.iso);
    if (Number.isNaN(start.getTime())) return { ok: false, error: "That time isn't valid." };
    const t = start.getTime();

    const { data: blocks, error } = await context.supabase
      .from("availability_blocks")
      .select("id, starts_at, ends_at, reason");
    if (error) throw new Error(error.message);

    for (const b of blocks ?? []) {
      const s = new Date(b.starts_at as string).getTime();
      const e = new Date(b.ends_at as string).getTime();
      if (t < s || t >= e) continue;
      if (s >= t && e <= t + SLOT_CLOSE_MINUTES * 60_000) {
        await context.supabase.from("availability_blocks").delete().eq("id", b.id as string);
      } else {
        // Part of a longer time-off period: trim it around this slot.
        await context.supabase
          .from("availability_blocks")
          .update({ ends_at: new Date(t).toISOString() })
          .eq("id", b.id as string);
        const tail = t + SLOT_CLOSE_MINUTES * 60_000;
        if (e > tail) {
          await context.supabase.from("availability_blocks").insert({
            starts_at: new Date(tail).toISOString(),
            ends_at: new Date(e).toISOString(),
            reason: (b.reason as string) ?? "",
          });
        }
      }
    }
    return { ok: true };
  });

/** ── Booking communications settings ───────────────────────────── */

export type AdminSettings = {
  notificationEmail: string;
  meetingLink: string;
  meetingNote: string;
  /** True when a verified sending domain is configured, so email can go out. */
  emailConfigured: boolean;
};

export const getPracticeSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSettings> => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("practice_settings")
      .select("notification_email, meeting_link, meeting_note")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { emailDeliveryConfigured } = await import("@/lib/booking-email.server");
    return {
      notificationEmail: (data?.notification_email as string) ?? "",
      meetingLink: (data?.meeting_link as string) ?? "",
      meetingNote: (data?.meeting_note as string) ?? "",
      emailConfigured: emailDeliveryConfigured(),
    };
  });

export const updatePracticeSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        notificationEmail: z.string().trim().max(255).email().or(z.literal("")),
        meetingLink: z.string().trim().max(600),
        meetingNote: z.string().trim().max(300),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    if (data.meetingLink) {
      const { safeMeetingLink } = await import("@/lib/booking-email.server");
      if (!safeMeetingLink(data.meetingLink)) {
        return { ok: false, error: "The meeting link must be a full https:// address." };
      }
    }
    const { error } = await context.supabase
      .from("practice_settings")
      .update({
        notification_email: data.notificationEmail.toLowerCase(),
        meeting_link: data.meetingLink,
        meeting_note: data.meetingNote,
      })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setServiceOnline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), isOnline: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("services")
      .update({ is_online: data.isOnline })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

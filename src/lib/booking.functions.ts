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

    const { data: extras, error: extraError } = await supabaseAdmin
      .from("availability_extras")
      .select("starts_at")
      .gte("starts_at", new Date(now).toISOString())
      .lte("starts_at", horizonEnd.toISOString());
    if (extraError) throw new Error(extraError.message);
    const extraByDay = new Map<string, string[]>();
    for (const e of extras ?? []) {
      const iso = new Date(e.starts_at as string).toISOString();
      const key = practiceDateKey(new Date(iso));
      extraByDay.set(key, [...(extraByDay.get(key) ?? []), iso]);
    }

    const days: DayAvailability[] = [];
    for (let i = 0; i <= site.availability.horizonDays; i++) {
      const day = new Date(now + i * 86_400_000);
      const dateKey = practiceDateKey(day);
      const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
      const rule = site.availability.days.find((d) => d.weekday === weekday);
      const extraIsos = extraByDay.get(dateKey) ?? [];
      if (!rule && extraIsos.length === 0) continue;

      const candidates = [
        ...(rule?.times ?? []).map((time) => ({
          time,
          iso: practiceTimeToUtc(dateKey, time).toISOString(),
        })),
        ...extraIsos.map((iso) => ({ time: formatPracticeTime(iso), iso })),
      ];
      const seen = new Set<string>();
      const slots = candidates
        .filter((s) => {
          if (seen.has(s.iso)) return false;
          seen.add(s.iso);
          const t = new Date(s.iso).getTime();
          if (t <= earliest || taken.has(s.iso)) return false;
          return !ranges.some(([start, end]) => t >= start && t < end);
        })
        .sort((a, b) => a.iso.localeCompare(b.iso));

      if (slots.length > 0)
        days.push({ date: dateKey, label: rule?.label ?? formatPracticeDate(`${dateKey}T12:00:00Z`), slots });
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
  origin: z.string().trim().max(300).optional(),
});

/** Only accept a well-formed absolute origin for links inside emails. */
function safeOrigin(origin: string | undefined) {
  if (!origin) return "";
  try {
    return new URL(origin).origin;
  } catch {
    return "";
  }
}

export type CreateBookingResult = {
  bookingId: string;
  requiresPayment: boolean;
  checkoutUrl?: string;
  error?: string;
  emailSent?: boolean;
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

    // Confirmation and practice notification go out once the booking is
    // confirmed. Paid sessions are confirmed after payment succeeds.
    let emailSent = false;
    if (!service.requires_payment) {
      const { notifyBookingConfirmed } = await import("@/lib/booking-notify.server");
      const outcome = await notifyBookingConfirmed(booking.id as string, {
        ...(data.origin ? { origin: safeOrigin(data.origin) } : {}),
      });
      emailSent = outcome.clientEmailSent;
    }

    return {
      bookingId: booking.id as string,
      requiresPayment: Boolean(service.requires_payment),
      emailSent,
    };
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

/** Clients may change a booking online only outside this window. */
export const CHANGE_CUTOFF_HOURS = 24;

export type ChangeResult = {
  ok: boolean;
  error?: string;
  emailSent?: boolean;
};

async function loadOwnBooking(supabase: SupabaseLike, id: string, userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, duration_minutes, status, client_name, client_email, service_id, services(title, is_online)",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as BookingRow | null;
}

type BookingRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
  client_name: string;
  client_email: string;
  service_id: string;
  services?: { title?: string; is_online?: boolean } | null;
};

type SupabaseLike = { from: (table: string) => any };

const tooLateMessage = `Sessions can only be changed online more than ${CHANGE_CUTOFF_HOURS} hours in advance. Please contact the practice on ${site.phone} or ${site.email}.`;

async function notifyBooking(
  kind: "confirmation" | "cancellation" | "reschedule",
  args: {
    to: string;
    clientName: string;
    serviceTitle: string;
    startsAt: string;
    durationMinutes: number;
    isOnline?: boolean;
    origin?: string;
    previousStartsAt?: string;
  },
) {
  const { sendBookingEmail, safeMeetingLink } = await import("@/lib/booking-email.server");
  const { loadPracticeSettings } = await import("@/lib/booking-notify.server");
  const settings = await loadPracticeSettings();
  const meetingLink = args.isOnline ? safeMeetingLink(settings.meetingLink) : "";
  const result = await sendBookingEmail(args.to, {
    kind,
    practiceName: site.practiceName,
    clientName: args.clientName,
    serviceTitle: args.serviceTitle,
    startsAt: args.startsAt,
    durationMinutes: args.durationMinutes,
    location: site.location,
    manageUrl: args.origin ? `${args.origin}/account` : "",
    practiceEmail: site.email,
    practicePhone: site.phone,
    ...(meetingLink ? { meetingLink } : {}),
    ...(meetingLink && settings.meetingNote ? { meetingNote: settings.meetingNote } : {}),
    ...(args.previousStartsAt ? { previousStartsAt: args.previousStartsAt } : {}),
  });
  return result.sent;
}

export const cancelMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), origin: z.string().trim().max(300).optional() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ChangeResult> => {
    const booking = await loadOwnBooking(context.supabase, data.id, context.userId);
    if (!booking) return { ok: false, error: "We couldn't find that booking." };
    if (booking.status === "cancelled") return { ok: true };

    // Server-side cutoff: never rely on the UI alone.
    if (new Date(booking.starts_at).getTime() - Date.now() < CHANGE_CUTOFF_HOURS * 3_600_000) {
      return { ok: false, error: tooLateMessage };
    }

    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const emailSent = await notifyBooking("cancellation", {
      to: booking.client_email,
      clientName: booking.client_name,
      serviceTitle: booking.services?.title ?? "Session",
      startsAt: booking.starts_at,
      durationMinutes: booking.duration_minutes,
      isOnline: Boolean(booking.services?.is_online),
      ...(data.origin ? { origin: safeOrigin(data.origin) } : {}),
    });

    return { ok: true, emailSent };
  });

export const rescheduleMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        startsAt: z.string().min(1),
        origin: z.string().trim().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ChangeResult> => {
    const booking = await loadOwnBooking(context.supabase, data.id, context.userId);
    if (!booking) return { ok: false, error: "We couldn't find that booking." };
    if (booking.status === "cancelled") {
      return { ok: false, error: "That booking has been cancelled — please book a new session." };
    }

    const now = Date.now();
    if (new Date(booking.starts_at).getTime() - now < CHANGE_CUTOFF_HOURS * 3_600_000) {
      return { ok: false, error: tooLateMessage };
    }

    const next = new Date(data.startsAt);
    if (Number.isNaN(next.getTime())) return { ok: false, error: "That time slot is not valid." };
    if (next.getTime() - now < CHANGE_CUTOFF_HOURS * 3_600_000) {
      return { ok: false, error: "Please choose a time at least 24 hours from now." };
    }
    if (next.getTime() > now + site.availability.horizonDays * 86_400_000) {
      return { ok: false, error: "Please choose a time within the next few weeks." };
    }

    // The new time must be a real slot on the practice's weekly schedule.
    const dateKey = practiceDateKey(next);
    const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
    const rule = site.availability.days.find((d) => d.weekday === weekday);
    const isScheduled = rule?.times.some(
      (time) => practiceTimeToUtc(dateKey, time).getTime() === next.getTime(),
    );
    if (!isScheduled) return { ok: false, error: "That time isn't available. Please pick another." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: blocked } = await supabaseAdmin
      .from("availability_blocks")
      .select("id")
      .lte("starts_at", next.toISOString())
      .gt("ends_at", next.toISOString())
      .maybeSingle();
    if (blocked) return { ok: false, error: "That time isn't available. Please pick another." };

    const { error } = await context.supabase
      .from("bookings")
      .update({ starts_at: next.toISOString() })
      .eq("id", data.id);
    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Sorry — that slot was just taken. Please pick another." };
      }
      throw new Error(error.message);
    }

    const emailSent = await notifyBooking("reschedule", {
      to: booking.client_email,
      clientName: booking.client_name,
      serviceTitle: booking.services?.title ?? "Session",
      startsAt: next.toISOString(),
      durationMinutes: booking.duration_minutes,
      isOnline: Boolean(booking.services?.is_online),
      previousStartsAt: booking.starts_at,
      ...(data.origin ? { origin: safeOrigin(data.origin) } : {}),
    });

    return { ok: true, emailSent };
  });

/**
 * Server-only orchestration of booking communications: the client's
 * confirmation and the practice's new-booking notification.
 *
 * Everything here degrades honestly — if no verified sending domain, no
 * notification address, or no meeting link is configured, the caller learns
 * exactly what did not happen instead of being told an email was sent.
 */

import { site } from "@/content/site";
import {
  safeMeetingLink,
  sendAdminBookingEmail,
  sendBookingEmail,
  type BookingEmailKind,
} from "@/lib/booking-email.server";
import { formatMoney } from "@/lib/time";

export type PracticeSettings = {
  notificationEmail: string;
  meetingLink: string;
  meetingNote: string;
};

export async function loadPracticeSettings(): Promise<PracticeSettings> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("practice_settings")
    .select("notification_email, meeting_link, meeting_note")
    .maybeSingle();
  return {
    notificationEmail: ((data?.notification_email as string) ?? "").trim(),
    meetingLink: ((data?.meeting_link as string) ?? "").trim(),
    meetingNote: ((data?.meeting_note as string) ?? "").trim(),
  };
}

export type NotifyOutcome = {
  clientEmailSent: boolean;
  adminEmailSent: boolean;
  /** True when the session is online but no meeting link is configured yet. */
  meetingLinkMissing: boolean;
  /** True when no practice notification address is configured yet. */
  notificationEmailMissing: boolean;
};

/**
 * Sends the client confirmation and (for new bookings) the practice
 * notification for a booking that is now confirmed.
 */
export async function notifyBookingConfirmed(
  bookingId: string,
  options: { origin?: string; kind?: BookingEmailKind; notifyAdmin?: boolean } = {},
): Promise<NotifyOutcome> {
  const kind = options.kind ?? "confirmation";
  const notifyAdmin = options.notifyAdmin ?? kind === "confirmation";
  const origin = options.origin ?? "";

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, starts_at, duration_minutes, client_name, client_email, client_phone, payment_status, amount_cents, currency, services(title, is_online)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  const outcome: NotifyOutcome = {
    clientEmailSent: false,
    adminEmailSent: false,
    meetingLinkMissing: false,
    notificationEmailMissing: false,
  };
  if (!booking) return outcome;

  const service = (booking as unknown as { services?: { title?: string; is_online?: boolean } })
    .services;
  const isOnline = Boolean(service?.is_online);
  const settings = await loadPracticeSettings();
  const meetingLink = isOnline ? safeMeetingLink(settings.meetingLink) : "";
  outcome.meetingLinkMissing = isOnline && !meetingLink;

  const clientResult = await sendBookingEmail(booking.client_email as string, {
    kind,
    practiceName: site.practiceName,
    clientName: booking.client_name as string,
    serviceTitle: service?.title ?? "Session",
    startsAt: booking.starts_at as string,
    durationMinutes: booking.duration_minutes as number,
    location: site.location,
    manageUrl: origin ? `${origin}/account` : "",
    practiceEmail: site.email,
    practicePhone: site.phone,
    ...(meetingLink ? { meetingLink } : {}),
    ...(meetingLink && settings.meetingNote ? { meetingNote: settings.meetingNote } : {}),
  });
  outcome.clientEmailSent = clientResult.sent;

  if (notifyAdmin) {
    if (!settings.notificationEmail) {
      outcome.notificationEmailMissing = true;
    } else {
      const adminResult = await sendAdminBookingEmail(settings.notificationEmail, {
        practiceName: site.practiceName,
        clientName: booking.client_name as string,
        clientEmail: booking.client_email as string,
        clientPhone: (booking.client_phone as string | null) ?? null,
        serviceTitle: service?.title ?? "Session",
        startsAt: booking.starts_at as string,
        durationMinutes: booking.duration_minutes as number,
        location: site.location,
        paymentStatus: String(booking.payment_status),
        amountLabel: formatMoney(
          (booking.amount_cents as number) ?? 0,
          (booking.currency as string) ?? "EUR",
        ),
        ...(meetingLink ? { meetingLink } : {}),
        ...(origin ? { adminUrl: `${origin}/admin` } : {}),
      });
      outcome.adminEmailSent = adminResult.sent;
    }
  }

  return outcome;
}

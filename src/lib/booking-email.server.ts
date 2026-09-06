/**
 * Server-only rendering + sending of booking emails (confirmation, cancellation,
 * reschedule).
 *
 * Lovable email sending requires a verified custom sending domain. Until one is
 * configured we never pretend an email was sent — callers surface the honest
 * status to the client and to the practice.
 */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type BookingEmailKind = "confirmation" | "cancellation" | "reschedule";

export type BookingEmailDetails = {
  kind: BookingEmailKind;
  practiceName: string;
  clientName: string;
  serviceTitle: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  manageUrl: string;
  practiceEmail: string;
  practicePhone: string;
  previousStartsAt?: string;
};

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-IE", {
    timeZone: "Europe/Dublin",
    dateStyle: "full",
    timeStyle: "short",
  });

export function renderBookingEmail(d: BookingEmailDetails) {
  const when = formatWhen(d.startsAt);
  const headline =
    d.kind === "confirmation"
      ? "Your session is booked"
      : d.kind === "cancellation"
        ? "Your session has been cancelled"
        : "Your session has been moved";

  const subject =
    d.kind === "confirmation"
      ? `Session confirmed — ${when} · ${d.practiceName}`
      : d.kind === "cancellation"
        ? `Session cancelled — ${when} · ${d.practiceName}`
        : `Session rescheduled — ${when} · ${d.practiceName}`;

  const intro =
    d.kind === "confirmation"
      ? "Thank you for booking. Here are the details of your session."
      : d.kind === "cancellation"
        ? "This session has been cancelled. Nothing further is needed from you."
        : d.previousStartsAt
          ? `Your session has been moved from ${formatWhen(d.previousStartsAt)}.`
          : "Your session has been moved to a new time.";

  const rows: [string, string][] = [
    ["Session", d.serviceTitle],
    ["When", `${when} (${d.durationMinutes} minutes)`],
    ["Where", d.location],
  ];

  const text = [
    `Hello ${d.clientName},`,
    "",
    intro,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    d.manageUrl ? `Manage your booking: ${d.manageUrl}` : "",
    "",
    "Changes are possible online up to 24 hours before your session.",
    `Inside 24 hours, please contact us directly: ${d.practiceEmail} · ${d.practicePhone}`,
    "",
    d.practiceName,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /></head>
<body style="margin:0;background-color:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#2f2a25;">
  <div style="max-width:560px;margin:0 auto;padding:32px 28px;">
    <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px;">${escapeHtml(headline)}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Hello ${escapeHtml(d.clientName)},<br />${escapeHtml(intro)}</p>
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;color:#6b635a;width:110px;">${escapeHtml(k)}</td><td style="padding:8px 0;">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    ${
      d.manageUrl
        ? `<p style="margin:26px 0;"><a href="${escapeHtml(d.manageUrl)}" style="display:inline-block;background-color:#5b6b4f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-family:Arial,sans-serif;">Manage your booking</a></p>`
        : ""
    }
    <p style="font-size:14px;line-height:1.6;color:#6b635a;margin:0 0 8px;">
      You can change or cancel online up to 24 hours before your session.
      Inside 24 hours, please contact us directly.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6b635a;margin:0;">
      ${escapeHtml(d.practiceEmail)} · ${escapeHtml(d.practicePhone)}<br />${escapeHtml(d.practiceName)}
    </p>
  </div>
</body></html>`;

  return { subject, html, text };
}

export type BookingEmailResult =
  | { sent: true }
  | { sent: false; reason: "email_not_configured" | "send_failed"; detail?: string };

export async function sendBookingEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<BookingEmailResult> {
  const senderDomain = process.env["EMAIL_SENDER_DOMAIN"];
  const apiKey = process.env["LOVABLE_API_KEY"];

  if (!senderDomain || !apiKey) {
    return { sent: false, reason: "email_not_configured" };
  }

  const { subject, html, text } = renderBookingEmail(details);

  try {
    const response = await fetch("https://email.lovable.dev/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `"${details.practiceName}" <noreply@${senderDomain}>`,
        sender_domain: senderDomain,
        to,
        subject,
        html,
        text,
        purpose: "transactional",
        label: `booking-${details.kind}`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[booking-email] send failed [${response.status}]: ${detail}`);
      return { sent: false, reason: "send_failed", detail: `${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[booking-email] send error", error);
    return { sent: false, reason: "send_failed" };
  }
}

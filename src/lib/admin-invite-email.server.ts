/**
 * Server-only rendering + sending of the admin invitation email.
 *
 * Lovable email sending requires a verified custom sending domain. Until one is
 * configured we never pretend an email was sent — the caller falls back to
 * showing a copyable invite link in the dashboard.
 */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderAdminInviteEmail(options: {
  practiceName: string;
  link: string;
  expiresAt: string;
}) {
  const { practiceName, link, expiresAt } = options;
  const expires = new Date(expiresAt).toLocaleString("en-IE", {
    timeZone: "Europe/Dublin",
    dateStyle: "long",
    timeStyle: "short",
  });

  const subject = `Your practice dashboard invitation — ${practiceName}`;

  const text = [
    `You have been invited to manage the ${practiceName} practice dashboard.`,
    "",
    `Open this link while signed in with this email address: ${link}`,
    "",
    `The link can only be used once and expires on ${expires}.`,
    "If you did not expect this invitation, you can ignore this email.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /></head>
<body style="margin:0;background-color:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#2f2a25;">
  <div style="max-width:560px;margin:0 auto;padding:32px 28px;">
    <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px;">Practice dashboard invitation</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      You have been invited to manage bookings and availability for
      ${escapeHtml(practiceName)}.
    </p>
    <p style="margin:24px 0;">
      <a href="${escapeHtml(link)}"
         style="display:inline-block;background-color:#5b6b4f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-family:Arial,sans-serif;">
        Accept invitation
      </a>
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6b635a;margin:0 0 8px;">
      Sign in (or create an account) with this email address first — the invitation
      only works for a confirmed, matching email.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6b635a;margin:0;">
      It can be used once and expires on ${escapeHtml(expires)}. If you were not
      expecting this, you can safely ignore this email.
    </p>
  </div>
</body></html>`;

  return { subject, html, text };
}

export type InviteEmailResult =
  | { sent: true }
  | { sent: false; reason: "email_not_configured" | "send_failed"; detail?: string };

export async function sendAdminInviteEmail(options: {
  to: string;
  practiceName: string;
  link: string;
  expiresAt: string;
}): Promise<InviteEmailResult> {
  const senderDomain = process.env["EMAIL_SENDER_DOMAIN"];
  const apiKey = process.env["LOVABLE_API_KEY"];

  if (!senderDomain || !apiKey) {
    return { sent: false, reason: "email_not_configured" };
  }

  const { subject, html, text } = renderAdminInviteEmail(options);

  try {
    const response = await fetch("https://email.lovable.dev/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${options.practiceName} <noreply@${senderDomain}>`,
        sender_domain: senderDomain,
        to: options.to,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "admin-invite",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[admin-invite] email send failed [${response.status}]: ${detail}`);
      return { sent: false, reason: "send_failed", detail: `${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[admin-invite] email send error", error);
    return { sent: false, reason: "send_failed" };
  }
}

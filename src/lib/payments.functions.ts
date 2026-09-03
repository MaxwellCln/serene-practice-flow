import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STRIPE_API = "https://api.stripe.com/v1";

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

/**
 * Creates a Stripe Checkout session for a pending booking.
 * If no STRIPE_SECRET_KEY is configured yet, returns "unconfigured" so the
 * booking flow can fall back to paying by invoice before the first session.
 */
export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ bookingId: z.string().uuid(), origin: z.string().url() }).parse(data),
  )
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, amount_cents, currency, client_email, payment_status, services(title)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) return { status: "error", message: "Booking not found." };
    if (booking.payment_status === "paid") return { status: "error", message: "Already paid." };

    if (!secretKey) {
      await supabaseAdmin
        .from("bookings")
        .update({ status: "confirmed", payment_status: "invoice_pending" })
        .eq("id", booking.id);
      return { status: "unconfigured" };
    }

    const title =
      (booking as unknown as { services?: { title?: string } }).services?.title ?? "Therapy session";
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": String(booking.currency).toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(booking.amount_cents),
      "line_items[0][price_data][product_data][name]": title,
      customer_email: String(booking.client_email),
      client_reference_id: String(booking.id),
      success_url: `${data.origin}/booking/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/booking/${booking.id}?cancelled=1`,
    });

    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) {
      console.error("Stripe checkout failed", await response.text());
      return { status: "error", message: "We couldn't open the payment page. Please try again." };
    }
    const session = (await response.json()) as { id: string; url?: string };
    await supabaseAdmin
      .from("bookings")
      .update({ payment_reference: session.id })
      .eq("id", booking.id);
    if (!session.url) return { status: "error", message: "Payment page unavailable." };
    return { status: "redirect", url: session.url };
  });

/** Verifies a returning Stripe Checkout session and marks the booking paid. */
export const confirmCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ bookingId: z.string().uuid(), sessionId: z.string().min(1).max(255) }).parse(data),
  )
  .handler(async ({ data }) => {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) return { paid: false };

    const response = await fetch(`${STRIPE_API}/checkout/sessions/${data.sessionId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) return { paid: false };
    const session = (await response.json()) as {
      payment_status?: string;
      client_reference_id?: string;
    };
    if (session.payment_status !== "paid" || session.client_reference_id !== data.bookingId) {
      return { paid: false };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed", payment_status: "paid", payment_reference: data.sessionId })
      .eq("id", data.bookingId);
    return { paid: true };
  });

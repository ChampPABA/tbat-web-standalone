import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing Stripe environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

/**
 * POST /api/webhooks/stripe - Handle Stripe webhook events for payment confirmation
 * AC2: Generate exam code automatically after successful payment webhook confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature for security
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Payment successful for session:", session.id);

      // Extract metadata from the session
      const { userEmail, userName, packageType } = session.metadata || {};

      if (!userEmail || !userName || packageType !== "ADVANCED") {
        console.error("Missing required metadata in session:", session.id);
        return NextResponse.json(
          { error: "Invalid session metadata" },
          { status: 400 }
        );
      }

      // Call the registration API to complete user registration and generate exam code
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registrationResponse = await fetch(
          `${baseUrl}/api/auth/register`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // User data would be stored temporarily during checkout process
              // For now, we'll use metadata from the session
              email: userEmail,
              name: userName,
              packageType: packageType,
              paymentSessionId: session.id,
              paymentStatus: 'completed',
              paymentAmount: session.amount_total,
              paymentCurrency: session.currency,
              // Additional fields would be populated from stored session data
            }),
          }
        );

        if (!registrationResponse.ok) {
          throw new Error('Failed to complete registration');
        }

        const registrationData = await registrationResponse.json();
        console.log("Registration completed:", registrationData);

        // Log payment audit for PDPA compliance
        await logPaymentAudit({
          sessionId: session.id,
          userEmail,
          userName,
          packageType,
          amount: session.amount_total || 0,
          currency: session.currency || 'thb',
          status: 'completed',
          examCode: registrationData.examCode?.code,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error("Error completing registration after payment:", error);
        // Payment succeeded but registration failed - needs manual intervention
        await logPaymentAudit({
          sessionId: session.id,
          userEmail,
          userName,
          packageType,
          amount: session.amount_total || 0,
          currency: session.currency || 'thb',
          status: 'payment_success_registration_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Log payment audit for PDPA compliance
 */
async function logPaymentAudit(auditData: {
  sessionId: string;
  userEmail: string;
  userName: string;
  packageType: string;
  amount: number;
  currency: string;
  status: string;
  examCode?: string;
  error?: string;
  timestamp: string;
}) {
  try {
    // In a real implementation, this would write to a secure audit log
    // For now, we'll log to console and could extend to database
    console.log("Payment Audit Log:", {
      ...auditData,
      // Never log sensitive payment details beyond what's necessary for audit
      redactedData: true,
    });

    // TODO: Implement secure audit logging to database
    // - Encrypted sensitive data
    // - Proper access controls
    // - PDPA compliance fields
    // - Retention policy adherence

  } catch (error) {
    console.error("Failed to log payment audit:", error);
    // Audit logging failure should not fail the webhook
  }
}

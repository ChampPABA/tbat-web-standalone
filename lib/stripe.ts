import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initialize Stripe with Thai Baht support
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

// Price configuration in satangs (smallest THB unit)
export const PRICES = {
  ADVANCED_PACKAGE: 69000, // 690 THB
  POST_EXAM_UPGRADE: 29000, // 290 THB
};

// Create payment intent for Thai Baht transactions
export async function createPaymentIntent(
  userId: string,
  packageType: "ADVANCED_PACKAGE" | "POST_EXAM_UPGRADE"
) {
  const amount = PRICES[packageType];

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "thb",
      metadata: {
        userId,
        packageType,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment record in database
    await prisma.payment.create({
      data: {
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: "thb",
        paymentType: packageType,
        status: "PENDING",
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to create payment intent");
  }
}

// Handle successful payment
export async function handlePaymentSuccess(paymentIntentId: string) {
  try {
    // Update payment status in database
    const payment = await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    // Update user package type if payment successful
    if (payment.paymentType === "ADVANCED_PACKAGE") {
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          packageType: "ADVANCED",
          isUpgraded: false,
        },
      });
    } else if (payment.paymentType === "POST_EXAM_UPGRADE") {
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          packageType: "ADVANCED",
          isUpgraded: true,
        },
      });
    }

    return payment;
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw new Error("Failed to process payment");
  }
}

// Handle payment failure
export async function handlePaymentFailure(paymentIntentId: string) {
  try {
    const payment = await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      data: {
        status: "FAILED",
      },
    });

    return payment;
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw new Error("Failed to update payment status");
  }
}

// Process refund
export async function processRefund(paymentIntentId: string, reason?: string) {
  try {
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        reason: reason || "Customer requested refund",
      },
    });

    // Update payment status in database
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      data: {
        status: "REFUNDED",
      },
    });

    return refund;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw new Error("Failed to process refund");
  }
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    throw new Error("Invalid webhook signature");
  }
}

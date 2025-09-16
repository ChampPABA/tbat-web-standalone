import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * POST /api/payment/create-checkout-session - Create checkout session for Advanced package
 * Supports both Mock mode and Stripe mode based on NEXT_PUBLIC_PAYMENT_MODE
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, userName, packageType, password, phoneNumber, lineid, school, grade, sessionTime, nationalId } = body;

    // Validate required fields
    if (!userEmail || !userName || packageType !== "ADVANCED") {
      return NextResponse.json(
        { error: "Missing required fields or invalid package type" },
        { status: 400 }
      );
    }

    const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "mock";

    // Mock Payment Mode for Testing
    if (paymentMode === "mock") {
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      const mockSessionId = `mock_session_${Date.now()}`;

      console.log("🎭 Mock Payment Mode - Creating mock checkout session");
      console.log(`📧 User: ${userName} (${userEmail})`);
      console.log(`💰 Amount: ฿690 (Mock)`);

      try {
        // Process mock payment registration using existing registration API
        const registrationResponse = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            password: password,
            name: userName,
            thaiName: userName,
            phoneNumber: phoneNumber?.replace(/[- ]/g, ''),
            lineid: lineid,
            school: school,
            grade: grade,
            nationalId: nationalId,
            pdpaConsent: true,
            packageType: 'ADVANCED',
            sessionTime: sessionTime,
            paymentSessionId: mockSessionId, // Mock payment session ID
            paymentStatus: 'completed', // Mock payment status
          }),
        });

        if (!registrationResponse.ok) {
          const errorData = await registrationResponse.json();
          // Handle specific error codes with appropriate messages
          if (registrationResponse.status === 409) {
            return NextResponse.json(
              { error: errorData.error || "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" },
              { status: 409 }
            );
          }
          throw new Error(errorData.error || 'Registration failed');
        }

        const registrationResult = await registrationResponse.json();

        return NextResponse.json({
          success: true,
          sessionId: mockSessionId,
          url: `${baseUrl}/register/email-confirmation?session_id=${mockSessionId}&mock=true&exam_code=${registrationResult.examCode?.code}`,
          mode: "mock",
          examCode: registrationResult.examCode?.code
        });
      } catch (error) {
        console.error("Mock registration error:", error);
        return NextResponse.json(
          { error: `การลงทะเบียนล้มเหลว: ${error instanceof Error ? error.message : 'กรุณาลองใหม่อีกครั้ง'}` },
          { status: 500 }
        );
      }
    }

    // Real Stripe Mode
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured. Please set STRIPE_SECRET_KEY or use mock mode." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Create Stripe checkout session for Thai Baht (฿690)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Stripe automatically configures Thai payment methods in dashboard
      line_items: [
        {
          price_data: {
            currency: 'thb', // Thai Baht
            product_data: {
              name: 'TBAT Mock Exam - Advanced Package',
              description: 'แพ็กเกจขั้นสูง: สอบได้ทุกวิชา พร้อมเฉลยโดยละเอียด',
            },
            unit_amount: 69000, // ฿690.00 in satang (Thai Baht subunit)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/register/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/register/payment-cancelled`,
      customer_email: userEmail,
      metadata: {
        userEmail: userEmail,
        userName: userName,
        packageType: packageType,
        examDate: '2025-09-15', // Fixed exam date as per story requirements
      },
      // Enable Thai payment methods via Stripe Dashboard
      payment_method_options: {
        card: {
          setup_future_usage: undefined, // One-time payment only
        },
      },
      // Localization for Thai users
      locale: 'th',
      // Compliance and audit
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    // Return Thai error messages as specified in story requirements
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "ระบบการชำระเงินขัดข้อง กรุณาลองใหม่อีกครั้ง",
          code: error.code
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
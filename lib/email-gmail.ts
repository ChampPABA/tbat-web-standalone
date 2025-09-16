import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // This is NOT your Gmail password!
  },
});

// Email service availability check for Gmail
export function isEmailServiceAvailable(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// Email templates (same as before)
export const emailTemplates = {
  registration: {
    subject: "ยินดีต้อนรับสู่ TBAT Mock Exam - ลงทะเบียนสำเร็จ",
    html: (data: { name: string; email: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ยินดีต้อนรับ</title>
        </head>
        <body style="font-family: 'Noto Sans Thai', sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
            <h1 style="color: #2d3748; margin-bottom: 20px;">สวัสดีคุณ ${data.name}</h1>
            <p style="color: #4a5568; line-height: 1.6;">
              ขอบคุณที่ลงทะเบียนกับ TBAT Mock Exam Platform
            </p>
            <p style="color: #4a5568; line-height: 1.6;">
              อีเมล: ${data.email}<br>
              คุณสามารถเข้าสู่ระบบและเริ่มทำข้อสอบได้ทันที
            </p>
          </div>
        </body>
      </html>
    `,
  },
};

// Send email function using Gmail SMTP
export async function sendEmail(
  toOrParams: string | { to: string; subject: string; html: string },
  template?: keyof typeof emailTemplates,
  data?: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Check if email service is available
    if (!isEmailServiceAvailable()) {
      console.warn("Gmail SMTP not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
      return {
        success: false,
        error: "Gmail SMTP not configured"
      };
    }

    let emailData: { from: string; to: string; subject: string; html: string };

    if (typeof toOrParams === 'object') {
      // Direct email sending
      emailData = {
        from: process.env.GMAIL_USER!,
        to: toOrParams.to,
        subject: toOrParams.subject,
        html: toOrParams.html,
      };
    } else if (template) {
      // Template-based email sending
      const emailTemplate = emailTemplates[template];
      emailData = {
        from: process.env.GMAIL_USER!,
        to: toOrParams,
        subject: emailTemplate.subject,
        html: emailTemplate.html(data),
      };
    } else {
      throw new Error("Invalid parameters for sendEmail");
    }

    console.log('📧 [GMAIL SMTP] Sending email:');
    console.log(`   From: ${emailData.from}`);
    console.log(`   To: ${emailData.to}`);
    console.log(`   Subject: ${emailData.subject}`);

    const result = await transporter.sendMail(emailData);

    console.log('✅ Email sent successfully via Gmail SMTP');
    console.log(`   Message ID: ${result.messageId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Gmail SMTP error:", error);
    return { success: false, error };
  }
}

// Send bulk emails
export async function sendBulkEmails(
  recipients: string[],
  template: keyof typeof emailTemplates,
  data: any
) {
  const results = await Promise.allSettled(
    recipients.map((email) => sendEmail(email, template, data))
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return {
    total: recipients.length,
    successful,
    failed,
  };
}

// Queue email for retry
export async function queueEmail(
  to: string,
  template: keyof typeof emailTemplates,
  data: any,
  retries = 3
) {
  let attempt = 0;
  let lastError;

  while (attempt < retries) {
    const result = await sendEmail(to, template, data);

    if (result.success) {
      return result;
    }

    lastError = result.error;
    attempt++;

    // Exponential backoff
    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
  }

  console.error(`Failed to send email after ${retries} attempts:`, lastError);
  return { success: false, error: lastError };
}
import nodemailer from "nodemailer";
import { formatNationalIdForEmail } from "./national-id-display";

// Initialize Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Email service availability check
export function isEmailServiceAvailable(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// Email templates
export const emailTemplates = {
  registration: {
    subject: "การลงทะเบียนสำเร็จ - TBAT Mock Exam @ChiangMai",
    html: (data: { name: string; email: string; packageType: string; examCode: string; sessionTime?: string; phone?: string; lineId?: string; school?: string; grade?: string; nickname?: string; nationalId?: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>การลงทะเบียนสำเร็จ</title>
        </head>
        <body style="font-family: 'Noto Sans Thai', sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
            <h1 style="color: #0d7276; margin-bottom: 20px; text-align: center;">🎉 การลงทะเบียนสำเร็จ</h1>

            <div style="background-color: #f0fdff; padding: 20px; border-radius: 8px; border-left: 4px solid #0d7276; margin-bottom: 20px;">
              <p style="color: #2d3748; font-size: 18px; margin: 0;">
                สวัสดีคุณ <strong>${data.name}</strong>
              </p>
            </div>

            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
              ขอบคุณที่ลงทะเบียนกับ <strong>TBAT Mock Exam @ChiangMai</strong><br>
              การลงทะเบียนของคุณเสร็จสมบูรณ์แล้ว
            </p>

            <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0;">📋 รายละเอียดการลงทะเบียน</h3>
              <p style="color: #4a5568; line-height: 1.6; margin: 5px 0;">
                <strong>ชื่อ-นามสกุล:</strong> ${data.name}<br>
                ${data.nickname ? `<strong>ชื่อเล่น:</strong> ${data.nickname}<br>` : ''}
                <strong>อีเมล:</strong> ${data.email}<br>
                ${data.phone ? `<strong>เบอร์โทรศัพท์:</strong> ${data.phone}<br>` : ''}
                ${data.lineId ? `<strong>LINE ID:</strong> ${data.lineId}<br>` : ''}
                ${data.nationalId ? `<strong>เลขบัตรประชาชน:</strong> <span style="font-family: monospace;">${formatNationalIdForEmail(data.nationalId)}</span><br>` : ''}
                ${data.school ? `<strong>โรงเรียน:</strong> ${data.school}<br>` : ''}
                ${data.grade ? `<strong>ชั้นเรียน:</strong> ${data.grade}<br>` : ''}
                <strong>แพ็กเกจ:</strong> ${data.packageType === 'FREE' ? 'FREE Package' : 'ADVANCED Package'}<br>
                <strong>รหัสสอบ (Exam Code):</strong> <span style="color: #0d7276; font-weight: bold; font-size: 18px;">${data.examCode}</span>
              </p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d7276;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 ข้อมูลการสอบ</h3>
              <p style="color: #4a5568; line-height: 1.8; margin: 5px 0;">
                <strong>📆 วันที่:</strong> วันเสาร์ที่ 27 กันยายน 2568<br>
                <strong>⏰ เวลา:</strong> ${data.sessionTime === '13:00-16:00' ? 'บ่าย 13:00-16:00 น.' : 'เช้า 09:00-12:00 น.'}<br>
                <strong>📍 สถานที่:</strong> สำนักบริการวิชาการ มหาวิทยาลัยเชียงใหม่<br>
                <strong>🏠 ห้อง:</strong> ห้องทองกวาว 1 และ 2<br>
                <strong>🕘 มาถึงก่อน:</strong> เวลาสอบ 45 นาที
              </p>
            </div>

            <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #fc8181; margin: 20px 0;">
              <p style="color: #742a2a; margin: 0; font-size: 14px;">
                <strong>สำคัญ:</strong> กรุณาเก็บรหัสสอบนี้ไว้เป็นความลับ นำมาใช้ในวันสอบ
              </p>
            </div>

            <p style="color: #4a5568; line-height: 1.6;">
              คุณสามารถเข้าสู่ระบบได้ทันที
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}"
                 style="display: inline-block; background-color: #0d7276; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                เข้าสู่ระบบ
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; font-size: 14px; margin-bottom: 15px;">
                หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อเราผ่าน LINE Official Account
              </p>
              <div style="display: inline-block; border: 2px solid #e2e8f0; border-radius: 8px; padding: 10px; background-color: white; margin-bottom: 10px;">
                <img src="https://s.imgz.io/2025/09/15/line_QR2f097df19b3798e4.th.jpg"
                     alt="Line QR Code สำหรับ @mockexam.official"
                     style="width: 120px; height: 120px; border-radius: 4px;" />
              </div>
              <p style="color: #718096; font-size: 12px; margin-bottom: 10px;">
                Scan QR Code เพื่อเข้าร่วม LINE Official Account
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #718096; font-size: 12px;">
                TBAT Mock Exam @ChiangMai
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  results: {
    subject: "ผลสอบ TBAT Mock Exam พร้อมแล้ว",
    html: (data: { name: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ผลสอบพร้อมแล้ว</title>
        </head>
        <body style="font-family: 'Noto Sans Thai', sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
            <h1 style="color: #0d7276; margin-bottom: 20px; text-align: center;">📊 ผลสอบพร้อมแล้ว!</h1>

            <div style="background-color: #f0fdff; padding: 20px; border-radius: 8px; border-left: 4px solid #0d7276; margin-bottom: 20px;">
              <p style="color: #2d3748; font-size: 18px; margin: 0;">
                สวัสดีคุณ <strong>${data.name}</strong>
              </p>
            </div>

            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 30px;">
              ผลสอบ TBAT Mock Exam ของคุณพร้อมแล้ว<br>
              กรุณาเข้าสู่ระบบเพื่อดูผลสอบ
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}"
                 style="display: inline-block; background-color: #0d7276; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                เข้าสู่ระบบดูผลสอบ
              </a>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #718096; font-size: 12px;">
                TBAT Mock Exam @ChiangMai
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  pdfReady: {
    subject: "เฉลยละเอียด PDF พร้อมดาวน์โหลดแล้ว",
    html: (data: { name: string; subject: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>PDF พร้อมแล้ว</title>
        </head>
        <body style="font-family: 'Noto Sans Thai', sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
            <h1 style="color: #2d3748; margin-bottom: 20px;">เฉลยละเอียด PDF พร้อมแล้ว!</h1>
            <p style="color: #4a5568; line-height: 1.6;">
              สวัสดีคุณ ${data.name}
            </p>
            <p style="color: #4a5568; line-height: 1.6;">
              เฉลยละเอียดวิชา <strong>${data.subject}</strong> พร้อมให้ดาวน์โหลดแล้ว
            </p>
            <div style="margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL}/pdf-solutions" 
                 style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                ดาวน์โหลด PDF
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  },
};

// Send email function
// Overloaded function to support both template and direct email sending
export async function sendEmail(
  toOrParams: string | { to: string; subject: string; html: string },
  template?: keyof typeof emailTemplates,
  data?: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Check if email service is available
    if (!isEmailServiceAvailable()) {
      console.warn("Email service not configured - Gmail credentials missing");
      return {
        success: false,
        error: "Email service not configured"
      };
    }

    let emailData: { from: string; to: string; subject: string; html: string };

    if (typeof toOrParams === 'object') {
      // Direct email sending
      emailData = {
        from: process.env.GMAIL_USER || "noreply@tbat-exam.com",
        to: toOrParams.to,
        subject: toOrParams.subject,
        html: toOrParams.html,
      };
    } else if (template) {
      // Template-based email sending
      const emailTemplate = emailTemplates[template];
      emailData = {
        from: process.env.GMAIL_USER || "noreply@tbat-exam.com",
        to: toOrParams,
        subject: emailTemplate.subject,
        html: emailTemplate.html(data),
      };
    } else {
      throw new Error("Invalid parameters for sendEmail");
    }

    console.log('📧 Sending email via Gmail SMTP...');
    console.log(`   To: ${emailData.to}`);
    console.log(`   Subject: ${emailData.subject}`);

    const result = await transporter.sendMail(emailData);

    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending email:", error);
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

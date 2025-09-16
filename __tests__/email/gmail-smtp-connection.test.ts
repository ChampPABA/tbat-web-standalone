import { sendEmail, isEmailServiceAvailable } from "../../lib/email";

describe("Gmail SMTP Connection Tests", () => {
  beforeAll(() => {
    console.log("🔍 Testing Gmail SMTP Infrastructure");
    console.log("Gmail User:", process.env.GMAIL_USER ? "✓ Set" : "✗ Missing");
    console.log("Gmail App Password:", process.env.GMAIL_APP_PASSWORD ? "✓ Set" : "✗ Missing");
  });

  describe("Email Service Availability", () => {
    test("should detect email service availability", () => {
      const isAvailable = isEmailServiceAvailable();
      console.log("📧 Email Service Available:", isAvailable ? "Yes" : "No");

      if (!isAvailable) {
        console.warn("⚠️  Gmail credentials not configured - email testing will be limited");
      }
    });
  });

  describe("Gmail SMTP Connection", () => {
    test("should connect to Gmail SMTP server", async () => {
      if (!isEmailServiceAvailable()) {
        console.log("⏭️  Skipping SMTP connection test - credentials not available");
        expect(true).toBe(true); // Pass test but skip actual testing
        return;
      }

      // Test basic email sending
      const testEmail = {
        to: "aspectedu.dev@gmail.com", // Use the actual Gmail address
        subject: "🧪 TBAT Platform - SMTP Connection Test",
        html: `
          <div style="font-family: 'Noto Sans Thai', sans-serif; padding: 20px;">
            <h2>การทดสอบการเชื่อมต่อ Gmail SMTP</h2>
            <p>หากคุณได้รับ email นี้ แสดงว่าระบบ Gmail SMTP ทำงานถูกต้อง</p>
            <p><strong>เวลาทดสอบ:</strong> ${new Date().toLocaleString('th-TH')}</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">
              📧 Test from TBAT Mock Exam Platform<br/>
              🚀 Automated SMTP Connection Verification
            </p>
          </div>
        `
      };

      console.log("📤 Attempting to send test email...");
      const result = await sendEmail(testEmail);

      if (result.success) {
        console.log("✅ Gmail SMTP connection successful!");
        console.log("📧 Email sent with ID:", result.data?.messageId);
        expect(result.success).toBe(true);
        expect(result.data?.messageId).toBeDefined();
      } else {
        console.error("❌ Gmail SMTP connection failed:");
        console.error(result.error);

        // Analyze common error types
        if (result.error?.code === 'EAUTH') {
          console.error("🔐 Authentication Error - Check Gmail App Password");
        } else if (result.error?.code === 'ENOTFOUND') {
          console.error("🌐 Network Error - Check internet connection");
        } else if (result.error?.code === 'ETIMEDOUT') {
          console.error("⏱️  Timeout Error - Gmail server unreachable");
        }

        throw new Error(`Gmail SMTP test failed: ${result.error?.message || 'Unknown error'}`);
      }
    }, 15000); // 15 second timeout for network operations

    test("should handle invalid credentials gracefully", async () => {
      // Temporarily override credentials for this test
      const originalUser = process.env.GMAIL_USER;
      const originalPassword = process.env.GMAIL_APP_PASSWORD;

      process.env.GMAIL_USER = "invalid@gmail.com";
      process.env.GMAIL_APP_PASSWORD = "invalid-password";

      const testEmail = {
        to: "test@example.com",
        subject: "Test Invalid Credentials",
        html: "<p>This should fail</p>"
      };

      console.log("🔒 Testing with invalid credentials...");
      const result = await sendEmail(testEmail);

      // Restore original credentials
      process.env.GMAIL_USER = originalUser;
      process.env.GMAIL_APP_PASSWORD = originalPassword;

      console.log("🛡️  Invalid credentials handled:", result.success ? "Failed to detect" : "Correctly detected");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Email Service Configuration", () => {
    test("should have proper Gmail SMTP settings", async () => {
      const nodemailer = require("nodemailer");

      if (!isEmailServiceAvailable()) {
        console.log("⏭️  Skipping configuration test - credentials not available");
        return;
      }

      // Test transporter creation
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      console.log("🔧 Testing transporter configuration...");

      try {
        const verified = await transporter.verify();
        console.log("✅ Gmail transporter verified:", verified);
        expect(verified).toBe(true);
      } catch (error) {
        console.error("❌ Transporter verification failed:", error);
        throw error;
      }
    });
  });
});
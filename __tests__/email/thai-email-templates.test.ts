import { sendEmail, emailTemplates } from "../../lib/email";

describe("Thai Email Templates Tests", () => {
  const mockThaiUserData = {
    name: "นายสมชาย ใจดี",
    thaiName: "นายสมชาย ใจดี",
    email: "somchai@example.com",
    code: "FREE-A1B2-BIOLOGY", // Use 'code' field for exam ticket template
    examCode: "FREE-A1B2-BIOLOGY", // Use for registration template
    totalScore: 85,
    packageType: "FREE" as const,
    sessionTime: "09:00-12:00 น.",
    subjects: ["ชีววิทยา"],
    subject: "ชีววิทยา"
  };

  const mockThaiAdvancedUserData = {
    name: "นางสาวสุดา เรียนดี",
    thaiName: "นางสาวสุดา เรียนดี",
    email: "suda@example.com",
    code: "ADV-X9Y8", // Use 'code' field for exam ticket template
    examCode: "ADV-X9Y8", // Use for registration template
    totalScore: 92,
    packageType: "ADVANCED" as const,
    sessionTime: "13:00-16:00 น.",
    subjects: ["ชีววิทยา", "เคมี", "ฟิสิกส์"],
    subject: "ชีววิทยา"
  };

  describe("Registration Email Template", () => {
    test("should render Thai registration email correctly", () => {
      const html = emailTemplates.registration.html(mockThaiUserData);

      console.log("📧 Registration Email HTML Preview:");
      console.log("=".repeat(50));
      console.log(html);
      console.log("=".repeat(50));

      // Test Thai text content
      expect(html).toContain("สวัสดีคุณ <strong>นายสมชาย ใจดี</strong>");
      expect(html).toContain("การลงทะเบียนสำเร็จ");
      expect(html).toContain("TBAT Mock Exam @ChiangMai");
      expect(html).toContain("somchai@example.com");
      expect(html).toContain("FREE-A1B2-BIOLOGY");
      expect(html).toContain("FREE Package");
      expect(html).toContain("คุณสามารถเข้าสู่ระบบได้ทันที");

      // Test HTML structure
      expect(html).toContain('font-family: \'Noto Sans Thai\'');
      expect(html).toContain('charset="utf-8"');

      // Test styling for Thai fonts
      expect(html).toMatch(/font-family.*Noto Sans Thai/);
    });

    test("should handle special Thai characters properly", () => {
      const specialThaiData = {
        name: "นายภาคภูมิ ศิริพงษ์ (พิเศษ ๑๒๓)",
        email: "special@example.com",
        packageType: "ADVANCED" as const,
        examCode: "ADV-X9Y8"
      };

      const html = emailTemplates.registration.html(specialThaiData);

      expect(html).toContain("สวัสดีคุณ <strong>นายภาคภูมิ ศิริพงษ์ (พิเศษ ๑๒๓)</strong>");
      expect(html).toContain("special@example.com");
    });
  });


  describe("Results Email Template", () => {
    test("should render simplified results notification", () => {
      const html = emailTemplates.results.html({ name: "นายสมชาย ใจดี" });

      console.log("📊 Results Email HTML Preview (Simplified):");
      console.log("=".repeat(50));
      console.log(html);
      console.log("=".repeat(50));

      // Test simplified content
      expect(html).toContain("ผลสอบพร้อมแล้ว!");
      expect(html).toContain("สวัสดีคุณ <strong>นายสมชาย ใจดี</strong>");
      expect(html).toContain("ผลสอบ TBAT Mock Exam ของคุณพร้อมแล้ว");
      expect(html).toContain("กรุณาเข้าสู่ระบบเพื่อดูผลสอบ");
      expect(html).toContain("เข้าสู่ระบบดูผลสอบ");

      // Ensure no score or package-specific content
      expect(html).not.toContain("คะแนน");
      expect(html).not.toContain("Advanced Package");
      expect(html).not.toContain("FREE Package");
    });

    test("should work with complex Thai names", () => {
      const html = emailTemplates.results.html({ name: "นางสาวสุดา เรียนดี" });

      expect(html).toContain("สวัสดีคุณ <strong>นางสาวสุดา เรียนดี</strong>");
      expect(html).toContain("ผลสอบพร้อมแล้ว!");
    });
  });

  describe("PDF Ready Email Template", () => {
    test("should render PDF download notification with Thai content", () => {
      const html = emailTemplates.pdfReady.html(mockThaiUserData);

      console.log("📄 PDF Ready Email HTML Preview:");
      console.log("=".repeat(50));
      console.log(html);
      console.log("=".repeat(50));

      // Test PDF notification content
      expect(html).toContain("สวัสดีคุณ นายสมชาย ใจดี");
      expect(html).toContain("เฉลยละเอียดวิชา <strong>ชีววิทยา</strong> พร้อมให้ดาวน์โหลดแล้ว");
      expect(html).toContain("ดาวน์โหลด PDF");
    });
  });

  describe("Email UTF-8 Encoding Tests", () => {
    test("should handle various Thai character sets", () => {
      const complexThaiData = {
        name: "นายกรรณิการ์ วิศิษฐ์สิทธิ์", // Complex Thai name
        email: "complex@example.com",
        packageType: "FREE",
        examCode: "FREE-ABC1-BIOLOGY"
      };

      const html = emailTemplates.registration.html(complexThaiData);

      // Test complex Thai characters
      expect(html).toContain("นายกรรณิการ์ วิศิษฐ์สิทธิ์");
      expect(html).toMatch(/<meta charset="utf-8">/);

      // Ensure HTML is valid UTF-8
      const buffer = Buffer.from(html, 'utf8');
      const decoded = buffer.toString('utf8');
      expect(decoded).toEqual(html);
    });

    test("should preserve Thai numerals and special characters in PDF template", () => {
      const specialData = {
        name: "นางสาวกัญญา ฝ้าย-สีทอง (ลำดับที่ ๑๒๓)",
        subject: "ชีววิทยา"
      };

      const html = emailTemplates.pdfReady.html(specialData);

      expect(html).toContain("นางสาวกัญญา ฝ้าย-สีทอง (ลำดับที่ ๑๒๓)");
      expect(html).toContain("เฉลยละเอียดวิชา <strong>ชีววิทยา</strong>");
    });
  });

  describe("Template Structure and Styling", () => {
    test("should include proper CSS for Thai font rendering", () => {
      const html = emailTemplates.registration.html(mockThaiUserData);

      // Test Noto Sans Thai font family
      expect(html).toMatch(/font-family:\s*['"]Noto Sans Thai['"][^;]*sans-serif/);

      // Test responsive design elements
      expect(html).toContain("max-width: 600px");
      expect(html).toContain("margin: 0 auto");
    });

    test("should have consistent TBAT branding colors", () => {
      const templates = [
        emailTemplates.registration.html(mockThaiUserData),
        emailTemplates.results.html({ name: "นายสมชาย ใจดี" }),
        emailTemplates.pdfReady.html(mockThaiUserData)
      ];

      templates.forEach((html, index) => {
        // Test consistent color scheme
        expect(html).toMatch(/#(2d3748|4a5568|3182ce|718096)/); // TBAT color palette
        console.log(`Template ${index + 1} color scheme: ✓`);
      });
    });
  });
});
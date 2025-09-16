# 📧 Resend Email Service Setup - ทีละขั้นตอน

## 🎯 ขั้นตอนที่ 1: สมัครบัญชี Resend

### 1.1 เปิดเว็บไซต์
- ไปที่: https://resend.com
- คลิก **"Get Started"** หรือ **"Sign Up"**

### 1.2 สมัครบัญชี
- **ตัวเลือก 1:** ใช้ GitHub account (แนะนำ)
- **ตัวเลือก 2:** ใช้ Gmail หรือ email อื่น

```
Email: your-email@gmail.com
Password: สร้างรหัสผ่านแข็งแรง
```

### 1.3 Verify Email
- เช็ค email ที่สมัคร
- คลิกลิงก์ยืนยัน

---

## 🔑 ขั้นตอนที่ 2: สร้าง API Key

### 2.1 เข้าสู่ Dashboard
- Login เข้า Resend
- จะเข้าสู่หน้า Dashboard

### 2.2 ไปที่ API Keys
- ซ้ายมือ: คลิก **"API Keys"**
- คลิก **"Create API Key"**

### 2.3 ตั้งชื่อ API Key
```
Name: TBAT Mock Exam Platform
Permission: Full access (ค่าเริ่มต้น)
```

### 2.4 Copy API Key
- จะได้ API Key ขึ้นต้นด้วย `re_`
- **📋 Copy ทันที** (จะแสดงครั้งเดียว!)
- เช่น: `re_123abc456def789ghi012jkl345mno678pqr`

---

## ⚙️ ขั้นตอนที่ 3: เพิ่ม Environment Variables

### 3.1 เปิดไฟล์ .env.local
```bash
# ไปที่โฟลเดอร์โปรเจค
cd D:\project\TBAT_mock_exam\apps\web

# เปิดไฟล์ .env.local ด้วย text editor
notepad .env.local
# หรือ
code .env.local  # ถ้าใช้ VS Code
```

### 3.2 แก้ไข Environment Variables
หาบรรทัดนี้:
```bash
# Email Configuration (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@tbat-exam.com"
```

เปลี่ยนเป็น:
```bash
# Email Configuration (Resend)
RESEND_API_KEY="re_123abc456def789ghi012jkl345mno678pqr"  # ใส่ API Key จริง
EMAIL_FROM="noreply@resend.dev"  # ใช้ domain ของ Resend สำหรับ development
```

### 3.3 บันทึกไฟล์
- **Ctrl + S** เพื่อบันทึก
- ปิดไฟล์

---

## 🔄 ขั้นตอนที่ 4: Restart Development Server

### 4.1 หยุด Server
- ใน Terminal/Command Prompt
- กด **Ctrl + C** เพื่อหยุด server

### 4.2 เริ่ม Server ใหม่
```bash
npm run dev
```

### 4.3 ตรวจสอบ Server
- ดู console ว่าไม่มี error เกี่ยวกับ email
- Server จะรันที่ http://localhost:3000

---

## 🧪 ขั้นตอนที่ 5: ทดสอบ Email Service

### 5.1 ทดสอบผ่าน API
เปิด Terminal ใหม่:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\"}"
```

### 5.2 ตรวจสอบผลลัพธ์
**ถ้าสำเร็จ:**
```json
{
  "success": true,
  "message": "หากอีเมลของคุณมีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้คุณ"
}
```

**ถ้าล้มเหลว:**
```json
{
  "error": "Email service not configured"
}
```

### 5.3 เช็ค Console Logs
- ดูใน Terminal ที่รัน `npm run dev`
- จะมี logs เกี่ยวกับการส่งอีเมล

---

## 📧 ขั้นตอนที่ 6: ตรวจสอบ Email จริง

### 6.1 ใน Resend Dashboard
- ไปที่ **"Logs"** ใน Resend
- จะเห็นอีเมลที่ส่งออกไป

### 6.2 สำหรับ Development
- อีเมลจะไปที่ test@example.com
- เปิดดูใน Resend logs ได้

### 6.3 สำหรับ Production
- ต้อง verify domain จริง
- หรือใช้ email ที่ verify แล้ว

---

## ⚠️ Troubleshooting

### 🚫 ปัญหา: "Email service not configured"
**สาเหตุ:**
- API Key ผิด
- Environment variables ไม่ได้ load

**วิธีแก้:**
```bash
# 1. เช็ค .env.local ใหม่
cat .env.local | grep RESEND

# 2. Restart server
# Ctrl + C แล้ว npm run dev

# 3. เช็ค API Key ใน Resend dashboard
```

### 🚫 ปัญหา: "API key is invalid"
**สาเหตุ:**
- API Key หมดอายุ
- Copy ไม่ครบ

**วิธีแก้:**
1. สร้าง API Key ใหม่ใน Resend
2. Copy ใหม่ทั้งหมด
3. แทนที่ใน .env.local

### 🚫 ปัญหา: Email ไม่ถึง
**สาเหตุ:**
- ใช้ domain ที่ไม่ verify
- Rate limit

**วิธีแก้ (Development):**
- ใช้ `noreply@resend.dev`
- ดู logs ใน Resend dashboard แทน

---

## 🎉 สำเร็จแล้ว!

### ✅ เช็คลิสต์
- [ ] สมัคร Resend
- [ ] สร้าง API Key
- [ ] เพิ่ม environment variables
- [ ] Restart server
- [ ] ทดสอบ API
- [ ] เห็น logs ใน Resend

### 🚀 ผลลัพธ์
- **Email Delivery:** ✅ PASS
- **Production Readiness:** 5/5 tests passed
- **Password reset emails** ทำงานได้แล้ว!

---

## 💡 เคล็ดลับ

### สำหรับ Development:
```bash
EMAIL_FROM="noreply@resend.dev"  # ใช้ได้เลย
```

### สำหรับ Production:
```bash
EMAIL_FROM="noreply@your-domain.com"  # ต้อง verify domain
```

### Free Tier Limits:
- **3,000 emails/เดือน**
- **100 emails/วัน**
- เพียงพอสำหรับ development และ small production

---

หากยังมีปัญหา ให้ screenshot error message มาจะช่วยแก้ไขให้ได้ครับ! 🛠️
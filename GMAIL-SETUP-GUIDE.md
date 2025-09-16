# 📧 Gmail SMTP Setup Guide - ส่งอีเมลจริงฟรี!

## 🎯 ขั้นตอนที่ 1: เปิด 2-Step Verification ใน Gmail

### 1.1 เข้า Google Account Settings
- ไปที่: https://myaccount.google.com
- หรือ Gmail > Settings (เฟือง) > See all settings > Accounts and Import

### 1.2 เปิด 2-Step Verification
```
Google Account > Security > 2-Step Verification
```

**ถ้ายังไม่เปิด:**
1. คลิก **"Get Started"**
2. ใส่รหัสผ่าน Google
3. ใส่เบอร์โทรศัพท์
4. รับรหัส SMS และใส่
5. เปิดใช้งาน 2-Step Verification

---

## 🔑 ขั้นตอนที่ 2: สร้าง App Password

### 2.1 ไปที่ App Passwords
```
Google Account > Security > 2-Step Verification > App passwords
```

### 2.2 สร้าง App Password ใหม่
1. **Select app:** Mail
2. **Select device:** Windows Computer (หรืออื่นๆ)
3. คลิก **"Generate"**

### 2.3 Copy App Password
```
Gmail จะแสดงรหัส 16 ตัว เช่น:
abcd efgh ijkl mnop

📋 Copy รหัสนี้ทั้งหมด (มีช่องว่าง)
```

**⚠️ สำคัญ:** รหัสนี้จะแสดงครั้งเดียว! Copy ทันที

---

## ⚙️ ขั้นตอนที่ 3: แก้ไขไฟล์ .env.local

### 3.1 เปิดไฟล์
```bash
# ไปที่โฟลเดอร์โปรเจค
D:\project\TBAT_mock_exam\apps\web

# เปิดไฟล์ .env.local
notepad .env.local
# หรือ
code .env.local
```

### 3.2 แก้ไข Environment Variables
หาบรรทัดนี้:
```bash
# Gmail SMTP Configuration
GMAIL_USER="your-gmail@gmail.com"
GMAIL_APP_PASSWORD="your-app-password-here"
```

เปลี่ยนเป็น:
```bash
# Gmail SMTP Configuration
GMAIL_USER="your-actual-gmail@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
```

**ตัวอย่างจริง:**
```bash
GMAIL_USER="john.doe@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
```

### 3.3 บันทึกไฟล์
- **Ctrl + S** บันทึกไฟล์
- ปิดไฟล์

---

## 🔄 ขั้นตอนที่ 4: Restart Server

### 4.1 หยุด Development Server
- ใน Terminal/Command Prompt
- **Ctrl + C** หยุด server

### 4.2 เริ่มใหม่
```bash
npm run dev
```

### 4.3 ตรวจสอบ Console
ไม่ควรมี error เกี่ยวกับ Gmail

---

## 🧪 ขั้นตอนที่ 5: ทดสอบการส่งอีเมล

### 5.1 ทดสอบผ่าน API
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\"}"
```

### 5.2 ผลลัพธ์ที่ต้องการ
```json
{
  "success": true,
  "message": "หากอีเมลของคุณมีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้คุณ"
}
```

### 5.3 เช็ค Console Logs
```
📧 [GMAIL SMTP] Sending email:
   From: your-gmail@gmail.com
   To: test@example.com
   Subject: รีเซ็ตรหัสผ่าน - TBAT Mock Exam Platform
✅ Email sent successfully via Gmail SMTP
   Message ID: <random-id@gmail.com>
```

---

## 📧 ขั้นตอนที่ 6: ทดสอบกับอีเมลจริง

### 6.1 ส่งให้ตัวเอง
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-gmail@gmail.com\"}"
```

### 6.2 เช็คกล่องจดหมาย
- เปิด Gmail
- ดูใน Inbox หรือ Spam
- จะเห็นอีเมล "รีเซ็ตรหัสผ่าน - TBAT Mock Exam Platform"

---

## 🎉 Visual Step-by-Step

### Step 1: Google Account Security
```
https://myaccount.google.com
┌─────────────────────────────────────┐
│ 🔐 Security                        │
│                                     │
│ 2-Step Verification                │
│ [Turn on] ← ถ้ายังไม่เปิด            │
│                                     │
│ App passwords                      │
│ [Manage app passwords] ← คลิกที่นี่   │
└─────────────────────────────────────┘
```

### Step 2: App Password Creation
```
App passwords page
┌─────────────────────────────────────┐
│ Generate app password              │
│                                     │
│ Select app: [Mail        ▼]        │
│ Select device: [Windows  ▼]        │
│                                     │
│ [Generate]                         │
└─────────────────────────────────────┘
```

### Step 3: Copy Password
```
Generated app password
┌─────────────────────────────────────┐
│ Your app password is:              │
│                                     │
│ abcd efgh ijkl mnop                │
│ [📋 Copy]                          │
│                                     │
│ ⚠️ Save this - you won't see it again │
└─────────────────────────────────────┘
```

---

## ⚠️ Troubleshooting

### 🚫 "Invalid login" error
**สาเหตุ:**
- ใช้รหัสผ่าน Gmail ปกติ แทน App Password
- App Password ผิด

**วิธีแก้:**
1. สร้าง App Password ใหม่
2. Copy ทั้งหมด (รวมช่องว่าง)
3. Paste ใน .env.local

### 🚫 "Less secure app access" error
**วิธีแก้:**
- Gmail ไม่ใช้ "Less secure apps" แล้ว
- ต้องใช้ App Password เท่านั้น

### 🚫 Email ไม่ถึง
**เช็ค:**
1. Spam folder
2. Console logs มี error ไหม
3. App Password ถูกต้องไหม

### 🚫 "Gmail SMTP not configured"
**วิธีแก้:**
1. เช็ค .env.local มี GMAIL_USER และ GMAIL_APP_PASSWORD ไหม
2. Restart server (Ctrl+C, npm run dev)

---

## 💡 ข้อดี Gmail SMTP

✅ **ฟรี:** ส่งได้ 500 อีเมล/วัน
✅ **เชื่อถือได้:** Google infrastructure
✅ **ง่าย:** ไม่ต้องสมัครเพิ่ม
✅ **จริง:** ส่งอีเมลจริงๆ ได้

## 📊 Limits

- **500 อีเมล/วัน** สำหรับ development เพียงพอ
- **Gmail จริง** ในชื่อ sender
- **Spam rate** ต่ำ เพราะมาจาก Gmail

---

## ✅ Success Checklist

- [ ] เปิด 2-Step Verification แล้ว
- [ ] สร้าง App Password แล้ว
- [ ] แก้ไข .env.local แล้ว
- [ ] Restart server แล้ว
- [ ] ทดสอบ API ได้ success: true
- [ ] อีเมลถึงจริงๆ

**หลังจากนี้ Email Delivery จะได้ ✅ PASS!**

---

หากมีปัญหาตรงไหน บอกมาได้เลยครับ จะช่วยแก้ไขให้! 🛠️
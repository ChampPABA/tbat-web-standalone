# 📷 Visual Guide: Resend Email Setup

## 🎯 Step 1: Sign Up Page
```
หน้าแรก https://resend.com
┌─────────────────────────────────────┐
│ 🚀 Resend                          │
│                                     │
│ "Build, test, and send emails"      │
│                                     │
│ [Get Started] ← คลิกที่นี่           │
│ [Sign In]                          │
└─────────────────────────────────────┘
```

## 📝 Step 2: Registration Form
```
หน้าสมัครสมาชิก
┌─────────────────────────────────────┐
│ Sign up to Resend                  │
│                                     │
│ Email: [your-email@gmail.com]       │
│ Password: [strong-password]         │
│                                     │
│ [Sign up with Email]               │
│      หรือ                           │
│ [Continue with GitHub] ← แนะนำ       │
└─────────────────────────────────────┘
```

## 🏠 Step 3: Dashboard View
```
หลัง Login เข้ามา
┌─────────────────────────────────────┐
│ Resend Dashboard                   │
│ ├── Overview                       │
│ ├── API Keys      ← คลิกที่นี่      │
│ ├── Domains                        │
│ ├── Logs                          │
│ └── Settings                       │
│                                     │
│ Welcome to Resend!                 │
└─────────────────────────────────────┘
```

## 🔑 Step 4: API Keys Page
```
หน้า API Keys
┌─────────────────────────────────────┐
│ API Keys                           │
│                                     │
│ [+ Create API Key] ← คลิกสร้าง       │
│                                     │
│ No API keys yet                    │
└─────────────────────────────────────┘
```

## ✏️ Step 5: Create API Key Form
```
ฟอร์มสร้าง API Key
┌─────────────────────────────────────┐
│ Create API Key                     │
│                                     │
│ Name: [TBAT Mock Exam]             │
│ Permission: Full access ✓          │
│                                     │
│ [Create API Key]                   │
└─────────────────────────────────────┘
```

## 📋 Step 6: API Key Result
```
หลังสร้างสำเร็จ
┌─────────────────────────────────────┐
│ 🎉 API Key Created                 │
│                                     │
│ Your API key:                      │
│ re_AbCd1234EfGh5678IjKl9012MnOp... │
│ [📋 Copy]  ← Copy ทั้งหมด!          │
│                                     │
│ ⚠️ This key will only be shown once │
└─────────────────────────────────────┘
```

## 💻 Step 7: Windows File Explorer
```
เปิดไฟล์ .env.local
┌─────────────────────────────────────┐
│ 📁 File Explorer                   │
│ D:\project\TBAT_mock_exam\apps\web  │
│                                     │
│ 📄 .env.local  ← คลิกขวา > เปิดด้วย │
│ 📄 package.json                    │
│ 📁 components                       │
│ 📁 lib                             │
└─────────────────────────────────────┘

เลือก: "เปิดด้วย Notepad" หรือ "VS Code"
```

## ✏️ Step 8: Edit .env.local
```
ในไฟล์ .env.local ให้หา:
┌─────────────────────────────────────┐
│ # Email Configuration (Resend)     │
│ RESEND_API_KEY="re_your_api_key..  │  ← แก้บรรทัดนี้
│ EMAIL_FROM="noreply@tbat-exam.com"  │  ← แก้บรรทัดนี้
│                                     │
│ # Production feature flags          │
└─────────────────────────────────────┘

เปลี่ยนเป็น:
┌─────────────────────────────────────┐
│ # Email Configuration (Resend)     │
│ RESEND_API_KEY="re_AbCd1234EfGh..." │  ← API Key จริง
│ EMAIL_FROM="noreply@resend.dev"     │  ← ใช้ domain ของ Resend
└─────────────────────────────────────┘
```

## 💾 Step 9: Save File
```
Windows: Ctrl + S
Mac: Cmd + S

Notepad:
┌─────────────────────────────────────┐
│ File  Edit  Format  View  Help     │
│ ├── Save        Ctrl+S  ← คลิก     │
│ └── Save As...                     │
└─────────────────────────────────────┘
```

## 🖥️ Step 10: Command Prompt/Terminal
```
Windows Command Prompt:
C:\> cd D:\project\TBAT_mock_exam\apps\web
C:\...\apps\web> npm run dev

Terminal จะแสดง:
┌─────────────────────────────────────┐
│ > web@0.1.0 dev                    │
│ > next dev --port 3000             │
│                                     │
│ ✓ Ready on http://localhost:3000    │
└─────────────────────────────────────┘
```

## 🧪 Step 11: Test API
```
เปิด Command Prompt ใหม่:
curl -X POST http://localhost:3000/api/auth/forgot-password ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\"}"

ผลลัพธ์ที่ต้องการ:
┌─────────────────────────────────────┐
│ {                                   │
│   "success": true,                  │
│   "message": "หากอีเมลของคุณมีอยู่..." │
│ }                                   │
└─────────────────────────────────────┘
```

## 📊 Step 12: Resend Logs
```
กลับไปที่ Resend Dashboard > Logs
┌─────────────────────────────────────┐
│ Logs                               │
│                                     │
│ ✅ test@example.com                │
│    "รีเซ็ตรหัสผ่าน - TBAT Mock..."  │
│    Delivered • 2 seconds ago       │
└─────────────────────────────────────┘
```

---

## 🚨 Common Issues & Solutions

### ❌ Issue: Command not found 'curl'
**Windows Solution:**
```
ใช้ PowerShell แทน Command Prompt:
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com"}'
```

### ❌ Issue: File .env.local not found
**Solution:**
```
สร้างไฟล์ใหม่:
1. Right-click ในโฟลเดอร์ apps/web
2. New > Text Document
3. เปลี่ยนชื่อเป็น .env.local
4. คัดลอกเนื้อหาจากไฟล์ .env.local.example
```

### ❌ Issue: "Invalid API key"
**Solution:**
```
1. ไปที่ Resend Dashboard
2. API Keys > Create new key
3. Copy key ใหม่ทั้งหมด
4. Paste ใน .env.local
5. Restart server (Ctrl+C, npm run dev)
```

---

## ⏱️ Timeline
- **Step 1-6:** 5 นาที (สมัคร Resend)
- **Step 7-9:** 2 นาที (แก้ไขไฟล์)
- **Step 10-12:** 3 นาที (ทดสอบ)
- **รวม:** ~10 นาที

## 🎯 Success Criteria
✅ API Key สร้างสำเร็จ
✅ .env.local แก้ไขแล้ว
✅ Server restart สำเร็จ
✅ API ตอบกลับ success: true
✅ เห็น email logs ใน Resend

**หลังจากนี้ Email Delivery จะได้ ✅ PASS แทน ⚠️ NEEDS ATTENTION!**
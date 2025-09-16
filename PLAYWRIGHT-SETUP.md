# TBAT Playwright Setup Guide

## 🚀 Quick Setup

### 1. ตั้งค่า Development Server
```bash
# วิธีที่ 1: ใช้ port 3002 (แนะนำ)
npm run dev:3002

# วิธีที่ 2: ใช้ port 3001
npm run dev:3001

# วิธีที่ 3: ใช้ port 3000 (default)
npm run dev
```

### 2. อัปเดต Environment Variable
```bash
# ในไฟล์ .env.local
DEV_SERVER_PORT=3002
```

### 3. ทดสอบ Playwright MCP
```bash
# ตรวจสอบการตั้งค่า
node scripts/playwright-helper.js detect

# รัน Playwright Tests
npm run test:e2e
```

## 🔧 Configuration Details

### Playwright Config
ไฟล์ `playwright.config.ts` จะอ่านค่า port จาก:
1. `process.env.DEV_SERVER_PORT` (priority #1)
2. Default port 3002

### Port Management Scripts
- `scripts/detect-dev-port.js` - Auto-detect available port
- `scripts/playwright-helper.js` - Playwright testing helper

## 📝 Available Commands

### Development Server
```bash
npm run dev           # Port 3000 (default)
npm run dev:3001      # Port 3001
npm run dev:3002      # Port 3002
npm run dev:auto      # Auto-detect port
```

### Playwright Testing
```bash
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Run with UI mode
npm run playwright:setup  # Setup environment
```

## 🐛 Troubleshooting

### Problem: Port Conflict
**Solution**: Use a different port
```bash
npm run dev:3002  # Try port 3002
```

### Problem: Playwright can't connect
**Solution**: Check server and update config
```bash
# 1. Verify server is running
curl http://localhost:3002

# 2. Update environment
echo "DEV_SERVER_PORT=3002" >> .env.local

# 3. Re-run tests
npm run test:e2e
```

### Problem: MCP Connection Issues
**Solution**: Restart browser and check chromium version
```bash
# Check playwright version
npx playwright --version

# Reinstall browsers if needed
npx playwright install chromium
```

## ✅ Current Status

- ✅ Dynamic port detection implemented
- ✅ Environment-based configuration
- ✅ Multiple port support (3000, 3001, 3002)
- ✅ MCP integration ready
- ✅ Thai language testing support

## 🎯 Usage Examples

### Example 1: Standard Testing
```bash
# Terminal 1: Start server
npm run dev:3002

# Terminal 2: Run tests
npm run test:e2e
```

### Example 2: Custom Port
```bash
# Set custom port
export DEV_SERVER_PORT=3003

# Start server
npm run dev -- --port 3003

# Run tests
npm run test:e2e
```

### Example 3: Quick Detection
```bash
# Auto-detect and setup
node scripts/playwright-helper.js detect

# Run tests immediately
npm run test:e2e
```

---

**Note**: ระบบนี้ได้รับการออกแบบให้รองรับ TBAT platform development workflow และ Playwright MCP integration สำหรับการทดสอบ UI แบบ automated
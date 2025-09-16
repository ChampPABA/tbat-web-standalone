# Email Service Setup Guide

## 🚨 REQUIRED: Email Configuration for Password Reset

### Current Status
- ✅ Email service code implemented (lib/email.ts)
- ✅ Password reset email template in Thai language
- ⚠️ **MISSING: Environment variables configuration**

### Quick Setup Steps

#### 1. Get Resend API Key (Recommended Service)

1. Visit https://resend.com
2. Sign up for free account (100 emails/day free tier)
3. Go to API Keys section
4. Create new API key
5. Copy the API key (starts with `re_`)

#### 2. Update Environment Variables

Add these to your `.env.local`:

```bash
# Email Configuration (Required)
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="noreply@your-domain.com"
```

**For Development:** You can use `"noreply@example.com"` temporarily

**For Production:** You need a verified domain

#### 3. Domain Verification (Production Only)

1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `tbat-exam.com`)
3. Add DNS records as instructed
4. Wait for verification

### Testing Email Service

Run this test script:

```bash
cd apps/web
node -e "
import('./lib/email.js').then(({ sendEmail, isEmailServiceAvailable }) => {
  console.log('Email service available:', isEmailServiceAvailable());
  if (isEmailServiceAvailable()) {
    sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test successful!</h1>'
    }).then(result => console.log('Test result:', result));
  }
});
"
```

### Alternative Email Providers

If Resend doesn't work, you can modify `lib/email.ts` to use:

- **SendGrid**: Popular choice, good free tier
- **Mailgun**: Good for transactional emails
- **AWS SES**: Cheap but more complex setup

### Production Considerations

1. **Rate Limiting**: Current implementation handles rate limiting
2. **Error Handling**: Graceful fallback when email service unavailable
3. **Security**: Uses environment variables, no hardcoded keys
4. **Monitoring**: Console logs for debugging

### Troubleshooting

#### Common Issues:

**Email not sending:**
- Check API key is correct
- Verify domain (for production)
- Check console logs for error messages

**"Email service not configured" error:**
- Environment variables not loaded
- Restart development server after adding variables

**Rate limit errors:**
- Resend free tier: 100 emails/day
- Upgrade plan if needed

### Current Implementation Features

✅ **Working Features:**
- Thai language email templates
- Password reset flow
- Retry mechanism with exponential backoff
- Bulk email sending capability
- Security logging integration

⚠️ **Needs Configuration:**
- API key setup
- Domain verification (production)
- Email delivery monitoring

---

**Next Steps:**
1. Get Resend API key
2. Add environment variables
3. Test password reset flow
4. Verify email delivery in logs

Once configured, the email delivery score will change from ⚠️ to ✅!
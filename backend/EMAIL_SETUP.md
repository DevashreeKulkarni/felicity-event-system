# Email Service Setup Guide

## SMTP Configuration for Gmail

### Option 1: Gmail with App Password (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to Google Account Settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update .env file**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App password (16 chars)
   EMAIL_FROM=Felicity Events <noreply@felicity.com>
   ```

### Option 2: Testing Without Real Emails

Use **Ethereal Email** for testing (no setup required):

```javascript
// In emailService.js, replace createTransporter with:
const createTransporter = async () => {
  // Create test account
  let testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

// After sending email, get preview URL:
console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
```

### Option 3: Skip Emails During Development

Set these in .env to disable emails:
```env
EMAIL_USER=
EMAIL_PASSWORD=
```

The system will log email attempts but won't crash.

## Testing Email Service

```bash
# Send test email
curl -X POST http://localhost:5000/api/registrations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVENT_ID",
    "formData": {}
  }'
```

Check console for:
- ✓ Email sent: <message-id>
- ✗ Email sending failed: <error>

## Email Features Implemented

✅ **Ticket Confirmation Email**
- Sent immediately after registration
- Includes ticket ID
- Event details (name, date, venue, fee)
- Beautiful HTML template
- Link to dashboard

✅ **Non-Blocking**
- Email failures don't prevent registration
- Errors logged but not thrown

✅ **Production Ready**
- Environment-based configuration
- Supports Gmail, SendGrid, AWS SES
- HTML email template

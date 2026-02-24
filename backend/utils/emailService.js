const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send ticket email after registration (with QR code image embedded)
const sendTicketEmail = async (participantEmail, participantName, eventDetails, ticketId) => {
  try {
    const transporter = createTransporter();

    // Generate QR code as base64 PNG
    const qrCodeDataUrl = await QRCode.toDataURL(ticketId, {
      width: 200,
      margin: 2,
      color: { dark: '#6B46C1', light: '#FFFFFF' }
    });
    const qrCodeBase64 = qrCodeDataUrl.split(',')[1];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Felicity Events <noreply@felicity.com>',
      to: participantEmail,
      subject: `Registration Confirmed - ${eventDetails.eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .ticket-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #6B46C1; text-align: center; }
            .ticket-id { font-size: 18px; font-weight: bold; color: #6B46C1; letter-spacing: 2px; font-family: monospace; margin-top: 10px; }
            .qr-label { font-size: 12px; color: #6B7280; text-transform: uppercase; margin-bottom: 8px; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: 600; color: #6B7280; }
            .footer { background: #1F2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #6B46C1; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Registration Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${participantName}</strong>,</p>
              <p>Congratulations! You have successfully registered for:</p>
              <h2 style="color:#6B46C1;text-align:center;">${eventDetails.eventName}</h2>

              <div class="ticket-box">
                <p class="qr-label">Your Entry QR Code</p>
                <img src="cid:qrcode" alt="QR Code" width="180" height="180" style="display:block;margin:0 auto;" />
                <p class="qr-label" style="margin-top:10px;">Ticket ID</p>
                <div class="ticket-id">${ticketId}</div>
              </div>

              <div style="margin:20px 0;">
                <div class="detail-row"><span class="detail-label">Event Type: </span>${eventDetails.eventType}</div>
                <div class="detail-row"><span class="detail-label">Event Date: </span>${new Date(eventDetails.eventStartDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</div>
                ${eventDetails.venue ? `<div class="detail-row"><span class="detail-label">Venue: </span>${eventDetails.venue}</div>` : ''}
                ${eventDetails.registrationFee > 0 ? `<div class="detail-row"><span class="detail-label">Registration Fee: </span>&#8377;${eventDetails.registrationFee}</div>` : ''}
              </div>

              <p><strong>Important:</strong></p>
              <ul>
                <li>Save this email — the QR code above is your entry pass</li>
                <li>Present the QR code at the event venue for scanning</li>
                <li>Arrive 15 minutes before the event starts</li>
              </ul>

              <p style="text-align:center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View My Events</a>
              </p>
            </div>
            <div class="footer">
              <p style="margin:0;">Felicity Event Management System</p>
              <p style="margin:5px 0 0;font-size:12px;color:#9CA3AF;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: Buffer.from(qrCodeBase64, 'base64'),
          cid: 'qrcode'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Ticket email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Ticket email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send event reminder email (24 hours before)
const sendEventReminderEmail = async (participantEmail, participantName, eventDetails, ticketId) => {
  try {
    const transporter = createTransporter();

    // Embed QR code in reminder too
    const qrDataUrl = await QRCode.toDataURL(ticketId, { width: 180, margin: 2, color: { dark: '#D97706', light: '#FFFFFF' } });
    const qrBase64 = qrDataUrl.split(',')[1];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Felicity Events <noreply@felicity.com>',
      to: participantEmail,
      subject: `Reminder: ${eventDetails.eventName} is Tomorrow! 📅`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #FEF3C7; padding: 30px; border: 1px solid #FCD34D; }
            .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
            .ticket-id { font-size: 16px; font-weight: bold; color: #D97706; font-family: monospace; }
            .footer { background: #1F2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>⏰ Event Reminder!</h1></div>
            <div class="content">
              <p>Dear <strong>${participantName}</strong>,</p>
              <p>Your registered event is happening tomorrow!</p>
              <div class="reminder-box">
                <h2 style="color:#D97706;margin-top:0;">${eventDetails.eventName}</h2>
                <p><strong>📅 Date:</strong> ${new Date(eventDetails.eventStartDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                ${eventDetails.venue ? `<p><strong>📍 Venue:</strong> ${eventDetails.venue}</p>` : ''}
                <p><strong>🎫 Ticket ID:</strong> <span class="ticket-id">${ticketId}</span></p>
                <p style="text-align:center;margin-top:12px;"><img src="cid:qrreminder" alt="QR" width="160" height="160" /></p>
              </div>
              <h3>📋 Checklist:</h3>
              <ul>
                <li>Save your ticket QR code / ID</li>
                <li>Arrive 15 minutes early</li>
                <li>Bring a valid ID</li>
              </ul>
            </div>
            <div class="footer">
              <p>See you at the event! 🎉</p>
              <p style="font-size:12px;color:#9CA3AF;">Felicity Event Management System</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        { filename: 'qrcode.png', content: Buffer.from(qrBase64, 'base64'), cid: 'qrreminder' }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Reminder email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send event status update email
const sendEventStatusUpdateEmail = async (participantEmail, participantName, eventDetails, newStatus) => {
  try {
    const transporter = createTransporter();

    const statusMessages = {
      'Ongoing': { subject: `${eventDetails.eventName} is Now Live! 🎉`, title: 'Event Started!', message: 'The event you registered for has just started!', color: '#10B981' },
      'Completed': { subject: `Thank You for Attending ${eventDetails.eventName}! 🙏`, title: 'Event Completed', message: 'Thank you for participating in this event!', color: '#6B7280' },
      'Cancelled': { subject: `Important: ${eventDetails.eventName} Has Been Cancelled ⚠️`, title: 'Event Cancelled', message: 'We regret to inform you that this event has been cancelled.', color: '#DC2626' }
    };

    const statusInfo = statusMessages[newStatus] || statusMessages['Completed'];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Felicity Events <noreply@felicity.com>',
      to: participantEmail,
      subject: statusInfo.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusInfo.color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color}; }
            .footer { background: #1F2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>${statusInfo.title}</h1></div>
            <div class="content">
              <p>Dear <strong>${participantName}</strong>,</p>
              <p>${statusInfo.message}</p>
              <div class="status-box">
                <h2 style="color:${statusInfo.color};margin-top:0;">${eventDetails.eventName}</h2>
                <p><strong>New Status:</strong> ${newStatus}</p>
                <p><strong>Event Date:</strong> ${new Date(eventDetails.eventStartDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
              ${newStatus === 'Completed' ? `<p>We hope you enjoyed the event! Your feedback is valuable to us.</p><p style="text-align:center;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;padding:12px 24px;background:${statusInfo.color};color:white;text-decoration:none;border-radius:6px;">Leave Feedback</a></p>` : ''}
              ${newStatus === 'Cancelled' ? '<p>If you have any questions, please contact the event organizers.</p>' : ''}
            </div>
            <div class="footer"><p style="margin:0;">Felicity Event Management System</p></div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Status update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Status update email failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (organizerEmail, organizerName, newPassword) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Felicity Events <noreply@felicity.com>',
      to: organizerEmail,
      subject: 'Your Felicity Account Password Has Been Reset',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#6B46C1,#553C9A);color:white;padding:24px;border-radius:10px 10px 0 0;text-align:center;">
            <h2 style="margin:0;">🔐 Password Reset</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px;">
            <p>Hi <strong>${organizerName}</strong>,</p>
            <p>Your password reset request has been approved by the Admin. Here are your new credentials:</p>
            <div style="background:white;border:2px dashed #6B46C1;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
              <p style="margin:0 0 8px;color:#6B7280;font-size:12px;text-transform:uppercase;">New Password</p>
              <code style="font-size:22px;font-weight:bold;color:#6B46C1;letter-spacing:2px;">${newPassword}</code>
            </div>
            <p style="color:#DC2626;"><strong>⚠️ Please log in and change this password immediately.</strong></p>
            <p style="font-size:13px;color:#6B7280;">If you did not request this reset, contact the admin immediately.</p>
          </div>
        </div>
      `
    });
    console.log('✓ Password reset email sent to:', organizerEmail);
    return { success: true };
  } catch (error) {
    console.error('✗ Password reset email failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTicketEmail,
  sendEventReminderEmail,
  sendEventStatusUpdateEmail,
  sendPasswordResetEmail
};

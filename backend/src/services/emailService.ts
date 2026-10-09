import nodemailer from 'nodemailer';
import { EmailNotification, EmailType } from '../models/EmailNotification';

let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export const queueAndSendEmail = async (
  recipientEmail: string,
  type: EmailType,
  subject: string,
  body: string,
  examId?: string
) => {
  const normalizedEmail = recipientEmail.trim().toLowerCase();

  const notification = new EmailNotification({
    recipientEmail: normalizedEmail,
    type,
    subject,
    body,
    examId,
    status: 'pending',
    attemptsCount: 0
  });
  await notification.save();

  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"BatchFlow System" <noreply@batchflow.local>',
        to: normalizedEmail,
        subject,
        html: body
      });
      notification.status = 'sent';
      notification.sentAt = new Date();
    } else {
      // Safe fallback logging when no SMTP is configured
      console.log(`[EMAIL DISPATCH SIMULATION] To: ${normalizedEmail} | Subject: ${subject}`);
      console.log(`[EMAIL BODY]:\n${body}\n----------------------------------`);
      notification.status = 'sent';
      notification.sentAt = new Date();
    }
  } catch (error: any) {
    notification.status = 'failed';
    notification.lastError = error.message;
    console.error(`Failed to send email to ${normalizedEmail}:`, error.message);
  }

  notification.attemptsCount += 1;
  await notification.save();
  return notification;
};

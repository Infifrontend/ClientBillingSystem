
import nodemailer from 'nodemailer';
import type { Request, Response } from 'express';

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  html?: string;
  cc?: string;
  bcc?: string;
}

export async function sendEmail(req: Request, res: Response) {
  try {
    const { to, subject, message, cc, bcc }: EmailRequest = req.body;

    // Validate required fields
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and message are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
      });
    }

    // Create transporter with environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();

    const { html, ...restBody } = req.body;
    
    // Email options
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Infiniti CMS'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: message,
      html: html || `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
      </div>`,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[INFO] Email sent successfully:', info.messageId);

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to send email:', error);

    // Handle specific errors
    if (error.code === 'EAUTH') {
      return res.status(401).json({
        success: false,
        error: 'SMTP authentication failed. Please check your email credentials.',
      });
    }

    if (error.code === 'ECONNECTION') {
      return res.status(503).json({
        success: false,
        error: 'Failed to connect to email server. Please check your SMTP settings.',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
}

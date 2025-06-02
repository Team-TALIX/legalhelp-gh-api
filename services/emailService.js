import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_PASS, EMAIL_USER, FRONTEND_URL,EMAIL_FROM, NODE_ENV } from '../utils/config.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure different email providers based on environment
    const emailConfig = {
      host: EMAIL_HOST || 'smtp.gmail.com',
      port: EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    };

    // For development, use Ethereal Email (test account)
    if (NODE_ENV === 'development' && !EMAIL_USER) {
      emailConfig.host = 'smtp.ethereal.email';
      emailConfig.port = 587;
      emailConfig.auth = {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      };
    }

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendEmailVerification(email, token, preferredLanguage = 'en') {
    const verificationUrl = `${FRONTEND_URL}/verify/email?token=${token}`;

    const templates = {
      en: {
        subject: 'Verify Your Email - LegalHelp GH',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e17c64;">Welcome to LegalHelp GH!</h2>
            <p>Thank you for registering with LegalHelp GH. Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #e17c64; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              If you didn't create an account with LegalHelp GH, please ignore this email.
            </p>
          </div>
        `,
        text: `Welcome to LegalHelp GH! Please verify your email by visiting: ${verificationUrl} (expires in 24 hours)`
      },
      twi: {
        subject: 'Di Wo Email - LegalHelp GH',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e17c64;">Akwaaba LegalHelp GH!</h2>
            <p>Yɛda wo ase sɛ wode wo din kyerɛw LegalHelp GH mu. Yɛsrɛ wo di wo email ho adanse na wie wo nhyɛmu no.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #e17c64; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Di Email Ho Adanse
              </a>
            </div>
            <p>Sɛ button no nyɛ adwuma a, wobɛtumi de link yi akɔ wo browser mu:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>Link yi bɛba awieɛ nnɔnhwerew 24 akyi.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              Sɛ woannyɛ account wɔ LegalHelp GH a, bu email yi gu.
            </p>
          </div>
        `,
        text: `Akwaaba LegalHelp GH! Yɛsrɛ wo di wo email ho adanse: ${verificationUrl}`
      }
    };

    const template = templates[preferredLanguage] || templates.en;

    const mailOptions = {
      from: `"LegalHelp GH" <${EMAIL_FROM || EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    };


    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email, token, preferredLanguage = 'en') {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const templates = {
      en: {
        subject: 'Reset Your Password - LegalHelp GH',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e17c64;">Password Reset Request</h2>
            <p>You have requested to reset your password for your LegalHelp GH account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #e17c64; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        `,
        text: `Reset your LegalHelp GH password: ${resetUrl} (expires in 1 hour)`
      }
    };

    const template = templates[preferredLanguage] || templates.en;

    const mailOptions = {
      from: `"LegalHelp GH" <${EMAIL_FROM || EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    console.log(mailOptions);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent: ' + info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Password reset email failed:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email, name, preferredLanguage = 'en') {
    const templates = {
      en: {
        subject: 'Welcome to LegalHelp GH!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e17c64;">Welcome to LegalHelp GH, ${name || 'there'}!</h2>
            <p>Your account has been successfully verified. You now have access to all our legal assistance features:</p>
            <ul style="line-height: 1.6;">
              <li>🗣️ <strong>Multilingual Legal Chat</strong> - Ask questions in Twi, Ewe, Dagbani, or English</li>
              <li>🎤 <strong>Voice Interface</strong> - Speak your questions and hear responses</li>
              <li>📚 <strong>Legal Topic Library</strong> - Browse organized legal information</li>
              <li>👥 <strong>Community Stories</strong> - Share and learn from others' experiences</li>
              <li>🏢 <strong>Legal Aid Directory</strong> - Find legal services in your area</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard"
                 style="background-color: #e17c64; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Start Using LegalHelp GH
              </a>
            </div>
            <p>If you have any questions, feel free to reach out to us.</p>
            <p>Know Your Rights, In Your Language!</p>
          </div>
        `,
        text: `Welcome to LegalHelp GH! Your account is now verified and ready to use. Visit ${FRONTEND_URL}/dashboard to get started.`
      }
    };

    const template = templates[preferredLanguage] || templates.en;

    const mailOptions = {
      from: `"LegalHelp GH" <${EMAIL_FROM || EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent: ' + info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Welcome email failed:', error);
      // Don't throw error for welcome email - it's not critical
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();

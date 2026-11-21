import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage, EmailSender } from './enquiry.js';

interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

/**
 * Sends email over SMTP. Locally this points at Mailpit (a fake inbox in Docker),
 * so reviewers need no email account. In production it can point at Amazon SES SMTP.
 */
export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;

  constructor(private readonly options: SmtpOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.user ? { user: options.user, pass: options.pass } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.options.from, ...message });
  }
}

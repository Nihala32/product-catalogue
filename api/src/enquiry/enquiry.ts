import { z } from 'zod';
import type { Product } from '../products/product.js';

export const enquirySchema = z.object({
  productId: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.email('Enter a valid email address').max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s()-]*$/, 'Phone can only contain digits, spaces and + ( ) -')
    .optional()
    .default(''),
  message: z.string().trim().max(2000).optional().default(''),
  // Honeypot: hidden in the form. Real users leave it empty; simple bots fill it in.
  website: z.string().max(0).optional(),
});

export type Enquiry = z.infer<typeof enquirySchema>;

export interface EmailMessage {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** Sends email (SMTP today; SES, SendGrid or a CRM later). */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/** Builds the plain-text email the sales inbox receives. */
export function buildEnquiryEmail(
  enquiry: Enquiry,
  product: Product,
  salesInbox: string,
): EmailMessage {
  // Strip line breaks from anything that goes into a header-like line.
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ');
  return {
    to: salesInbox,
    replyTo: enquiry.email,
    subject: oneLine(`New enquiry: ${product.title}`),
    text: [
      `Product: ${product.title} (ID ${product.id})`,
      `Price: ${product.price.toFixed(2)}`,
      '',
      `Name: ${oneLine(enquiry.name)}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone || 'Not provided'}`,
      '',
      'Message:',
      enquiry.message || '(no message)',
    ].join('\n'),
  };
}

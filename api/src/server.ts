import { loadConfig } from './config.js';
import { SmtpEmailSender } from './enquiry/smtpEmailSender.js';
import { createApp } from './http/app.js';
import { CatalogueService } from './products/catalogueService.js';
import { FakeStoreProductSource } from './products/fakeStoreSource.js';

// Composition root: the only place that picks concrete implementations.
// Swapping the product source or email provider means changing this file, not the app.
const config = loadConfig();

const source = new FakeStoreProductSource({
  baseUrl: config.PRODUCT_API_BASE_URL,
  cacheTtlMs: config.PRODUCT_CACHE_TTL_SECONDS * 1000,
  timeoutMs: 5000,
});

const emailSender = new SmtpEmailSender({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  from: config.MAIL_FROM,
});

const app = createApp({
  catalogue: new CatalogueService(source, config.featuredIds),
  emailSender,
  salesInbox: config.SALES_INBOX,
  corsOrigin: config.CORS_ORIGIN,
});

app.listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});

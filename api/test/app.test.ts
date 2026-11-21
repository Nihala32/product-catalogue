import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/http/app.js';
import { CatalogueService } from '../src/products/catalogueService.js';
import { UpstreamError } from '../src/products/fakeStoreSource.js';
import { FakeEmailSender, InMemoryProductSource } from './fixtures.js';

const validEnquiry = {
  productId: '3',
  name: 'Jane Customer',
  email: 'jane@example.com',
  phone: '+971 50 123 4567',
  message: 'Is this available in size 7?',
};

describe('API', () => {
  let emailSender: FakeEmailSender;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    emailSender = new FakeEmailSender();
    app = createApp({
      catalogue: new CatalogueService(new InMemoryProductSource(), ['3', '1', '9', '5', '6']),
      emailSender,
      salesInbox: 'sales@example.com',
      corsOrigin: 'http://localhost:5173',
    });
  });

  it('GET /api/products/featured returns 5 products', async () => {
    const res = await request(app).get('/api/products/featured');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  it('GET /api/categories/:category returns top rated and other products', async () => {
    const res = await request(app).get('/api/categories/electronics');
    expect(res.status).toBe(200);
    expect(res.body.topRated).toHaveLength(3);
    expect(res.body.others).toHaveLength(1);
  });

  it('GET /api/categories/:category returns 404 for an unknown category', async () => {
    const res = await request(app).get('/api/categories/toys');
    expect(res.status).toBe(404);
  });

  it('GET /api/products/search filters by the term', async () => {
    const res = await request(app).get('/api/products/search').query({ q: 'ring' });
    expect(res.status).toBe(200);
    expect(res.body.map((p: { id: string }) => p.id)).toEqual(['3']);
  });

  it('GET /api/products/search rejects an empty term', async () => {
    const res = await request(app).get('/api/products/search').query({ q: '  ' });
    expect(res.status).toBe(400);
  });

  it('GET /api/products/:id returns the product or 404', async () => {
    expect((await request(app).get('/api/products/3')).body.title).toBe('Silver Ring');
    expect((await request(app).get('/api/products/999')).status).toBe(404);
  });

  describe('POST /api/enquiries', () => {
    it('emails the sales inbox and returns a thank-you message', async () => {
      const res = await request(app).post('/api/enquiries').send(validEnquiry);

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/thank you/i);
      expect(emailSender.sent).toHaveLength(1);
      const email = emailSender.sent[0];
      expect(email.to).toBe('sales@example.com');
      expect(email.replyTo).toBe('jane@example.com');
      expect(email.subject).toContain('Silver Ring');
      expect(email.text).toContain('Jane Customer');
      expect(email.text).toContain('Is this available in size 7?');
    });

    it('rejects invalid contact details and sends nothing', async () => {
      const res = await request(app)
        .post('/api/enquiries')
        .send({ ...validEnquiry, name: '', email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.fields.map((f: { field: string }) => f.field)).toEqual(['name', 'email']);
      expect(emailSender.sent).toHaveLength(0);
    });

    it('rejects submissions that fill the hidden honeypot field', async () => {
      const res = await request(app)
        .post('/api/enquiries')
        .send({ ...validEnquiry, website: 'http://spam.example' });
      expect(res.status).toBe(400);
      expect(emailSender.sent).toHaveLength(0);
    });

    it('returns 404 for an unknown product', async () => {
      const res = await request(app)
        .post('/api/enquiries')
        .send({ ...validEnquiry, productId: '999' });
      expect(res.status).toBe(404);
      expect(emailSender.sent).toHaveLength(0);
    });

    it('returns a 500 without details when the email provider fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      emailSender.send = async () => {
        throw new Error('SMTP connection refused');
      };
      const res = await request(app).post('/api/enquiries').send(validEnquiry);
      expect(res.status).toBe(500);
      expect(JSON.stringify(res.body)).not.toContain('SMTP');
    });

    it('rate limits repeated enquiries from the same client', async () => {
      const limited = createApp({
        catalogue: new CatalogueService(new InMemoryProductSource(), []),
        emailSender,
        salesInbox: 'sales@example.com',
        corsOrigin: '*',
        enquiryRateLimit: 2,
      });
      await request(limited).post('/api/enquiries').send(validEnquiry);
      await request(limited).post('/api/enquiries').send(validEnquiry);
      const res = await request(limited).post('/api/enquiries').send(validEnquiry);
      expect(res.status).toBe(429);
    });
  });

  it('returns 502 when the product source is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = new InMemoryProductSource();
    failing.listProducts = async () => {
      throw new UpstreamError('down');
    };
    const broken = createApp({
      catalogue: new CatalogueService(failing, []),
      emailSender,
      salesInbox: 'sales@example.com',
      corsOrigin: '*',
    });
    const res = await request(broken).get('/api/products/featured');
    expect(res.status).toBe(502);
  });
});

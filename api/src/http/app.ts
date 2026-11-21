import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { buildEnquiryEmail, enquirySchema, type EmailSender } from '../enquiry/enquiry.js';
import type { CatalogueService } from '../products/catalogueService.js';
import { UpstreamError } from '../products/fakeStoreSource.js';

export interface AppDeps {
  catalogue: CatalogueService;
  emailSender: EmailSender;
  salesInbox: string;
  corsOrigin: string;
  /** Max enquiries per IP per 15 minutes. */
  enquiryRateLimit?: number;
}

const searchQuery = z.object({
  q: z.string().trim().min(1, 'Enter a search term').max(100),
});

export function createApp(deps: AppDeps) {
  const app = express();
  // The API sits behind one proxy (nginx in Docker, a load balancer on AWS).
  // Trusting it lets the rate limiter see the real client IP.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: deps.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.get('/products/featured', async (_req, res) => {
    res.json(await deps.catalogue.getFeatured());
  });

  api.get('/products/search', async (req, res) => {
    const { q } = searchQuery.parse(req.query);
    res.json(await deps.catalogue.search(q));
  });

  api.get('/products/:id', async (req, res) => {
    const product = await deps.catalogue.getProduct(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  });

  api.get('/categories', async (_req, res) => {
    res.json(await deps.catalogue.getCategories());
  });

  api.get('/categories/:category', async (req, res) => {
    const page = await deps.catalogue.getCategory(req.params.category);
    if (!page) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(page);
  });

  const enquiryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: deps.enquiryRateLimit ?? 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many enquiries. Please try again later.' },
  });

  api.post('/enquiries', enquiryLimiter, async (req, res) => {
    const enquiry = enquirySchema.parse(req.body);
    const product = await deps.catalogue.getProduct(enquiry.productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await deps.emailSender.send(buildEnquiryEmail(enquiry, product, deps.salesInbox));
    res.status(201).json({ message: 'Thank you for your enquiry. Our sales team will be in touch.' });
  });

  app.use('/api', api);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler: map known errors to clear responses, never leak stack traces.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request',
        fields: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }
    if (err instanceof UpstreamError) {
      console.error(err);
      res.status(502).json({ error: 'Products are temporarily unavailable. Please try again.' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}

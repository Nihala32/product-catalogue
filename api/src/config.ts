import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PRODUCT_API_BASE_URL: z.url().default('https://fakestoreapi.com'),
  PRODUCT_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  FEATURED_PRODUCT_IDS: z.string().default('1,5,9,13,17'),
  SALES_INBOX: z.email().default('sales@example.com'),
  MAIL_FROM: z.string().default('Catalogue <no-reply@example.com>'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type Config = z.infer<typeof envSchema> & { featuredIds: string[] };

/** Reads and validates environment variables once at startup, so bad config fails fast. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.parse(env);
  return {
    ...parsed,
    featuredIds: parsed.FEATURED_PRODUCT_IDS.split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  };
}

# Product Catalogue – Proof of Concept

A small product catalogue where customers can browse featured products, browse by category, search, view product details and send an enquiry to the sales team.

It is built as a **foundation to grow**, not a throwaway prototype: the product data source, the email provider and the look and feel can each be replaced without rewriting the rest.

## Stack and why

| Layer | Choice | Why |
|---|---|---|
| Client | **React + TypeScript** (Vite, React Router) | Web works on any device with no app-store step, which suits an MVP the owner wants to click through. TypeScript catches mistakes early and is shared with the backend. |
| Backend | **Node.js + TypeScript** (Express 5) | Same language on both sides, small and well known. Express is enough for a handful of endpoints. |
| Email (local) | **Mailpit** (Docker) | A fake inbox, so the reviewer needs no email account or paid service. |
| Packaging | **Docker Compose** | One command to run everything. The images can run on AWS (ECS/Fargate or App Runner). |

## Run it (about 2 minutes)

You need **Docker Desktop**. No accounts or API keys are needed.

```bash
docker compose up --build
```

Then open:

| What | URL |
|---|---|
| Catalogue | http://localhost:8080 |
| Sales inbox (Mailpit) – enquiry emails appear here | http://localhost:8025 |

Stop with `Ctrl + C`, then `docker compose down`.

**Configuration is optional.** To change settings (featured products, sales inbox address, SMTP provider), copy `.env.example` to `.env` and edit it. Never commit `.env`.

> The products come from the public [Fake Store API](https://fakestoreapi.com) through our backend, so the machine running Docker needs internet access. If that API is down, the site shows a clear "temporarily unavailable" message instead of breaking.

## Try the acceptance criteria

1. **Home page:** the 5 chosen "top rated" products are shown.
2. **Category page:** click a category in the bar under the header. You see the top rated products, then the other products in that category.
3. **Search:** type e.g. `jacket` and click **Search**. Only matching products are shown.
4. **Product page:** click any product tile.
5. **Enquiry:** on a product page click **Enquire**, fill in your name and email, and click **Send enquiry**. You see a thank-you message, and the email appears in Mailpit at http://localhost:8025.

## Run the tests

```bash
cd api && npm install && npm test    # 27 tests: business rules, API routes, Fake Store mapping
cd web && npm install && npm test    # 8 tests: the user journeys for each acceptance criterion
```

## Run without Docker (for development)

```bash
# Terminal 1 – fake inbox
docker run --rm -p 8025:8025 -p 1025:1025 axllent/mailpit:v1.34.0

# Terminal 2 – API on http://localhost:3000
cd api && npm install && npm run dev

# Terminal 3 – web app on http://localhost:5173 (proxies /api to the API)
cd web && npm install && npm run dev
```

## How it is organised

```
api/                         Node.js + TypeScript backend
  src/products/product.ts      Our Product model + ProductSource interface
  src/products/fakeStoreSource.ts   Fake Store implementation (validation, caching, timeouts)
  src/products/catalogueService.ts  Business rules: featured, categories, search
  src/enquiry/enquiry.ts       Enquiry validation, email content, EmailSender interface
  src/enquiry/smtpEmailSender.ts    SMTP implementation (Mailpit locally, SES in production)
  src/http/app.ts              Routes, security middleware, error handling
  src/server.ts                Wires the real implementations together
  test/                        Vitest + Supertest
web/                         React + TypeScript client
  src/api/client.ts            The only place that calls the backend
  src/pages/                   Home, Category, Search, Product
  src/components/              Layout (header, search, categories), product grid, enquiry form
  src/test/                    Vitest + Testing Library
```

### API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/products/featured` | The 5 featured products |
| GET | `/api/categories` | Category names |
| GET | `/api/categories/:category` | `{ category, topRated, others }` |
| GET | `/api/products/search?q=term` | Matching products |
| GET | `/api/products/:id` | One product |
| POST | `/api/enquiries` | Sends the email, returns a thank-you message |
| GET | `/api/health` | Health check |

See [DECISIONS.md](DECISIONS.md) for assumptions and trade-offs, and [AI_USAGE.md](AI_USAGE.md) for how AI tools were used.

# Decisions and assumptions

## Assumptions (where the acceptance criteria left gaps)

| Area | Assumption | Why |
|---|---|---|
| "I have chosen 5 products to be top rated" | The owner chooses them by product ID in configuration (`FEATURED_PRODUCT_IDS`), shown in the order given. If a chosen ID no longer exists, the slot is filled with the next best-rated product, so the home page always shows 5. | The criterion says the owner *chooses* them, so they are curated, not calculated. There is no admin screen in the MVP, so configuration is the simplest honest way to "choose". |
| "Top rated products for that category" | The 3 products in the category with the highest Fake Store rating (ties broken by number of ratings). The rest are "additional products", best rated first. | Curating every category by hand is not realistic yet, and the data already has ratings. The count (3) is a constant in one place. |
| Search matching | A case-insensitive match of the whole term (trimmed) anywhere in the title, description or category. An empty term is rejected. | "Text matching that search term" is the simplest reading. It is predictable, and easy to replace with a proper search engine later. |
| Search location | Search runs on the backend, and the term is kept in the URL (`/search?q=`). | Keeps the rule in one place, and lets people share or bookmark results and use the back button. |
| Enquiry form fields | Name and email are required; phone and message are optional. | Enough for sales to reply, without making the form a barrier. |
| Sales inbox | One address, set in configuration (`SALES_INBOX`). The customer's email is used as `Reply-To`, so sales can reply directly. | No routing rules were given. |
| Customer confirmation email | Not sent. The customer sees an on-screen thank-you message, as the criteria ask. | The criteria only mention the sales inbox. Sending email to customers also needs a verified domain and anti-abuse work. |
| Currency | Prices are shown in USD. | Fake Store prices have no currency; USD is the API's implied currency. |
| Platform | Web only, responsive layout. | One client is enough for a proof of concept, and web is the fastest for the owner to try. |

## Requirements dropped or simplified

- **No database or admin screen.** Featured products are set in configuration. Product data is placeholder data, so a CMS or admin UI would be built against the wrong model.
- **No pagination.** Fake Store has 20 products. The API returns full lists; pagination is the first change when a real data source arrives.
- **Plain styling.** The creative team is still working on the look and feel, so the UI is deliberately simple. Colours and spacing live in CSS variables.
- **In-memory product cache** (5 minutes) instead of a shared cache such as Redis. Enough for one instance.
- **Simple spam protection:** a hidden honeypot field and rate limiting (10 enquiries per IP per 15 minutes), not a CAPTCHA, which would need a third-party account.

## How the design supports growth beyond the PoC

- **Product data source can be swapped.** The app depends on our own `Product` model and the `ProductSource` interface, never on the Fake Store's shape. To move to a database, Shopify or a PIM, add a new class that implements `ProductSource` and select it in `server.ts`. Routes, business rules and the frontend do not change.
- **Email provider can be swapped.** Enquiries go through the `EmailSender` interface. Today it is SMTP (Mailpit locally, and Amazon SES SMTP works by changing environment variables). An SES API, SendGrid or CRM integration is a new class.
- **Look and feel can change.** The frontend only reaches the backend through `src/api/client.ts`, and styling is plain CSS with variables, so a redesign or a component library does not touch data logic.
- **Clear boundaries.** The browser only talks to our API (same origin through nginx). The API is the only thing that talks to the product source or the email provider, so keys and business rules never reach the client.
- **Business rules are testable on their own.** `CatalogueService` contains the rules (featured, top rated, search) and is tested with an in-memory product source.
- **Ready for AWS.** Two stateless containers and environment-based configuration. They can run on ECS Fargate or App Runner, with SES for email and Secrets Manager for credentials.

## Security basics included

- Input validation with Zod on every request that takes input, with clear field errors.
- Upstream data validated too, so a change in the Fake Store API fails clearly instead of breaking pages.
- Helmet security headers, CORS restricted to the web origin, a 10 KB JSON body limit, and rate limiting on enquiries.
- Line breaks removed from user input that goes into the email subject and name lines.
- Errors are logged on the server; clients get a generic message, never stack traces or provider details.
- No secrets in the repo; `.env.example` documents all settings.

## What I would do next with another day

1. **Design system:** apply the creative team's look and feel, and add loading skeletons and images with proper sizes.
2. **Product source adapter for the real data** (likely a headless CMS or database), with pagination and server-side sorting.
3. **Admin for featured products**, or move the chosen IDs into the data source.
4. **Production email:** Amazon SES with a verified domain, plus a customer confirmation email. Store enquiries before sending, so none are lost if email fails.
5. **End-to-end test** with Playwright against Docker Compose, and a CI pipeline (GitHub Actions) that runs tests and builds images on every pull request.
6. **Observability:** structured logs with request IDs, and alerts if the product source or email provider fails.

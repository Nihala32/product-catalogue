# Instructions for AI coding agents

This file guides AI assistants (Claude) working in this repository.

## Project

Product catalogue proof of concept: React + TypeScript client (`web/`), Node.js + TypeScript API (`api/`), Docker Compose with Mailpit for local email.

## Architecture rules

- The client never calls the Fake Store API (or any product source) directly. All data goes through `api/`.
- Code outside `api/src/products/fakeStoreSource.ts` must not depend on the Fake Store data shape. Use the `Product` model and the `ProductSource` interface.
- Email goes through the `EmailSender` interface. Do not call nodemailer outside `smtpEmailSender.ts`.
- Business rules live in `CatalogueService`, not in routes or React components.
- In the client, only `web/src/api/client.ts` calls `fetch`.
- `api/src/server.ts` is the only place that chooses concrete implementations.

## Code standards

- TypeScript strict mode. No `any`.
- Validate all external input (request bodies, query strings, upstream API data) with Zod.
- Do not leak internal error details to clients. Log them on the server.
- Never commit secrets. Add new settings to `api/src/config.ts` and `.env.example`.
- Keep the UI accessible: labels on inputs, roles on status and error messages.

## Before finishing a change

- Run `npm test` and `npm run typecheck` in both `api/` and `web/`.
- Add or update a test for any change to behaviour on the critical path.
- Update `DECISIONS.md` if you make a new assumption or trade-off.

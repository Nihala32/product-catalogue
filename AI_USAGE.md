# AI usage

## Tools and models

- **Claude (Claude Opus 5.5)** in the Claude app, with tools to write files and run commands. It planned, wrote the code, ran the tests and drafted these documents, following my direction.
- I reviewed the code, ran the app on my laptop with Docker, and I own every decision in this repository.

## Agent instruction file

[`CLAUDE.md`](CLAUDE.md) is committed. It records the architecture rules (no direct product-source calls from the client, interfaces for products and email, business rules in one service) and the checks to run before finishing a change. Any future AI-assisted change should follow it.

## Plan

1. Read the brief and pick a stack: React + TypeScript web client, Node.js + TypeScript API, Docker Compose, Mailpit as a local inbox (no accounts needed).
2. Design for change first: our own `Product` model, a `ProductSource` interface, an `EmailSender` interface, and one composition root (`server.ts`).
3. Backend: Fake Store adapter (validation, cache, timeout), `CatalogueService` rules, routes, validation, rate limiting, error handling, tests.
4. Frontend: one API client module, pages for each acceptance criterion, enquiry form with field errors and a thank-you message, tests for each user journey.
5. Docker images, Compose file and `.env.example`.
6. Smoke test the built app end to end, then write the README, decisions and this file.

## Key prompts and moments

1. **Pasting the full brief and asking for a submission that meets it.** The first thing the AI produced was the plan above, which put the interfaces (`ProductSource`, `EmailSender`) before any features, because the brief says the data source, look and feel and email provider will change.
2. **Choosing how to send email without paid accounts.** The options were logging the email to the console, or a real SMTP flow to a local fake inbox. We chose SMTP to Mailpit, so the reviewer sees a real email arrive and production only needs new SMTP settings (for example Amazon SES).
3. **Defining "top rated".** The criteria say the owner *chooses* 5 products, so the home page uses configured IDs rather than calculating them. For categories nobody chooses, so the top 3 by rating are used. Both are written down in DECISIONS.md.
4. **End-to-end smoke test.** The Fake Store API could not be reached from the AI's sandbox, so the built app was tested against a local mock of the Fake Store API and a local SMTP server. This confirmed featured, category, search, enquiry validation and the email content end to end.

## Where the AI got things wrong, and how it was caught

| Problem | How it was caught | Fix |
|---|---|---|
| `npm install` pulled TypeScript 7 into the web app while the API used 5.9 | Reviewing `package.json` after install | Pinned TypeScript 5.9 in both packages for consistency |
| Used `React.ReactNode` without importing React types | Type check (`tsc`) failed | Imported `ReactNode` explicitly |
| `vite.config.ts` used `process.env` without Node types | Type check failed | Added `@types/node` |
| Added an `eslint-disable` comment for a lint plugin that is not installed | Code review | Replaced it with a comment explaining why the hook takes explicit dependencies |
| The rate limiter would have counted every request as coming from nginx, so one user could block everyone | Review of how requests reach the API in Docker | Set Express `trust proxy` to 1 so the real client IP is used |
| The first smoke test email failed with "certificate has expired" | Smoke test | Caused by the mock SMTP server offering TLS with an expired built-in certificate. Mailpit does not, so no code change; the mock was fixed |

## My own review

<!-- Amina: add 2–3 things you checked or changed yourself after reading the code, for example
     a question you asked, a behaviour you tested in the browser, or wording you changed. -->

## Time spent

| Activity | Time |
|---|---|
| Planning (reading the brief, choosing the stack and assumptions) | ~15 min |
| Building with AI (backend, frontend, Docker) | ~45 min |
| Testing (unit tests, end-to-end smoke test) | ~15 min |
| Reviewing the code and running it locally | <!-- Amina: fill in --> |
| **Total** | <!-- Amina: fill in --> |

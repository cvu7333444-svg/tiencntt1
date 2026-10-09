# Repository instructions

## Build, run, and check

- Install dependencies with `npm install`.
- Copy `.env.example` to `.env` and configure `MONGODB_URI` and `JWT_SECRET` before running the app. QR bank details use the `FUND_BANK_*` variables; image uploads use Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.
- Run the development server with `npm run dev`.
- Create a production build with `npm run build`, then serve it with `npm start`.
- Run the configured lint command with `npm run lint` (`next lint`).
- Create the sample users and data with `npm run seed`.
- There is currently no test script, test runner, or test files in the repository, so there is no single-test command.

## Architecture and data flow

- This is a Next.js 14 App Router application. UI pages and layouts live under `app/`; HTTP API handlers are colocated under `app/api/` and export functions named for their HTTP methods.
- The root layout wraps pages in the shared auth, theme, and toast providers and registers the PWA. Interactive client pages compose shared pieces from `components/` and call the API with `fetch`.
- API handlers read the signed HTTP-only auth cookie through `getCurrentUser` in `lib/auth.js`. The middleware gates selected page routes, but its matcher excludes `/api`; each API handler must therefore enforce authentication and the appropriate `admin`/`member` role itself.
- MongoDB persistence is defined by the Mongoose schemas in `lib/models.js` (users, campaigns, contributions, transactions, and settings). Handlers connect through `lib/mongodb.js`, which caches the Mongoose connection for serverless reuse. Use the shared models and connection helper rather than creating separate connections or schemas in handlers.
- A campaign has one contribution per user. Contributions move through `pending`, `self_pending`, `approved`, and `rejected`; approving one creates its associated incoming `Transaction`, which is what the ledger and balance summaries report. Keep that link and status transition in sync when changing payment or approval behavior.
- QR payment details are resolved by `lib/qr.js`; image uploads go through `lib/upload.js` and use Vercel Blob when configured, with a limited base64 fallback. Bank settings can also be stored in the database, as described in `README.md`.
- The Mongoose model names and roles are `User`, `Campaign`, `Contribution`, `Transaction`, `Settings` and `admin`/`member`. Preserve these values when reading or writing records; many screens and route handlers depend on them.

## Codebase-specific conventions

- Source is JavaScript/JSX with ES modules. The `@/` import alias maps to the repository root (`jsconfig.json`); use it for shared modules such as `@/lib/auth`.
- Keep database access in API route handlers or shared `lib/` modules. Read-only Mongoose queries commonly use `.lean()`; populate referenced documents where the response needs related user, campaign, or contribution data.
- Keep browser-specific work in client components (marked with `"use client"`), and use the existing providers, `AppShell`, UI components, and toast API for shared behavior.
- Use the existing `lib/format.js` helpers for currency and date display, Tailwind utility classes for styling, and the existing icon set (`lucide-react`). User-facing interface text is generally Vietnamese.
- Use `.env.example` and the environment-variable names documented in `README.md`; never put environment-specific values in application code.

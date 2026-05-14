# WorkFlowGuard

Employee productivity and retention tooling on top of **Next.js 16**, **Drizzle ORM**, and **Neon Postgres**. HR and managers use the admin console; developers use protected workspaces with activity and focus tracking. Metrics come from your database, not demo fixtures.

## Prerequisites

- Node.js 20+
- A Postgres database (e.g. [Neon](https://neon.tech)) and `DATABASE_URL`
- A `SESSION_SECRET` of at least 32 characters

## Setup

1. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`: set `DATABASE_URL`, `SESSION_SECRET`, and optionally Resend keys for invite emails (see below).

2. **Install and database schema**

   ```bash
   npm install
   npm run db:push
   ```

   If `db:push` is not available in your environment, use:

   ```bash
   npm run db:apply
   ```

3. **First-time onboarding (empty `users` table only)**

   - Start the app: `npm run dev`
   - Open [http://localhost:3000/setup](http://localhost:3000/setup) and create the first organization and HR user.

   If you see **“Setup already completed”**, your database already has users (previous onboarding or `npm run db:seed`). Use [Sign in](http://localhost:3000/login) instead, or point `DATABASE_URL` at a **new empty** database to run setup again.

4. **Optional demo data**

   ```bash
   npm run db:seed
   ```

   Creates a demo org, HR (`hr@demo.local`), and developer (`dev@demo.local`) — only if `hr@demo.local` does not exist.

## Scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`  | Development server                               |
| `npm run build`| Production build                                 |
| `npm run db:push` | Push Drizzle schema to the database           |
| `npm run db:apply` | Apply SQL from `scripts/apply-schema.ts`     |
| `npm run db:studio` | Drizzle Studio                               |
| `npm run db:seed`   | Optional seed (see above)                    |

## Credential email (Resend)

To email temporary passwords when HR creates developer or tester accounts, configure in `.env`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
MAIL_FROM="WorkFlowGuard <no-reply@your-domain.com>"
APP_LOGIN_URL=http://localhost:3000/login
```

If these are unset, user creation still works; the API reports that email was not sent.

## Browser extension (tab tracking)

Developers can load the unpacked Chrome extension from `browser-extension/` and paste a token from the workspace (**Generate extension token**). See `browser-extension/README.md` for steps.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)

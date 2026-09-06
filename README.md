# Deal Event Tracker

Internal app for Defpro Global: team members log deal events, owners close them, and a daily email lists everything still open.

## Local mock mode (no Supabase)

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If `NEXT_PUBLIC_SUPABASE_URL` is not set, the app uses in-browser mock data and mock login.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@company.com | password |
| Owner 1 | owner1@company.com | password |
| Owner 2 | owner2@company.com | password |
| Team member | rahul@company.com | password |
| Team member | meera@company.com | password |

Session and mock data persist in `localStorage`. Clear site data to reset.

## Production stack

- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase Auth + PostgreSQL + RLS
- Resend for email
- Vercel for hosting and cron

## Roles and event status

- **Team:** view deals, create events, comment on **open** events.
- **Owner:** same, plus **Done** (`closed`) and **NA**. Comment mail goes to the event creator.
- **Admin:** manage deals and users, plus owner actions.

Event status is **open**, **closed**, or **na**. Closed/NA events cannot be commented on.

## Environment variables

Copy `.env.example` to `.env.local` (and into the Vercel project):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM="Defpro Global <onboarding@resend.dev>"
CRON_SECRET=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `CRON_SECRET` to the browser.

Until a company sending domain is verified in Resend, keep `EMAIL_FROM` on `onboarding@resend.dev`. Resend will only deliver to the email on that Resend account.

## Supabase setup

1. Create a Supabase project.
2. Keep **Email** auth enabled. Turn **off** public signup. Users are created by an admin (or the first user below).
3. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL editor.
4. Create the first admin in **Authentication → Users → Add user** (email + password, auto-confirm).
5. Promote that user:

```sql
update public.profiles
set role = 'admin', name = 'Your Name'
where email = 'you@example.com';
```

The `handle_new_user` trigger copies Auth users into `profiles`. Admin-created users get their name and role from metadata.

## Daily email

Vercel Cron calls `GET /api/cron/daily-summary` at **08:00 India Standard Time** (`30 2 * * *` UTC). Set `CRON_SECRET`; Vercel sends `Authorization: Bearer $CRON_SECRET`.

The email lists every **open** event, sorted Urgent → High → Normal → Low, oldest first within a priority. Recipients are every **active** admin, owner, and team member.

Change the schedule in [`vercel.json`](vercel.json) if needed.

## Vercel deployment

1. Push the repo to GitHub and import the project in Vercel.
2. Set the environment variables above (Production, and Preview if you want those to hit the same Supabase project).
3. Set `NEXT_PUBLIC_APP_URL` to the production URL so “Open tracker” links in email work.
4. Deploy. Confirm the cron job appears under **Cron Jobs**.
5. Sign in as the admin you created in Supabase, then add owners and team users in **Users**.

## Project layout

```text
app/                  pages and API routes
components/           deals, events, layout, ui
lib/auth/             session and admin checks
lib/supabase/         browser, server, service-role clients
lib/store/            mock vs Supabase data store
lib/email/            daily summary and comment mail
supabase/migrations/  schema, constraints, RLS
proxy.ts              refreshes the Supabase auth session
```

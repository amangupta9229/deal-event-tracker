# Deal Event Tracker

Internal app for Defpro Global: team members log **actions** on **orders**, owners close them, and daily email covers everything still open. URLs stay under `/deals`.

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

## Roles, assignment, and status

- **Team:** view orders, create actions, comment on **open** actions. Cannot change Assigned to.
- **Owner:** same, plus **Done** (`closed`) and **NA**, plus change Assigned to on orders and actions.
- **Admin:** manage orders and users, plus owner actions. Admins are not in the Assigned to list.

Assigned to is **required** and independent on the order and the action. Only active **owners and team** can be picked. When a team member creates an action, it inherits the order assignee.

Action status is **open**, **closed**, or **na**. Closed/NA actions cannot be commented on.

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
3. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL editor, then [`supabase/migrations/0002_assigned_to.sql`](supabase/migrations/0002_assigned_to.sql).
4. Create the first admin in **Authentication → Users → Add user** (email + password, auto-confirm).
5. Promote that user:

```sql
update public.profiles
set role = 'admin', name = 'Your Name'
where email = 'you@example.com';
```

The `handle_new_user` trigger copies Auth users into `profiles`. Admin-created users get their name and role from metadata.

## Email

Vercel Cron calls `GET /api/cron/daily-summary` at **08:00 India Standard Time** (`30 2 * * *` UTC). Set `CRON_SECRET`; Vercel sends `Authorization: Bearer $CRON_SECRET`.

At 8am (and from **Email open actions**):

- **Owners and admin** get every open action (`Defpro Global — all open orders & actions`).
- Each assignee gets a personal list (`Defpro Global — assigned to you`).

Assigning or changing Assigned to also emails the new assignee immediately.

A comment emails the action creator (if not the author), plus the **order assignee** and **action assignee**. Team comments also go to active owners.

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
lib/email/            daily summary, assignment, and comment mail
supabase/migrations/  schema, constraints, RLS
proxy.ts              refreshes the Supabase auth session
```

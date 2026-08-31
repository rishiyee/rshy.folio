This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Multiplayer visitor lounge

The desktop uses Supabase Realtime Presence and Broadcast for anonymous visitor count, live preset feedback signals, and multiplayer cursors. Create a Supabase project, then copy its Project URL and publishable key from the project's **Connect** dialog:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Add both variables in Vercel under **Project Settings → Environment Variables** for Production and Preview deployments. Production visitors share the `portfolio-production` channel; preview deployments are isolated by deployment hostname. If either variable is omitted, multiplayer is disabled and the portfolio continues to work normally.

### Persisting lounge feedback

Run `supabase/migrations/20260831000000_create_portfolio_signals.sql` in the Supabase SQL Editor (or apply it with the Supabase CLI). Signals are saved to `public.portfolio_signals`. Anonymous visit sessions and approximate time spent are saved to `public.portfolio_visits`; a heartbeat updates the session every 30 seconds.

The included Row Level Security policies prevent public visitors from reading individual logs. The public stats function exposes only aggregate visit count and average time. Review individual responses and visits from the Supabase Table Editor or with an authenticated server-side/admin tool.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

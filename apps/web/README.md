Next.js web app for the YouTube Transcript SaaS. This app serves the UI and API routes (auth, rate limiting, job dispatch, billing).

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # start production server
npm run lint   # lint
```

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in values.
This app expects Supabase, Upstash (Redis + QStash), and Stripe keys.

## Tech Stack

- Next.js 16.1.6
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- ESLint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Supabase setup

This app expects a Supabase database schema with `profiles`, `pdfs`, and `annotations` tables. If you see an error like:

`Could not find the table 'public.pdfs' in the schema cache`

then your Supabase project is missing the required tables. Run `database.sql` in your Supabase project's SQL editor, then verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` point to that same project.

This app also uploads PDF files to Supabase Storage using a bucket named `pdfs` by default. If your project uses a different bucket name, add this to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_BUCKET=your_bucket_name
```

Then create that storage bucket in Supabase Storage before uploading files.

The PDF upload API route uses a Supabase service role key on the server to bypass row-level security when writing storage metadata. Add this to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=https://gmzvsrutnteuvhxyiyix.supabase.co
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it to source control.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

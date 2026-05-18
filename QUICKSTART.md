# Quick Start Guide

## Pre-requisites

- Node.js 18+
- npm or yarn
- Supabase account

## Step 1: Supabase Setup (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Project Settings → API
3. Copy your URL and Anon Key

## Step 2: Database Setup (2 minutes)

1. In Supabase, go to SQL Editor
2. Create a new query and paste the contents of `database.sql`
3. Click "Run"
4. In Storage, create a bucket named `pdfs` (make it public)

## Step 3: Environment Setup (1 minute)

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase URL and Anon Key

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 4: Install & Run (2 minutes)

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 5: Create Test Accounts

1. **Sign up as Admin**
   - Email: admin@test.com
   - Password: test123456
   - Role: Admin

2. **Sign up as User**
   - Email: user@test.com
   - Password: test123456
   - Role: User

## Step 6: Test the App

### As Admin:

1. Login with admin credentials
2. Upload a PDF file
3. See the uploaded PDF in the list

### As User:

1. Login with user credentials
2. See the PDF uploaded by admin
3. Click "Annotate"
4. Toggle "Drawing Mode ON"
5. Click and drag to draw a box on the PDF
6. Enter a label (e.g., "Name Field")
7. Click "Save"

### Back As Admin:

1. Login as admin
2. Click "View Annotations" on the PDF
3. See the annotations drawn by the user

## That's it! 🎉

You now have a fully functional PDF annotation app!

## Troubleshooting

### "PDF not loading"

- Check that your Supabase Storage bucket is public
- Verify the file URL in the database

### "Can't draw on PDF"

- Make sure "Drawing Mode ON" is toggled
- Try refreshing the page

### "Annotations not showing"

- Verify the annotations were saved (check database)
- Make sure you're on the same page where you drew them

### "API errors"

- Check .env.local has correct Supabase credentials
- Verify database tables are created
- Check browser console for error messages

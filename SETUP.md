# PDF Annotation App

A Next.js web application for PDF upload and annotation using Supabase backend with role-based authentication (Admin/User).

## Features

### Admin Panel

- Upload single or multiple PDF files
- View all uploaded PDFs
- Open any PDF and see all user-added annotations
- Annotations are displayed as labeled boxes on the PDF pages

### User Panel

- View list of available PDFs uploaded by admins
- Open a PDF in the viewer
- Draw rectangular annotation boxes on PDF pages
- Add labels/names to annotation boxes (e.g., Name, Email, Signature)
- Save annotations to the database
- See existing annotations on the PDF

### Core Features

- **Authentication**: Email/password login using Supabase Auth
- **Role-based Access**: Two roles - Admin and User
- **PDF Storage**: PDFs stored in Supabase Storage
- **Annotation Persistence**: All annotations saved to Postgres database
- **Multi-page Support**: Annotations stored with page numbers

## Tech Stack

- **Frontend**: Next.js 16 (TypeScript)
- **Backend**: Supabase (Auth + Postgres + Storage)
- **PDF Rendering**: react-pdf / PDF.js
- **Styling**: Tailwind CSS v4
- **Annotation Drawing**: Canvas-based drawing with mouse interactions

## Database Schema

### profiles

- `id` (UUID) - User ID from auth
- `email` (TEXT)
- `role` (TEXT) - 'admin' or 'user'
- `created_at` (TIMESTAMP)

### pdfs

- `id` (UUID)
- `title` (TEXT)
- `file_url` (TEXT) - Supabase Storage URL
- `uploaded_by` (UUID) - Reference to profiles
- `created_at` (TIMESTAMP)

### annotations

- `id` (UUID)
- `pdf_id` (UUID)
- `user_id` (UUID)
- `label` (TEXT)
- `x` (FLOAT) - X coordinate
- `y` (FLOAT) - Y coordinate
- `width` (FLOAT) - Box width
- `height` (FLOAT) - Box height
- `page_number` (INTEGER)
- `created_at` (TIMESTAMP)

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your API URL and Anon Key from Project Settings
3. In SQL Editor, run the contents of `database.sql` to create tables and policies
4. Create a new storage bucket called `pdfs` (make it public for reading)

### 2. Environment Variables

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### First Time Setup

1. Go to Sign Up page
2. Create an account:
   - **For Admin**: Email/password, select "Admin" role
   - **For User**: Email/password, select "User" role
3. Login to access your panel

### Admin Workflow

1. Login as admin
2. Go to Admin Panel
3. Upload PDFs using the file upload section
4. Click "View Annotations" on any PDF to see all user annotations

### User Workflow

1. Login as user
2. See list of available PDFs
3. Click "Annotate" on any PDF
4. Toggle "Drawing Mode ON" to enable drawing
5. Click and drag on the PDF to draw rectangular boxes
6. Enter a label for each box (e.g., "Name", "Email")
7. Click "Save" to save the annotation
8. Navigate between pages using Previous/Next buttons

## File Structure

```
app/
├── page.tsx                 # Home/redirect page
├── auth/
│   ├── login/page.tsx      # Login page
│   └── signup/page.tsx     # Signup page
├── admin/
│   ├── page.tsx            # Admin panel with upload
│   └── pdf/[id]/page.tsx   # Admin PDF viewer with annotations
├── user/
│   ├── page.tsx            # User PDF list
│   └── pdf/[id]/page.tsx   # User interactive PDF viewer
├── api/
│   ├── pdfs/route.ts       # PDF management API
│   └── annotations/route.ts # Annotation management API
└── layout.tsx              # Root layout

lib/
├── supabase.ts            # Supabase client initialization
└── types.ts               # TypeScript types

database.sql               # Database schema and RLS policies
```

## API Routes

### `/api/pdfs`

- **GET**: Fetch all PDFs
- **POST**: Upload a new PDF (multipart form data)
  - Fields: `file`, `title`, `userId`

### `/api/annotations`

- **GET**: Fetch annotations for a PDF (query param: `pdf_id`)
- **POST**: Create a new annotation
  - Body: `{ pdf_id, user_id, label, x, y, width, height, page_number }`

## Deployment

The app can be deployed to Vercel:

```bash
vercel deploy
```

Make sure to add environment variables in Vercel project settings.

## Notes

- This is a minimal MVP implementation
- No advanced UI styling, focus on functionality
- Drawing precision depends on PDF scaling
- Annotations scale with PDF page dimensions
- All data is real-time queryable from Postgres

## Future Enhancements

- Annotation editing/deletion
- Multiple users viewing same PDF in real-time
- Annotation export to PDF
- Bulk annotation templates
- Advanced filtering and search
- Annotation comments and collaboration

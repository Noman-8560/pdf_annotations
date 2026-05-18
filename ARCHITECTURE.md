# Architecture & Implementation Guide

## Project Overview

This is a Next.js TypeScript application that enables PDF annotation with role-based access control. The app uses Supabase for authentication, database, and file storage.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Auth Pages     │  │   Admin Panel    │  │  User Panel  │  │
│  │  - Login         │  │  - Upload PDFs   │  │ - List PDFs  │  │
│  │  - Signup        │  │  - View PDFs     │  │ - Annotate   │  │
│  └──────────────────┘  │  - View Annots   │  │ - Save Annots│  │
│                         └──────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Next.js API Routes                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/pdfs          /api/annotations                     │  │
│  │  - Upload PDF       - Save annotation                    │  │
│  │  - Fetch PDFs       - Fetch annotations by PDF           │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Backend                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐    │
│  │     Auth     │  │   Postgres     │  │    Storage      │    │
│  │              │  │                │  │                 │    │
│  │ - Users      │  │ - profiles     │  │ - pdfs/ bucket  │    │
│  │ - Sessions   │  │ - pdfs         │  │ - PDF files     │    │
│  │ - JWT tokens │  │ - annotations  │  │                 │    │
│  └──────────────┘  └────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer    | Technology           | Purpose                |
| -------- | -------------------- | ---------------------- |
| Frontend | React 19, Next.js 16 | UI components, routing |
| Language | TypeScript           | Type safety            |
| Styling  | Tailwind CSS v4      | Component styling      |
| PDF      | react-pdf, PDF.js    | PDF rendering          |
| Drawing  | Canvas API           | Annotation boxes       |
| Backend  | Next.js API Routes   | Server functions       |
| Database | Supabase Postgres    | Data persistence       |
| Auth     | Supabase Auth        | User authentication    |
| Storage  | Supabase Storage     | PDF file hosting       |

## Data Flow

### Upload & View Flow

```
Admin User
   ↓
Login (Supabase Auth)
   ↓
Select PDF file
   ↓
/api/pdfs POST (upload)
   ↓
Supabase Storage (save file)
   ├→ Get public URL
   └→ pdfs table (save metadata)
   ↓
Admin Dashboard updates
```

### Annotation Flow

```
User opens PDF
   ↓
Document loads from Supabase Storage
   ↓
PDF rendered with react-pdf
   ↓
User draws box on canvas
   ↓
User enters label
   ↓
Click "Save"
   ↓
/api/annotations POST
   ↓
annotations table (insert record)
   ↓
Page updates (fetch fresh data)
```

### View Annotations Flow

```
Admin clicks "View Annotations"
   ↓
Load PDF from Supabase Storage
   ↓
/api/annotations GET (fetch by pdf_id)
   ↓
Render annotations as overlay boxes
   ↓
Display in sidebar list
```

## Component Structure

### Pages

- `app/page.tsx` - Entry point with auth check
- `app/auth/login/page.tsx` - Login form
- `app/auth/signup/page.tsx` - Registration form
- `app/admin/page.tsx` - Admin dashboard
- `app/admin/pdf/[id]/page.tsx` - Admin PDF viewer
- `app/user/page.tsx` - User PDF list
- `app/user/pdf/[id]/page.tsx` - User PDF editor

### Libraries

- `lib/supabase.ts` - Supabase client
- `lib/types.ts` - TypeScript interfaces

### API Routes

- `app/api/pdfs/route.ts` - POST (upload), GET (list)
- `app/api/annotations/route.ts` - POST (create), GET (fetch)

## Database Schema

### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### pdfs

```sql
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### annotations

```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID REFERENCES pdfs(id),
  user_id UUID REFERENCES profiles(id),
  label TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  width FLOAT NOT NULL,
  height FLOAT NOT NULL,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Authentication Flow

```
User visits /
   ↓
Check Supabase session
   ├─ No session → Home page (Login/Signup)
   ├─ Admin role → Redirect to /admin
   └─ User role → Redirect to /user

On login/signup:
   ├─ Send credentials to Supabase Auth
   ├─ Receive JWT token
   ├─ Create profile record with role
   └─ Redirect based on role

On logout:
   ├─ Clear Supabase session
   └─ Redirect to home
```

## Annotation Drawing Logic

### User Drawing

1. User clicks "Drawing Mode ON" button
2. Canvas overlay becomes active (cursor changes to crosshair)
3. User clicks and drags to draw rectangle
4. Temporary blue box shows during drawing
5. On mouse up, box becomes green and awaits label
6. User enters label text
7. Click "Save" to persist to database
8. New annotation appears in sidebar

### Existing Annotations Display

- On page load, fetch annotations for current page
- Filter by `page_number == currentPage`
- Render each as positioned div with absolute positioning
- Display label as text overlay inside box
- Color: Red for existing, Blue for being drawn, Green for ready to save

## File Upload Flow

### On Upload

1. Admin selects PDF file(s)
2. File sent to `/api/pdfs` as FormData
3. API uploads to Supabase Storage bucket `pdfs/`
4. Gets public URL from storage
5. Saves PDF metadata to `pdfs` table
6. Returns new PDF record
7. Admin dashboard refreshes to show new PDF

## API Response Examples

### POST /api/pdfs Success

```json
{
  "id": "uuid",
  "title": "Document.pdf",
  "file_url": "https://storage.supabase.co/...",
  "uploaded_by": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/annotations

```json
[
  {
    "id": "uuid",
    "pdf_id": "pdf-uuid",
    "user_id": "user-uuid",
    "label": "Name",
    "x": 150,
    "y": 200,
    "width": 100,
    "height": 30,
    "page_number": 1,
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

## Security

### Row Level Security (RLS)

- All tables have RLS enabled
- `profiles`: Anyone can view, users insert own profile
- `pdfs`: Anyone can view, only admins can insert
- `annotations`: Anyone can view, users insert own annotations

### Authentication

- Supabase Auth handles password hashing
- JWT tokens managed by Supabase
- Protected API routes verify session

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     - Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
```

## Build & Deployment

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

```bash
vercel deploy
```

## Performance Considerations

- PDFs loaded on-demand (not cached)
- Annotations fetched per page
- Canvas drawing uses native browser APIs
- PDF.js worker runs in separate thread
- All data indexed by pdf_id and page_number

## Error Handling

- Login errors → Display error message
- PDF upload errors → Retry with file validation
- API errors → Log to console, show user feedback
- PDF loading errors → Display fallback message
- Drawing errors → Silently fail (user can retry)

## Future Improvements

1. **Annotation Management**
   - Edit annotations
   - Delete annotations
   - Batch operations

2. **Collaboration**
   - Real-time annotation sync
   - Comments on annotations
   - User presence indicators

3. **Export**
   - Export annotations to PDF
   - Generate annotation report
   - Download as JSON

4. **Advanced Features**
   - Annotation templates
   - Keyboard shortcuts
   - Undo/redo
   - Annotation search/filter

# PDF Annotation App - Deployment & Testing Checklist

## Pre-Deployment Checklist

### Environment Setup

- [ ] Supabase project created
- [ ] Supabase URL obtained
- [ ] Supabase Anon Key obtained
- [ ] `.env.local` file created with credentials
- [ ] Node.js 18+ installed
- [ ] npm dependencies installed (`npm install`)

### Database Setup

- [ ] Logged into Supabase
- [ ] Ran `database.sql` in SQL Editor
- [ ] Created `pdfs` storage bucket (made it public)
- [ ] Verified tables created: `profiles`, `pdfs`, `annotations`
- [ ] Verified RLS policies applied

### Code Verification

- [ ] No TypeScript errors (`npm run lint`)
- [ ] App builds successfully (`npm run build`)
- [ ] Dependencies installed correctly

## Testing Checklist

### Authentication Tests

- [ ] Sign up as Admin
  - Email: admin@test.com
  - Password: test123
  - Role: Admin
  - Verify: Redirected to /admin

- [ ] Sign up as User
  - Email: user@test.com
  - Password: test123
  - Role: User
  - Verify: Redirected to /user

- [ ] Login as Admin
  - Verify: Can access /admin

- [ ] Login as User
  - Verify: Can access /user

- [ ] Logout
  - Verify: Redirected to home page

### Admin Panel Tests

- [ ] Upload single PDF
  - Verify: File appears in "Uploaded PDFs" list
  - Verify: File stored in Supabase Storage
  - Verify: Record created in `pdfs` table

- [ ] Upload multiple PDFs
  - Upload 2-3 files at once
  - Verify: All appear in list
  - Verify: All stored in storage

- [ ] View PDF list
  - Verify: All uploaded PDFs appear
  - Verify: Sorted by creation date (newest first)
  - Verify: Shows upload date for each

- [ ] Click "View Annotations"
  - Verify: PDF loads in viewer
  - Verify: Can navigate between pages
  - Verify: Page counter updates

### User Panel Tests

- [ ] View PDF list
  - Verify: All admin-uploaded PDFs visible
  - Cannot see admin upload interface
  - Verify: Can see "Annotate" button

- [ ] Open PDF for annotation
  - Verify: PDF loads
  - Verify: Page navigation works
  - Verify: No annotations initially

### Annotation Drawing Tests

- [ ] Toggle Drawing Mode
  - Verify: Button changes color (off=gray, on=green)
  - Verify: Cursor changes to crosshair when in drawing mode
  - Verify: Cursor normal when mode is off

- [ ] Draw single annotation
  - Click and drag to draw box
  - Verify: Box appears (blue color while dragging)
  - Verify: Box turns green after release
  - Enter label: "Name"
  - Click Save
  - Verify: Annotation appears in sidebar
  - Verify: Annotation saved to database

- [ ] Draw multiple annotations
  - Draw 3+ boxes on same page
  - Give each a different label
  - Verify: All saved correctly

- [ ] Draw on different pages
  - Navigate to page 2 (if PDF has multiple pages)
  - Draw annotation
  - Verify: Saves correctly
  - Navigate back to page 1
  - Verify: Page 1 annotations still there

- [ ] Cancel annotation
  - Draw box
  - Click Cancel before adding label
  - Verify: Box removed
  - Verify: Not saved

- [ ] Verify label persistence
  - Draw box with label "Email"
  - Refresh page
  - Verify: Annotation still visible

### Cross-User Tests

- [ ] Admin sees user annotations
  - As User: Draw annotation on PDF
  - As Admin: Open same PDF
  - Click "View Annotations"
  - Verify: User's annotation visible
  - Verify: Shows correct label and position

- [ ] Multiple users on same PDF
  - User1: Draw annotation "Field 1"
  - User2: Draw annotation "Field 2"
  - Admin: View annotations
  - Verify: Both visible

### UI/UX Tests

- [ ] Responsive design
  - Test on desktop (1920x1080)
  - Test on tablet (768x1024)
  - Test on mobile (375x667)
  - Verify: UI adapts correctly

- [ ] Error handling
  - Try uploading non-PDF file
  - Try accessing non-existent PDF ID
  - Try invalid credentials
  - Verify: Appropriate error messages

- [ ] Navigation
  - All links work
  - Back buttons work
  - Sidebar navigation works

### Performance Tests

- [ ] PDF loading time
  - Test with 5MB+ PDF
  - Should load in <5 seconds

- [ ] Annotation saving
  - Should save in <2 seconds

- [ ] List loading
  - 10+ PDFs should load smoothly

## Deployment to Vercel

### Pre-Deployment

- [ ] Code committed to Git
- [ ] All tests pass
- [ ] No console errors
- [ ] No TypeScript errors

### Vercel Setup

- [ ] Connect GitHub repository
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy main branch
- [ ] Verify deployment successful

### Post-Deployment

- [ ] Test login on production
- [ ] Test PDF upload
- [ ] Test annotation drawing
- [ ] Verify Supabase connection
- [ ] Check error logs

## Performance Metrics

Track these metrics:

- First Contentful Paint (FCP): <3s
- Largest Contentful Paint (LCP): <4s
- Time to Interactive (TTI): <5s
- PDF.js worker initialization: <1s
- Annotation save time: <1s

## Known Limitations

- PDF rendering quality depends on PDF.js
- Drawing precision depends on browser zoom level
- Large PDFs (>50MB) may take time to load
- Annotation coordinates are in viewport pixels (scale-dependent)

## Troubleshooting

### "Cannot read properties of undefined"

- Check .env.local has correct values
- Verify Supabase project still exists
- Check Supabase Auth is enabled

### "PDF blank/not loading"

- Check storage bucket is public
- Verify file URL is correct in database
- Check file exists in Supabase Storage

### "Drawing doesn't work"

- Refresh page
- Check Drawing Mode is toggled ON
- Try different browser (test in Chrome, Firefox)

### "Annotations not saving"

- Check network tab for API errors
- Verify Supabase RLS policies
- Check database tables exist

### Slow performance

- Check PDF file size
- Monitor database query times
- Check Supabase connection
- Clear browser cache

## Support

For issues, check:

1. QUICKSTART.md
2. SETUP.md
3. ARCHITECTURE.md
4. Browser console for errors
5. Supabase dashboard logs

## Success Criteria

✅ App meets MVP requirements:

- Users can authenticate with email/password
- Admins can upload PDFs
- Users can see available PDFs
- Users can draw annotations on PDFs
- Admins can view all user annotations
- All data persists correctly
- No console errors
- Responsive design works

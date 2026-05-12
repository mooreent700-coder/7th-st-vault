# ORDA Real App Starter

This is the real-app starter version of ORDA.

## What it includes
- Next.js app router project
- self-serve signup flow
- one-page owner builder
- live mobile storefront preview
- go-live publishing to browser storage for demo flow
- dynamic customer storefront route: `/store/[slug]`
- Supabase-ready setup files for auth + database expansion

## Install
```bash
npm install
npm run dev
```

## Production direction
This source is designed to be the foundation for the real app:
- move draft/live storage from localStorage to Supabase tables
- wire auth in `/auth/login` and `/auth/signup`
- replace demo data with database queries
- upload images to Supabase Storage or Cloudinary

## Key pages
- `/`
- `/auth/signup`
- `/dashboard/owner/builder?client=cultured-soul-kitchen`
- `/store/cultured-soul-kitchen`
update

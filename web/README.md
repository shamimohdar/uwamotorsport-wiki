# Internal Docs Tool (Next.js + SQLite + NextAuth + TipTap)

## Stack
- Next.js App Router
- SQLite via Prisma
- NextAuth (Credentials) with roles
- TipTap editor for inline rich text
- SQLite FTS5 for full-text search with snippets

## Setup
1. Install
   - `npm install`
2. Env
   - Copy `.env.local.example` to `.env.local` or set `.env` with:
     - `DATABASE_URL=file:./dev.db`
     - `NEXTAUTH_URL=http://localhost:3000`
     - `NEXTAUTH_SECRET=replace-me`
3. DB
   - `npx prisma db push` (or `npx prisma migrate dev`)
   - Optional seed: `npm run seed`
4. Dev
   - `npm run dev`

## Default credentials
- email: `admin@example.com`
- password: `admin123`

## Notes
- FTS5 is created via `prisma/migrations/000_init/migration.sql` with triggers keeping the index in sync.
- Docs content stored as TipTap JSON (string) in `Doc.content`.
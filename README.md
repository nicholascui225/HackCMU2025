# Route 66 Calendar

A retro-themed calendar that visualizes your day as a road trip. Built with React, Vite, TypeScript, Tailwind, shadcn-ui, and Supabase (auth + persistence).

## Getting started

```sh
npm i
npm run dev
```

App runs at http://localhost:5173

## Environment

Create `.env` in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `ENV_SETUP.md` for details.

## Database

Run `supabase/schema.sql` in Supabase SQL Editor to create tables and RLS policies for `goals` and `tasks`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview built app
- `npm run lint` — lint codebase

## Notes

- Do not commit `.env` or `node_modules/`.
- Prefer `package-lock.json` (npm). If not using Bun, ignore `bun.lockb`.

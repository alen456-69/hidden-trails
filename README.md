# Hidden Trails

A community trail/travel-spot discovery app — browse, save, and share hidden
outdoor spots, plan trips, and build a Scout profile.

This version has been converted from a ChatGPT "Sites" project (which only
runs on OpenAI's own hosting, using Cloudflare D1/R2 and "Sign in with
ChatGPT") into a plain Next.js app that deploys on **Vercel** with:

- **Database:** [Turso](https://turso.tech) (hosted SQLite, generous free tier)
- **File storage:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (for photo/video uploads)
- **Auth:** Email + password sign-in (built in, no external provider needed)

Everything else — the UI, listings, maps, trip planner, leaderboard, badges,
etc. — is unchanged from the original app.

## 1. Create a Turso database

1. Go to [turso.tech](https://turso.tech) and sign up (free).
2. Create a new database.
3. From its dashboard, copy the **Database URL** (starts with `libsql://`)
   and create an **auth token**.

## 2. Create a Vercel Blob store

1. In your Vercel project (after you import this repo), go to
   **Storage → Create Database → Blob**.
2. Connect it to your project. Vercel will automatically add a
   `BLOB_READ_WRITE_TOKEN` environment variable for you — you don't need to
   copy this one manually.

## 3. Set environment variables

In your Vercel project **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | from step 1 |
| `TURSO_AUTH_TOKEN` | from step 1 |
| `AUTH_SECRET` | any long random string — see below |

Generate `AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

(`BLOB_READ_WRITE_TOKEN` is added automatically in step 2.)

## 4. Create the database tables

This only needs to be done once. On your own computer:

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
npm run db:setup
```

You should see a list of `OK:` lines confirming each table was created.

## 5. Push to GitHub and deploy on Vercel

```bash
git init
git add .
git commit -m "Hidden Trails"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

Then in Vercel: **Add New Project → Import** your GitHub repo. Vercel
detects Next.js automatically — no build settings to change. Make sure the
environment variables from step 3 are set, then deploy.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run db:setup             # first time only
npm run dev
```

Open http://localhost:3000. For local Blob uploads to work you'll also need
a `BLOB_READ_WRITE_TOKEN` in `.env.local` — get one from your Vercel
project's Blob store settings (`vercel env pull` also works if you use the
Vercel CLI).

## What changed from the original

- `app/chatgpt-auth.ts` → `lib/auth.ts` + `/api/auth/signup|signin|signout`
  (email/password sessions instead of ChatGPT sign-in)
- `lib/server.ts`'s `db()` now talks to Turso via `@libsql/client`, using a
  small compatibility layer so all the original SQL query code needed no
  changes
- `app/api/upload` now uploads to Vercel Blob and returns the file's public
  URL directly (previously proxied through `/api/media/[id]` backed by R2)
- Removed `vinext`, `wrangler`, the Cloudflare Vite plugin, and all
  `.openai/` / Sites-specific build scripts — this is now a standard
  `next build` / `next start` project
- Photo/video URL validation in `lib/models.ts` now accepts any URL rather
  than only the old `/api/media/...` shape

Nothing about the trail-discovery features, the UI, or the data model
(spots, saves, trips, comments, badges, etc.) changed.

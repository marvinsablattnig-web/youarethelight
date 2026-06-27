# youarethelight

Self-hosted TinaCMS for a Next.js landing page with:

- `Next.js` for site and admin UI
- `TinaCMS` with a self-hosted content API
- `Supabase Auth` for editor login via magic link
- `Supabase Storage` for video uploads
- `Upstash Redis` as Tina data layer adapter
- `GitHub` as the content source of truth

## Setup

1. Create a Supabase project.
2. Enable Email magic links in Supabase Auth.
3. Create a public storage bucket named `public` or set `SUPABASE_STORAGE_BUCKET`.
4. Create editor users in Supabase Auth.
5. Create an Upstash Redis database.
6. Create a GitHub token with write access to this repository.
7. Copy `.env.example` to `.env.local` and fill in all values.
8. Set `TINACMS_ALLOWED_EMAILS` to the exact editor email addresses.

## Environment

Required variables are listed in [.env.example](/Users/marvinsablattnig/Documents/youarethelight/website/.env.example).

Important ones:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_TOKEN`
- `TINACMS_ALLOWED_EMAILS`

## Development

- `npm run dev`
  Runs Tina in local mode with `TINA_PUBLIC_IS_LOCAL=true`.
  Content edits write to local files.

- `npm run dev:self-hosted`
  Runs the self-hosted flow against your configured external services.

## Build

- `npm run lint`
- `npm run build`

`npm run build` expects the production-style environment variables to be present.

## Admin and Media Flow

- Admin UI lives at `/admin/index.html`
- Editors log in with Supabase magic links
- Tina mutations are authorized through `/api/tina/[...routes]`
- Video uploads use signed upload URLs from `/api/admin/media/signed-upload`
- Stored content keeps only `VideoAsset` metadata and public URLs

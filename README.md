# Ideal Public School Community Forum

Independent, unofficial community project. Not affiliated with, authorized by, operated by, or endorsed by Ideal Public School.

## Stack
- Static HTML/CSS/JavaScript frontend.
- Vercel Functions endpoint at `/api/posts`.
- Vercel Blob for shared post storage.
- No Supabase, Firebase, third-party database, or external API provider.

## One-time Vercel setup
1. Open the Vercel project connected to this repository.
2. Storage → Create Database / Blob → Create Blob Store (public access).
3. Connect the Blob store to this project and Production (and Preview if needed). Vercel injects `BLOB_READ_WRITE_TOKEN`.
4. Project → Settings → Environment Variables: add `FORUM_ADMIN_PASSWORD` with a strong unique password. Apply to Production and Preview.
5. Redeploy after connecting storage and setting the environment variable.

## Forum behavior
- Anyone can read shared posts.
- Visitors can publish a display name, title and message.
- Posts are saved as individual JSON blobs and read by the API for all visitors.
- Admin deletion requires `FORUM_ADMIN_PASSWORD`; the password is entered only when deleting and is never stored in frontend code.
- The frontend refreshes the post list every 30 seconds.

## Important limitations
- Blob is object storage, not a relational database. This lightweight forum is suitable for a small community, not a high-traffic social network.
- Public posting can attract spam. Add Vercel Firewall rate-limit rules and monitor Blob usage before opening widely. The honeypot is only basic bot friction, not strong abuse prevention.
- There is no user account system, edit feature, comments, or guaranteed realtime push; visitors see updates on refresh / polling.
- The first request will show a storage setup message until the Blob store is connected.
- Configure a strong admin password before production use.

## Local development
Install dependencies with `npm install`, then run `vercel dev` after linking the project and pulling environment variables. Opening the HTML file directly will not run the API.

## Before launch
- Replace the example canonical domain with the real deployed domain.
- Add the school's crest to `assets/ips-logo.jpg` (the image asset is not yet committed).
- Verify school contact details and public campus references.
- Keep the independent-project disclaimer visible.

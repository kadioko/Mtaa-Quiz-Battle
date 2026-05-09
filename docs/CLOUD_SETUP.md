# Cloud Setup Guide — Mtaa Quiz Battle

This document covers:
1. Supabase project setup (tables, RLS policies)
2. Environment variable configuration
3. Push notification worker (cron)
4. Magic-link auth deep-link configuration
5. Optional cross-device sync

---

## 1. Supabase Project

Create a free project at https://supabase.com.

### 1a. Tables

Run the following SQL in **SQL Editor → New Query**:

```sql
-- Leaderboard entries
create table public.leaderboard_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  display_name text not null,
  score       int not null,
  category_name text not null,
  category_name_en text,
  correct_answers int not null default 0,
  total_questions int not null default 10,
  is_daily    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Allow anyone to read, authenticated or anon users to insert
alter table public.leaderboard_entries enable row level security;
create policy "Public read" on public.leaderboard_entries for select using (true);
create policy "Anon insert" on public.leaderboard_entries for insert with check (true);

-- Cross-device progress sync
create table public.user_syncs (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null unique,
  display_name    text not null,
  profile_json    text not null default '{}',
  achievements_json text not null default '[]',
  quiz_history_json text not null default '[]',
  updated_at      timestamptz not null default now()
);

alter table public.user_syncs enable row level security;
create policy "Own read" on public.user_syncs for select using (auth.uid()::text = user_id or user_id like 'anon-%');
create policy "Own upsert" on public.user_syncs for insert with check (true);
create policy "Own update" on public.user_syncs for update using (true);

-- Push tokens (for server-side blasts)
create table public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  token       text not null unique,
  platform    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
create policy "Insert" on public.push_tokens for insert with check (true);
create policy "Update own" on public.push_tokens for update using (true);
```

### 1b. Auth — Magic Link

1. Go to **Authentication → Settings → Email**
2. Enable **Email provider** (on by default)
3. Set **Site URL** to your deep-link scheme: `mtaaquiz://auth`
4. Add `mtaaquiz://auth` to **Redirect URLs**

---

## 2. Environment Variables

Create `.env` at the project root (never commit this):

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For EAS builds, add these as **EAS secrets** in `eas.json` or via the EAS CLI:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

Find the values in Supabase: **Project Settings → API → Project URL & anon public key**.

---

## 3. Push Notification Worker

The worker script lives at `server/push-worker.mjs`.

### Required env vars (server-side only, never expose to client):
```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service_role key from Project Settings → API
EXPO_ACCESS_TOKEN=             # optional: Expo account token for enhanced delivery
```

### Running manually:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node server/push-worker.mjs
```

### GitHub Actions cron (recommended):

Create `.github/workflows/daily-push.yml`:

```yaml
name: Daily Push Blast
on:
  schedule:
    - cron: '0 16 * * *'   # 16:00 UTC = 19:00 EAT
  workflow_dispatch:

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node server/push-worker.mjs
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          EXPO_ACCESS_TOKEN: ${{ secrets.EXPO_ACCESS_TOKEN }}
```

Add these three values to **GitHub → Settings → Secrets and variables → Actions**.

### Alternative: Railway / Render cron job
Deploy the worker as a cron service. Set env vars in the platform dashboard.

---

## 4. Magic Link Deep-Link Flow

1. User enters email in `app/signin.tsx` → `CloudService.requestMagicLink(email)` POSTs to Supabase Auth.
2. Supabase sends email with link: `https://xxxx.supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=mtaaquiz://auth`
3. User taps link → OS opens the app with deep-link `mtaaquiz://auth?token=xxx&type=magiclink`.
4. `app/_layout.tsx` `Linking` listener catches the URL, calls `CloudService.exchangeToken(token, 'magiclink')`.
5. Token is exchanged for a session, saved to `AsyncStorage`, and the user is now signed in.

**iOS**: Add the URL scheme to `app.json`:
```json
"scheme": "mtaaquiz"
```
(already set)

**Android**: Expo Router handles this automatically via the `scheme` field.

---

## 5. Cross-Device Sync

- **Push** (upload local → server): Profile screen → "Sync Now" button calls `CloudService.syncPush()`.
- **Pull** (download server → local): `CloudService.syncPull()` merges stats (takes max for numeric values), unions achievements, deduplicates quiz history.
- Both are available in `src/services/CloudService.ts`.
- You can add an auto-sync on app foreground by calling `syncPull()` in `_layout.tsx`.

---

## 6. Security Notes

- **Never expose** `SUPABASE_SERVICE_KEY` in client code. It is only used in `server/push-worker.mjs`.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is safe to expose (it's the public anon key, protected by RLS).
- The leaderboard `anon insert` policy allows anyone to post scores. If you see abuse, add rate-limiting via a Supabase Edge Function.
- Anonymous user IDs (`anon-xxxx`) are not validated server-side. For anti-cheat, add a score sanity check Edge Function.

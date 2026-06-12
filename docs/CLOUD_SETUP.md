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
  region      text,
  created_at  timestamptz not null default now()
);

-- If upgrading an existing project, add the region column:
-- alter table public.leaderboard_entries add column region text;

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

-- Friend challenges (cross-device async multiplayer)
create table public.challenges (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  creator_name  text not null,
  category_id   text not null,
  category_name text not null,
  question_ids  text not null default '[]',  -- JSON array of question ids
  created_at    timestamptz not null default now()
);

alter table public.challenges enable row level security;
create policy "Public read" on public.challenges for select using (true);
create policy "Anon insert" on public.challenges for insert with check (true);

-- One row per player attempt on a challenge
create table public.challenge_attempts (
  id              uuid primary key default gen_random_uuid(),
  code            text not null references public.challenges(code),
  user_id         text not null,
  player_name     text not null,
  score           int not null default 0,
  correct_answers int not null default 0,
  total_questions int not null default 10,
  created_at      timestamptz not null default now()
);

create index challenge_attempts_code_idx on public.challenge_attempts(code);
alter table public.challenge_attempts enable row level security;
create policy "Public read" on public.challenge_attempts for select using (true);
create policy "Anon insert" on public.challenge_attempts for insert with check (true);

-- Remote question packs (publish new questions without an app release)
create table public.question_packs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  version        int not null default 1,
  questions_json text not null default '[]',  -- JSON array of Question objects
  active         boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.question_packs enable row level security;
create policy "Public read" on public.question_packs for select using (true);
-- No anon insert: publish packs from the Supabase dashboard or service key only.

-- Live event windows (time-boxed challenges)
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,          -- Swahili name, e.g. 'Ijumaa ya Moto'
  name_en     text not null,          -- English name
  emoji       text not null default '🔥',
  seed        text not null,          -- deterministic question seed
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.events enable row level security;
create policy "Public read" on public.events for select using (true);
-- No anon insert: create events from the dashboard or service key only.
```

**Publishing a question pack** (SQL editor):
```sql
insert into public.question_packs (name, version, active, questions_json) values (
  'July 2026 pack', 1, true,
  '[{"id":"r001","category":"Bongo Fleva","question":"...","question_en":"...",
     "options":["a","b","c","d"],"options_en":["a","b","c","d"],
     "answer":"a","answer_en":"a","explanation":"...","explanation_en":"...",
     "difficulty":"medium"}]'
);
```
Questions are validated client-side; invalid entries are skipped silently. Use `r###` IDs to avoid clashing with bundled `q###` IDs. Remote questions appear in classic, sprint, versus, and challenge modes — daily/weekly stay bundled-only for cross-device determinism.

**Creating a live event** (SQL editor):
```sql
insert into public.events (name, name_en, emoji, seed, starts_at, ends_at) values (
  'Ijumaa ya Moto', 'Friday Fire', '🔥', 'fire-2026-26',
  '2026-06-19 16:00:00+00', '2026-06-19 20:00:00+00'
);
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

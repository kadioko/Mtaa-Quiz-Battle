-- Mtaa Quiz Battle — Supabase Database Setup
-- Run this in the Supabase SQL Editor:  SQL → New Query → Paste → Run
--
-- Tables created:
--   leaderboard_entries, user_syncs, push_tokens,
--   challenges, challenge_attempts, question_packs, events

-- ═══════════════════════════════════════════════════════════════
-- 1. Leaderboard entries
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.leaderboard_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  display_name     text not null,
  score            int  not null,
  category_name    text not null,
  category_name_en text,
  correct_answers  int  not null default 0,
  total_questions  int  not null default 10,
  is_daily         boolean not null default false,
  region           text,
  created_at       timestamptz not null default now()
);

alter table public.leaderboard_entries enable row level security;
create policy "Public read" on public.leaderboard_entries for select using (true);
create policy "Anon insert" on public.leaderboard_entries for insert with check (true);

-- ═══════════════════════════════════════════════════════════════
-- 2. Cross-device progress sync
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.user_syncs (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null unique,
  display_name      text not null,
  profile_json      text not null default '{}',
  achievements_json text not null default '[]',
  quiz_history_json text not null default '[]',
  updated_at        timestamptz not null default now()
);

alter table public.user_syncs enable row level security;
create policy "Own read"   on public.user_syncs for select using (auth.uid()::text = user_id or user_id like 'anon-%');
create policy "Own upsert" on public.user_syncs for insert with check (true);
create policy "Own update" on public.user_syncs for update using (true);

-- ═══════════════════════════════════════════════════════════════
-- 3. Push notification tokens
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  token       text not null unique,
  platform    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
create policy "Insert"      on public.push_tokens for insert with check (true);
create policy "Update own"  on public.push_tokens for update using (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. Friend challenges
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.challenges (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  creator_name  text not null,
  category_id   text not null,
  category_name text not null,
  question_ids  text not null default '[]',
  created_at    timestamptz not null default now()
);

alter table public.challenges enable row level security;
create policy "Public read" on public.challenges for select using (true);
create policy "Anon insert" on public.challenges for insert with check (true);

-- ═══════════════════════════════════════════════════════════════
-- 5. Challenge attempts
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.challenge_attempts (
  id              uuid primary key default gen_random_uuid(),
  code            text not null references public.challenges(code),
  user_id         text not null,
  player_name     text not null,
  score           int not null default 0,
  correct_answers int not null default 0,
  total_questions int not null default 10,
  created_at      timestamptz not null default now()
);

create index if not exists challenge_attempts_code_idx on public.challenge_attempts(code);

alter table public.challenge_attempts enable row level security;
create policy "Public read" on public.challenge_attempts for select using (true);
create policy "Anon insert" on public.challenge_attempts for insert with check (true);

-- ═══════════════════════════════════════════════════════════════
-- 6. Remote question packs
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.question_packs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  version        int  not null default 1,
  questions_json text not null default '[]',
  active         boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.question_packs enable row level security;
create policy "Public read" on public.question_packs for select using (true);
-- No anon insert: publish packs from dashboard or service key only.

-- ═══════════════════════════════════════════════════════════════
-- 7. Live event windows
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_en     text not null,
  emoji       text not null default '🔥',
  seed        text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.events enable row level security;
create policy "Public read" on public.events for select using (true);
-- No anon insert: create events from dashboard or service key only.

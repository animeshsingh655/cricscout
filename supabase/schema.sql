-- CricScout Intelligence — Supabase Schema
-- Run this once in the Supabase SQL editor: https://supabase.com/dashboard/project/xxvasvjltxdvmefunchl/sql

-- ──────────────────────────────────────────────────
-- 1. PLAYERS
-- ──────────────────────────────────────────────────
create table if not exists players (
  id           text primary key,  -- cricsheet identifier e.g. "jaiswal01"
  name         text not null,
  team         text,
  state        text,
  age          integer,
  role         text,              -- Batter | Bowler | All-rounder | WK-Batter
  hand         text,              -- RHB | LHB
  bowling_type text,              -- Pace | Spin | null
  is_active    boolean default true,
  updated_at   timestamptz default now()
);

-- ──────────────────────────────────────────────────
-- 2. TOURNAMENTS
-- ──────────────────────────────────────────────────
create table if not exists tournaments (
  id              text primary key,
  name            text not null,
  short_name      text,
  tier            integer default 3,   -- 1=IPL, 2=National, 3=State
  level           text default 'State', -- National | State
  status          text default 'COMPLETED', -- ONGOING | UPCOMING | COMPLETED
  start_date      date,
  end_date        date,
  teams           integer,
  total_matches   integer default 0,
  matches_played  integer default 0,
  top_batter_name text,
  top_batter_stat text,
  top_bowler_name text,
  top_bowler_stat text
);

-- ──────────────────────────────────────────────────
-- 3. MATCHES
-- ──────────────────────────────────────────────────
create table if not exists matches (
  id                text primary key,
  tournament_id     text references tournaments(id),
  match_date        date,
  season            text,
  venue             text,
  team1             text,
  team2             text,
  winner            text,
  player_of_match   text
);

create index if not exists matches_tournament_id_idx on matches(tournament_id);
create index if not exists matches_date_idx on matches(match_date);

-- ──────────────────────────────────────────────────
-- 4. BATTING STATS (per player per match)
-- ──────────────────────────────────────────────────
create table if not exists batting_stats (
  id          bigserial primary key,
  match_id    text references matches(id) on delete cascade,
  player_id   text,
  player_name text not null,
  team        text,
  innings_num integer,
  runs        integer default 0,
  balls       integer default 0,
  fours       integer default 0,
  sixes       integer default 0,
  is_out      boolean default false,
  -- phase splits
  pp_runs     integer default 0, pp_balls    integer default 0,
  mid_runs    integer default 0, mid_balls   integer default 0,
  death_runs  integer default 0, death_balls integer default 0,
  unique(match_id, player_name, innings_num)
);

create index if not exists batting_stats_player_idx on batting_stats(player_name);
create index if not exists batting_stats_match_idx  on batting_stats(match_id);

-- ──────────────────────────────────────────────────
-- 5. BOWLING STATS (per player per match)
-- ──────────────────────────────────────────────────
create table if not exists bowling_stats (
  id             bigserial primary key,
  match_id       text references matches(id) on delete cascade,
  player_id      text,
  player_name    text not null,
  team           text,
  innings_num    integer,
  balls          integer default 0,
  runs_conceded  integer default 0,
  wickets        integer default 0,
  -- phase splits
  pp_balls       integer default 0, pp_runs    integer default 0, pp_wickets    integer default 0,
  mid_balls      integer default 0, mid_runs   integer default 0, mid_wickets   integer default 0,
  death_balls    integer default 0, death_runs integer default 0, death_wickets integer default 0,
  unique(match_id, player_name, innings_num)
);

create index if not exists bowling_stats_player_idx on bowling_stats(player_name);
create index if not exists bowling_stats_match_idx  on bowling_stats(match_id);

-- ──────────────────────────────────────────────────
-- 6. FORM SNAPSHOTS (computed daily, one row per player)
-- ──────────────────────────────────────────────────
create table if not exists form_snapshots (
  player_name      text primary key,
  player_id        text,
  role             text,
  team             text,
  state            text,
  age              integer,
  hand             text,
  bowling_type     text,
  -- form
  form_score       numeric(5,2) default 0,
  form_delta       numeric(5,2) default 0,
  percentile       integer default 0,
  is_rising        boolean default false,
  -- batting
  recent_sr        numeric(6,2),
  recent_runs      integer,
  recent_avg       numeric(5,2),
  boundary_pct     numeric(5,2),
  matches_total    integer default 0,
  matches_last_30  integer default 0,
  -- bowling
  recent_econ      numeric(5,2),
  recent_wickets   integer,
  recent_bowl_sr   numeric(6,2),
  -- phase batting
  pp_sr            numeric(6,2), mid_sr    numeric(6,2), death_sr    numeric(6,2),
  pp_avg           numeric(5,2), mid_avg   numeric(5,2), death_avg   numeric(5,2),
  -- phase bowling
  pp_econ          numeric(5,2), mid_econ  numeric(5,2), death_econ  numeric(5,2),
  pp_bowl_sr       numeric(6,2), mid_bowl_sr numeric(6,2), death_bowl_sr numeric(6,2),
  -- phase labels
  pp_label         text, mid_label  text, death_label text,
  updated_at       timestamptz default now()
);

# PRD — CricScout India
### T20 Player Intelligence Platform · Version 1.0
**Owner:** Animesh | **Status:** Draft | **Updated:** June 2026

---

## 1. Product Vision

> "The Bloomberg Terminal for India T20 cricket scouting — a daily-updated intelligence layer that tells you exactly who to watch, why, and in which tournament."

CricScout India is a web platform that aggregates T20 match data from IPL, SMAT, T20I internationals, and available state leagues, and surfaces ranked, filterable player intelligence for scouts, IPL franchise analysts, sports journalists, and serious fans. No live scores. No noise. Just the 20 players worth watching this week, with the data to back it up.

---

## 2. Problem Statement

Scouting in Indian domestic cricket today is fragmented:
- Ball-by-ball data exists (Cricsheet, Cricinfo) but is raw and requires engineering to use
- No single surface shows "players to watch" ranked by recent form + peer percentile
- State league tournaments (TNPL, MPL, KPL, TNCA) are invisible to most
- Scouts manually track spreadsheets across tournaments
- There is no concept of a "scout-grade" player card that packages all signals in one view

CricScout solves this by building an opinionated, daily-updated intelligence layer on top of free public data.

---

## 3. Target Users

| User | Need | Use Frequency |
|---|---|---|
| **IPL franchise analyst** | Pre-auction watchlist, rising U23 talent identification | Weekly during tournament season |
| **State association selector** | Track form of squad candidates across domestic T20s | Weekly |
| **Sports journalist** | Quick data lookup for features, match previews | Per match / per week |
| **Cricket agent / manager** | Build evidence case for client's value | Monthly |
| **Serious fan** | Deeper stats than what Cricbuzz shows | 3–5x per week |

**Primary user for V1:** IPL franchise analyst / state association selector. Everything is designed for their workflow.

---

## 4. Scope

### In Scope — V1

**Tournaments tracked:**
- IPL (current season + 3 prior seasons)
- Syed Mushtaq Ali Trophy (SMAT) — Elite + Plate
- T20I India matches (home + away)
- Available state leagues on Cricsheet: TNPL, MPL, KCA T20, Baroda PL, Bengal T20, Kerala T20, UP T20 League, Delhi T20, Maharashtra PL, Saurashtra PL, Vidarbha PL

**Core features:**
1. Tournament Hub — all active/upcoming India T20 tournaments with status
2. Player Explorer — filterable database of ~3,000 India-eligible T20 players
3. Player Card — full intelligence view per player
4. Watchlist — save players to personal list
5. Rising Players — algo-surfaced list of players with high recent-form delta

**Out of Scope — V1:**
- Live scores / ball-by-ball
- International players (focus: India-eligible only)
- Women's cricket
- Comparison tool (V2)
- Franchise-specific reports (V2)
- API access (V2)

---

## 5. Data Model

### 5.1 Sources & Refresh Cadence

| Source | What we pull | Cadence |
|---|---|---|
| Cricsheet `recently_played_7_male_json.zip` | Ball-by-ball match data → derived stats | Daily at 6 AM IST |
| Cricsheet full tournament ZIPs (IPL, SMAT, state leagues) | Historical baseline | On tournament completion |
| ESPNCricinfo Statsguru (scrape) | Career batting/bowling averages, player profile | Weekly |
| Cricbuzz schedule scrape | Upcoming fixture list per tournament | Daily at 8 AM IST |
| Manual curation | Player photos, position tagging, state team | On new player entry |

### 5.2 Player Signal Schema

**Identity layer** (from existing player CSV):
- `player_id`, `player_name`, `date_of_birth`, `nationality`
- `batting_hand`, `batting_type`, `bowling_hand`, `bowling_type`
- `is_wicket_keeper`, `state_team`, `age_band`

**Recent form layer** (computed, rolling 10-match window):
- `recent_runs`, `recent_balls_faced`, `recent_sr` (strike rate)
- `recent_avg` (batting average last 10)
- `recent_4s`, `recent_6s`, `recent_boundary_pct`
- `recent_wickets`, `recent_overs`, `recent_economy`, `recent_dot_pct`
- `recent_catches`, `recent_stumpings`
- `dismissal_type_breakdown` (caught, bowled, run-out, lbw)

**Phase-split batting** (powerplay / middle / death):
- `pp_sr`, `pp_avg` (overs 1–6)
- `mid_sr`, `mid_avg` (overs 7–15)
- `death_sr`, `death_avg` (overs 16–20)

**Derived signals:**
- `form_score` — weighted recent performance score (proprietary, 0–100)
- `form_delta` — form_score change vs prior 10-match window
- `peer_percentile_bat` — batting rank vs all active T20 players this season
- `peer_percentile_bowl` — bowling rank
- `matches_last_30d`, `matches_last_90d`
- `active_tournaments` — list of tournaments played in this season

**Tournament context:**
- `last_match_date`, `last_match_tournament`, `last_match_score`

### 5.3 Tournament Schema

- `tournament_id`, `name`, `short_name`, `season`
- `status`: `upcoming | ongoing | completed`
- `start_date`, `end_date`
- `format`: `T20`
- `governing_body`: `BCCI | State Association`
- `tier`: `national | state | franchise`
- `cricsheet_code` (for data pull)
- `matches_played`, `matches_remaining`
- `top_scorers[]`, `top_wicket_takers[]`

---

## 6. Feature Specifications

### 6.1 Tournament Hub (Home)

**Layout:** Grid of tournament cards, sorted by status (Ongoing → Upcoming → Completed)

**Tournament Card contains:**
- Tournament name + logo/color
- Status badge (Live · Upcoming · Completed)
- Date range
- Matches played / total
- Top performer teaser (leading run-scorer name + runs, leading wicket-taker + wickets)
- "View tournament" CTA

**Filters:** By tier (National / State / Franchise) | By status | By region

**No pagination on V1** — all India T20 tournaments fit on one scrollable page (~15–20 cards)

---

### 6.2 Player Explorer

**The core scout tool.** A filterable, sortable table/card view of all players.

**Default view:** Top 50 players by `form_score` in the last 30 days, India-eligible only

**Filters:**
- Role: Batter | Bowler | All-rounder | WK-Batter
- Batting hand: Right | Left
- Bowling type: Pace | Spin | All
- Age band: U19 | U23 | 23–27 | 28–32 | 32+
- Tournament: Filter to players active in a specific tournament
- State team: All 30 state teams
- Form delta: Rising (form_delta > 10) | Steady | Declining

**Sort options:** Form score · Recent SR · Recent economy · Recent wickets · Recent runs · Peer percentile

**Player row (table view) shows:**
- Name, state, role badge
- Last match date + tournament
- Recent stats snapshot (runs or wickets, SR or economy)
- Form score + delta arrow (up/down/flat)
- Watchlist toggle

**Card view toggle:** Shows richer visual card per player

---

### 6.3 Player Card (Detail View)

Accessible via click from Explorer or direct URL (`/player/:id`)

**Sections:**

**A. Header**
- Name, age, state, role
- Photo (curated) or initials avatar
- Active tournaments this season
- "Add to Watchlist" button
- Last seen: [Tournament name] · [Match date]

**B. Form Snapshot (last 10 matches)**
- Mini sparkline of runs/wickets per match
- Summary: Avg | SR (batting) or Economy | Wickets (bowling)
- Form score badge (0–100) + delta vs prior 10

**C. Phase-Split Stats** (batting only)
- Three columns: Powerplay / Middle / Death
- SR, Avg, Balls faced per phase
- Visual bar comparison across phases — shows where the player is most/least effective

**D. Tournament Breakdown**
- Table: Tournament | Season | Mat | Runs | Avg | SR (batting) / Wkts | Avg | Econ (bowling)
- Last 3 seasons only for V1

**E. Peer Percentile**
- Visual gauge: "Better than X% of active T20 batters this season" (for batting)
- Separate gauge for bowling
- Comparison context: "Among players with 5+ matches in 2025"

**F. Recent Match Log**
- Last 10 matches as a condensed table
- Match, Date, Opposition, Runs/Balls/SR or Overs/Runs/Wkts

**G. Scout Notes** (V2 — read-only in V1, show placeholder)

---

### 6.4 Rising Players Feed

**A curated, algo-generated list — the platform's editorial voice.**

Logic:
- `form_delta > 15` (significant upward form shift)
- `matches_last_30d >= 3` (meaningful sample)
- `age <= 26` (emerging talent focus)
- Sorted by `form_delta` descending

**Display:** 8–12 player cards in a horizontal scrollable row on the home page, above the tournament grid. Each card: photo/avatar, name, age, state, form_delta badge ("↑ +22 pts"), last match snippet.

**Refresh:** Recalculated daily with each data pull.

---

### 6.5 Watchlist

- Persisted per user session (localStorage for V1, auth + DB for V2)
- Shows saved players in a flat list
- Quick compare: select 2–3 players from watchlist → side-by-side stat table (V2 full, V1 basic)
- Export to CSV (V2)

---

## 7. Technical Architecture

### Stack (recommended)

| Layer | Tech | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR/ISR for SEO, fast page loads |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Database | Supabase (Postgres) | Free tier generous, Realtime if needed later, row-level security |
| Data pipeline | Python scripts on GitHub Actions | Free cron jobs, version-controlled |
| Hosting | Vercel | Free tier, edge functions |
| Auth (V2) | Supabase Auth | Already in stack |

### Data Pipeline Flow

```
[Cricsheet ZIP download]
        ↓
[Python parser — ball-by-ball → match stats]
        ↓
[Aggregation — per player per tournament per season]
        ↓
[Signal computation — form_score, phase splits, percentiles]
        ↓
[Upsert → Supabase]
        ↓
[Next.js ISR revalidation → frontend updates]
```

**Run schedule:**
- 6:00 AM IST — Cricsheet data pull (recently_played_7)
- 6:30 AM IST — Signal recomputation
- 8:00 AM IST — Cricbuzz schedule scrape
- 8:30 AM IST — ISR revalidation triggered

---

## 8. Metrics & Success Criteria

### V1 Launch Goals (90 days post-launch)

| Metric | Target |
|---|---|
| Registered users | 500 |
| Weekly active users | 150 |
| Player cards viewed/week | 2,000 |
| Avg session duration | > 4 minutes |
| Returning users (D7) | > 35% |
| Data freshness SLA | < 36 hours from match end |
| Player coverage | > 2,500 India-eligible T20 players |
| Tournaments covered | 12+ |

### Key Qualitative Success Signal
An IPL scout or selector references CricScout data in a public statement, article, or conversation. That's the version of product-market fit this platform is aiming for.

---

## 9. Design Principles

1. **Data density without clutter** — every pixel earns its place; no decorative noise
2. **Scout-first hierarchy** — form_score and recent performance are always primary; career stats are context
3. **Speed over richness** — pages load fast; no spinners on the core path
4. **Trust signals everywhere** — show data source, match count, last updated timestamp so scouts can rely on it
5. **Dark + professional** — visual language closer to Bloomberg / athletic analytics tools than consumer apps

---

## 10. Open Questions / Decisions Needed

| # | Question | Decision by |
|---|---|---|
| 1 | Do we want user accounts in V1 or localStorage-only watchlist? | Animesh |
| 2 | Which state leagues are priority for manual enrichment if Cricsheet misses them? | Animesh |
| 3 | Form score formula — simple weighted average or ML-based? | Tech build sprint |
| 4 | Do we include international players (Pakistan, England) who play IPL? | Animesh |
| 5 | Mobile-first or desktop-first for V1? (scouts likely on desktop) | Animesh |
| 6 | Name + branding — "CricScout India" is placeholder | Animesh |

---

## 11. Phased Roadmap

### V1 — Core Intelligence (now)
Tournament hub · Player explorer · Player card · Rising players · Basic watchlist

### V2 — Depth (3–6 months post-launch)
User accounts · Saved watchlists · Player comparison tool · Franchise-filtered views · Export · Auth

### V3 — Monetisation (6–12 months)
Pro tier for franchise analysts · Custom reports · API access · Scout collaboration notes

---

*PRD prepared by Claude for Animesh · CricScout India · June 2026*

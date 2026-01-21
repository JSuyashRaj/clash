# Badminton Tournament Management App - PRD

## Original Problem Statement
Build a glitch-free and smooth badminton tournament management app (similar to CricHeroes) for managing a badminton tournament with the following structure:

## Core Requirements

### Roles
- **Single Main Admin** - Full control over teams, players, clashes, and scoring

### Tournament Structure
- 14 teams divided into two pools (Pool X: X1-X7, Pool Y: Y1-Y7)
- Each team plays 4 circular-format clashes within its pool
- 28 total league clashes (14 per pool)
- Top 4 from each pool qualify for knockouts

### Fixture Pattern (Circular)
```
X1 plays: X2, X3, X6, X7
X2 plays: X1, X3, X4, X7  
X3 plays: X1, X2, X4, X5
X4 plays: X2, X3, X5, X6
X5 plays: X3, X4, X6, X7
X6 plays: X1, X4, X5, X7
X7 plays: X1, X2, X5, X6
```
Same pattern for Pool Y.

### Scoring Rules

#### League Stage
- Each clash = 5 doubles matches
- Each match = 1 game to 21 points (deuce to 25)
- First team to win 3 matches wins the clash = 2 leaderboard points
- Clash ends immediately after 3 match wins

#### Knockout Stage
- Semi-Finals: X1 vs Y2, X2 vs Y1
- Losers play for 3rd place
- Winners play Final
- Format: 5 matches, each is a "Superset" (best of 3 sets to 11 points, deuce to 15)
- First team to win 3 supersets wins the clash

### Leaderboard Ranking (3-tier tiebreaker)
1. Total points
2. Fewer matches lost in clashes (3-1 better than 3-2)
3. Point difference (points scored - points conceded)

### Player Rules
- Teams: 5-8 players each
- Players: Max 2 matches per clash
- Pairs: A specific pair can only play together once per team
- Dropdowns must disable ineligible players/pairs in real-time

### Admin Functionalities
1. Add, Edit, Delete teams (with confirmation)
2. Add, Edit, Delete players (with confirmation)
3. Generate fixtures
4. Score entry with automatic leaderboard updates
5. Send broadcast notifications

## Tech Stack
- **Frontend:** React + TailwindCSS + Shadcn UI
- **Backend:** FastAPI + Pydantic
- **Database:** MongoDB

## What's Been Implemented (Jan 21, 2026)

### Completed Features
- [x] Admin login with hashed password
- [x] Full Teams CRUD (Create, Read, Update, Delete)
- [x] Full Players CRUD (Create, Read, Update, Delete)
- [x] Duplicate pool+pool_number prevention
- [x] Player count tracking (x/8 format)
- [x] Minimum 5 players warning
- [x] Delete confirmation dialogs
- [x] Clashes management with scoring UI
- [x] Player eligibility tracking (2 match limit per clash)
- [x] Pair validation (unique pairs only)
- [x] Leaderboard with 3-tier ranking
- [x] League vs Knockout scoring differentiation
- [x] Auto-lock clash when 3 wins reached
- [x] Notifications system
- [x] Theme: Parrot green (#ccff00) primary color

### API Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET/POST /api/teams` - List/Create teams
- `GET/PUT/DELETE /api/teams/{id}` - Team operations
- `GET/POST /api/players` - List/Create players
- `GET/PUT/DELETE /api/players/{id}` - Player operations
- `POST /api/generate-fixtures` - Auto-generate league fixtures
- `GET/POST /api/clashes` - List/Create clashes
- `PUT /api/clashes/{id}/score` - Update clash scores
- `GET /api/leaderboard` - Get ranked teams
- `POST /api/notifications` - Send notifications

### Test Results (100% Pass Rate)
- 16 backend API tests passed
- All frontend CRUD operations verified
- Test file: `/app/tests/test_backend_api.py`

## Current Admin Credentials
- **Password:** TBWYhmZDAx032xaD

## Backlog / Future Tasks
- [ ] Clean up legacy duplicate teams in database
- [ ] Add team photo upload feature
- [ ] Player statistics dashboard
- [ ] Match history view
- [ ] Mobile-responsive improvements

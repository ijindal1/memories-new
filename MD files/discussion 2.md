# memories.new Backend Architecture (v2 — Current State)

> Updated from [discussion 1.md](./discussion%201.md) to reflect what's actually implemented and lessons learned.

## Stack

| Layer | Tool | Why |
|---|---|---|
| Auth | Descope | Handles magic links/OAuth/sessions, React SDK, JWTs |
| API | Cloudflare Pages Functions | Lives alongside frontend in same repo, zero extra infra |
| Database | Cloudflare D1 (SQLite) | Structured data, free tier = 5M reads/day, 100K writes/day |
| Frontend | React/Vite on Cloudflare Pages | Single-file SPA (App.jsx), no router |

---

## What's Implemented

### Auth Middleware (`functions/api/_middleware.ts`)

- Validates Descope JWTs via JWKS endpoint using `jose`
- Accepts both issuer formats: bare project ID and `https://api.descope.com/{projectId}`
- Extracts `sub`, `email`, and `name` from JWT claims
- Debug logging: logs verified/unverified JWT payloads and verification errors
- Invalid tokens don't block requests — user stays unauthenticated (endpoints check individually)

### Quiz Results

| Method | Path | File | Status |
|---|---|---|---|
| POST | `/api/results` | `results/index.ts` | Implemented |
| GET | `/api/results` | `results/index.ts` | Implemented |
| GET | `/api/results/:appSlug` | `results/[appSlug].ts` | Implemented |
| GET | `/api/results/:appSlug/history` | `results/[appSlug]/history.ts` | Implemented |

- POST upserts user first, then inserts quiz result
- Wrapped in try/catch with structured error logging
- Returns `{ success: true, id }` on success, `{ error }` with 500 on failure

### Profile

| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/profile` | `profile/index.ts` | Implemented |
| GET | `/api/profile/share` | `profile/share.ts` | Implemented |
| GET | `/api/profile/share/:token` | `profile/share/[token].ts` | Implemented |

- Profile aggregates all quiz results across apps, groups by app_slug, counts attempts
- Share uses base64url-encoded JSON tokens (stateless — no DB table needed)
- Share payload includes dimensions but strips private data (email, answers, prompts)
- Public share endpoint requires no auth

### Events

| Method | Path | Status |
|---|---|---|
| POST | `/api/events` | Implemented (from v1) |

### Frontend

- `AuthStatusBadge` component shows signed-in email in nav on all pages
- Save flow state machine: `idle → pending-login → saving → saved / error`
- Cross-tab magic link sync via `BroadcastChannel`
- API client (`src/lib/api.js`) attaches Descope session token automatically, throws on non-2xx

---

## D1 Schema (Actual)

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,                                    -- nullable (not all auth methods provide email)
  name TEXT,                                     -- added for profile display
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,          -- changed from hex randomblob to autoincrement
  user_id TEXT NOT NULL REFERENCES users(id),
  app_slug TEXT NOT NULL,
  dimensions TEXT NOT NULL,                      -- JSON string
  generated_prompt TEXT NOT NULL,
  answers TEXT NOT NULL,                         -- was "raw_answers" in v1 plan
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_app ON quiz_results(user_id, app_slug);
CREATE INDEX IF NOT EXISTS idx_quiz_results_latest ON quiz_results(user_id, app_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  event_type TEXT NOT NULL,                      -- was "event_name" in v1 plan
  app_slug TEXT,
  payload TEXT,                                  -- was "event_data" in v1 plan
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
```

### Changes from v1 plan
- `users.email` is nullable (not all Descope flows guarantee email)
- `users.name` added
- `quiz_results.id` uses `AUTOINCREMENT` instead of hex randomblob
- `quiz_results.answers` (was `raw_answers`)
- `quiz_results.version` column dropped (not needed yet)
- `events` uses `event_type`/`payload` (was `event_name`/`event_data`), dropped `session_id`

---

## Project Structure

```
memories-new/
├── functions/
│   ├── types.ts                    # Env + UserData interfaces
│   └── api/
│       ├── _middleware.ts          # Descope JWT validation
│       ├── results/
│       │   ├── index.ts            # POST (save) + GET (list all)
│       │   ├── [appSlug].ts        # GET latest for app
│       │   └── [appSlug]/
│       │       └── history.ts      # GET all results for app (retakes)
│       ├── profile/
│       │   ├── _helpers.ts         # loadProfileData, share token encode/decode
│       │   ├── index.ts            # GET combined profile
│       │   ├── share.ts            # GET generate share link
│       │   └── share/
│       │       └── [token].ts      # GET public shared profile (no auth)
│       └── events/
│           └── index.ts            # POST batch events
├── migrations/
│   └── 0001_initial.sql
├── src/
│   ├── App.jsx                     # Single-file SPA (all pages + components)
│   └── lib/
│       └── api.js                  # API client (attaches Descope JWT, throws on error)
├── wrangler.toml
└── package.json
```

---

## Dev Setup

```bash
# Install
npm install

# Local dev (vite HMR + wrangler Pages Functions + D1)
npm run dev:full
# This runs: npm run dev (vite on :5173) & npm run dev:api (wrangler on :8788)
# Open http://localhost:8788

# Build + deploy
npm run build && npm run deploy
```

### Local D1

```bash
# Run migration on local DB
npx wrangler d1 execute memories-new-db --local --file=./migrations/0001_initial.sql

# Check local DB
npx wrangler d1 execute memories-new-db --local --command "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM quiz_results;"
```

### Production D1

```bash
# Run migration on production
npx wrangler d1 execute memories-new-db --remote --file=./migrations/0001_initial.sql

# Check production DB
npx wrangler d1 execute memories-new-db --remote --command "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM quiz_results;"
```

---

## Bugs Found & Fixed

### 1. `apiFetch` didn't throw on non-2xx (most impactful)
Frontend could show "saved" even when backend returned an error. Fixed by adding `if (!res.ok) throw` in `api.js`.

### 2. JWT issuer mismatch
Descope JWTs use different issuer formats. Fixed by accepting both `projectId` and `https://api.descope.com/{projectId}` in middleware.

### 3. useEffect race condition in save-after-login
`saveState` was missing from the dependency array, so if `isAuthenticated` became true before the Descope `onSuccess` callback set `saveState = "pending-login"`, the auto-save never fired. Fixed by adding `saveState` to the dependency array.

### 4. Two local D1 databases
`wrangler pages dev --d1=DB` creates an anonymous D1 binding with a different miniflare ID than the `database_id` in `wrangler.toml`. This meant `wrangler d1 execute --local` and the dev server used different SQLite files. Fixed by splitting `dev:full` into `dev` (vite) + `dev:api` (wrangler with `--proxy`).

### 5. `dev:full` proxy command deprecated
`wrangler pages dev ... -- vite` stopped working in wrangler v3 when `pages_build_output_dir` is set in `wrangler.toml` (conflicts: directory vs proxy). Switched to `--proxy=5173` approach.

### 6. Descope domain config
`memories.new` had to be added and saved in the Descope dashboard for prod auth to work. Easy to miss — the dashboard shows it as added but doesn't persist until you explicitly save.

---

## Security Notes

- JWTs validated via Descope JWKS endpoint (no secrets in Workers)
- `jose` library handles key caching, signature verification, expiry checks
- All `/api/results` and `/api/profile` endpoints require valid JWT
- `/api/profile/share/:token` is public (read-only, no sensitive data in payload)
- `/api/events` accepts anonymous events (JWT optional)
- User IDs come from `payload.sub` — never trust client-provided user IDs
- Share tokens are stateless base64url JSON — no database lookup, but also no revocation (acceptable tradeoff for now)

---

## What's Next

- Wire profile endpoints into frontend UI
- Profile share page (render shared profile from token)
- Result history view (retake comparison)
- Consider CORS restrictions for production (currently open)

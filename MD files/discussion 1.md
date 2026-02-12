# memories.new Backend Architecture

## Stack

| Layer | Tool | Why |
|---|---|---|
| Auth | Descope | Already used by team, handles magic links/OAuth/sessions, React SDK |
| API | Cloudflare Pages Functions | Lives alongside frontend in same repo, zero extra infra |
| Database | Cloudflare D1 (SQLite) | Structured data, free tier = 5M reads/day, 100K writes/day |
| Frontend | React/Vite on Cloudflare Pages | Already deployed, no changes to hosting |

Auth is fully offloaded to Descope — no KV namespaces, no email service, no custom token management. Descope issues JWTs that the backend validates.

---

## Auth Gate: Post-Quiz

Users take the quiz with zero friction — no login required. After completing the quiz and seeing their results, they're prompted to save:

```
Quiz complete → Results page renders immediately (client-side scoring, no backend needed)
  → "Save your results" CTA appears on results page
  → User clicks "Save" → Descope login modal opens (magic link, Google, etc.)
  → Descope handles auth, returns session JWT
  → Frontend calls POST /api/results with JWT in Authorization header
  → On future visits, Descope SDK checks for active session → if yes, fetch saved results
```

Key implications:
- Quiz completion and scoring remain 100% client-side (no backend dependency)
- The results page works fully without auth — copy-to-clipboard, preview, etc.
- Auth is only needed for persistence across devices/sessions
- If a user has already taken the quiz and returns logged in, show their saved result with option to retake
- Raw answers are included in the save payload so results can be recomputed if scoring changes

## Authentication: Descope

Auth is handled entirely by Descope — no custom auth endpoints, no email service, no session management.

### Frontend (React SDK)

```bash
npm install @descope/react-sdk
```

Wrap the app in Descope's AuthProvider:

```tsx
import { AuthProvider } from '@descope/react-sdk';

<AuthProvider projectId="YOUR_DESCOPE_PROJECT_ID">
  <App />
</AuthProvider>
```

Use the Descope flow component for login (renders magic link / OAuth UI):

```tsx
import { Descope, useSession, useUser } from '@descope/react-sdk';

// Check if logged in
const { isAuthenticated, isSessionLoading } = useSession();
const { user } = useUser();

// Render login flow when needed
<Descope flowId="sign-up-or-in" onSuccess={(e) => handleLoginSuccess(e)} />
```

### Backend (JWT Validation in Middleware)

Every API request that needs auth includes the Descope session token in the Authorization header. The middleware validates it using Descope's JWKS endpoint:

```typescript
// functions/api/_middleware.ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL(`https://api.descope.com/${DESCOPE_PROJECT_ID}/.well-known/jwks.json`)
);

export const onRequest: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://api.descope.com/${context.env.DESCOPE_PROJECT_ID}`,
      });
      context.data.user = {
        id: payload.sub,       // Descope user ID
        email: payload.email,  // User email from JWT claims
      };
    } catch {
      // Invalid token — user is not authenticated (that's OK for some endpoints)
    }
  }

  return context.next();
};
```

### User Sync to D1

On first authenticated API call (e.g. saving results), upsert the user into D1:

```sql
INSERT INTO users (id, email) VALUES (?, ?)
ON CONFLICT(id) DO UPDATE SET email = excluded.email, updated_at = datetime('now');
```

The `id` comes from `payload.sub` (Descope user ID), so the same user always maps to the same D1 row.

---

## D1 Database Schema

```sql
-- Users (synced from Descope on first API call)
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Descope user ID (from JWT sub claim)
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- Quiz results (supports multiple mini-apps)
CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  app_slug TEXT NOT NULL,          -- e.g. 'learn', 'collab', 'write'
  dimensions JSON NOT NULL,        -- {"informationDensity": "high", "explorationMode": "deep", ...}
  generated_prompt TEXT,           -- the personalized system prompt
  raw_answers JSON,                -- full answer data for re-scoring if dimensions change
  version INTEGER DEFAULT 1,      -- quiz version, for when you update questions
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_results_user ON quiz_results(user_id);
CREATE INDEX idx_results_app ON quiz_results(app_slug);
CREATE INDEX idx_results_user_app ON quiz_results(user_id, app_slug);

-- Analytics events (lightweight, beyond PostHog)
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),  -- nullable for anonymous events
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_data JSON,
  app_slug TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_created ON events(created_at);
```

Key design decisions:
- `dimensions` as JSON keeps it flexible across different mini-apps with different dimension sets
- `raw_answers` stored separately so you can re-compute dimensions if the scoring algorithm changes
- `version` on quiz_results lets you track which version of the quiz produced the result
- Events table is intentionally simple — PostHog handles the heavy analytics, this is for your own queryable data

---

---

## API Endpoints (Pages Functions)

All live under `functions/api/` in the repo.

### Auth

No custom auth endpoints needed — Descope handles everything client-side. The middleware validates the JWT on protected endpoints.

### Quiz Results

| Method | Path | Description |
|---|---|---|
| POST | `/api/results` | Save quiz result |
| GET | `/api/results` | Get all results for current user |
| GET | `/api/results/:appSlug` | Get latest result for a specific app |
| GET | `/api/results/:appSlug/history` | Get all results for a specific app (retakes) |

### Events

| Method | Path | Description |
|---|---|---|
| POST | `/api/events` | Log an event (batched from client) |

### Profile (future)

| Method | Path | Description |
|---|---|---|
| GET | `/api/profile` | Combined profile across all completed apps |
| GET | `/api/profile/share` | Generate shareable profile link |

---

## Project Structure (additions to existing repo)

```
memories-new/
├── functions/                    # Cloudflare Pages Functions
│   └── api/
│       ├── _middleware.ts        # Descope JWT validation middleware
│       ├── results/
│       │   ├── index.ts          # POST (save) + GET (list all)
│       │   └── [appSlug].ts      # GET latest for app
│       └── events/
│           └── index.ts          # POST batch events
├── migrations/                   # D1 migrations
│   └── 0001_initial.sql
├── src/                          # Existing frontend
│   ├── lib/
│   │   ├── api.ts                # API client wrapper (attaches Descope JWT)
│   │   └── auth.tsx              # Descope AuthProvider + hooks
│   └── ...existing files
├── wrangler.toml                 # Updated with D1 binding
└── package.json
```

---

## wrangler.toml Updates

```toml
# Add to existing wrangler.toml
[vars]
DESCOPE_PROJECT_ID = ""  # Your Descope project ID
APP_URL = "https://memories.new"

[[d1_databases]]
binding = "DB"
database_name = "memories-new-db"
database_id = ""  # Filled after creation
```

---

## Setup Steps (for Claude Code)

### 1. Create Cloudflare D1 database

```bash
wrangler d1 create memories-new-db
# → Copy the database_id into wrangler.toml
```

### 2. Set Descope project ID

Get your project ID from the Descope console (Project Settings → Project ID). Add it to `wrangler.toml` under `[vars]`.

### 3. Configure Descope flow

In the Descope console, make sure you have a "sign-up-or-in" flow configured with magic link (and optionally Google OAuth or other providers). Descope's default flow works out of the box for this.

### 4. Run initial migration

```bash
wrangler d1 execute memories-new-db --file=./migrations/0001_initial.sql
```

### 5. Install dependencies

```bash
npm install @descope/react-sdk jose
```

### 6. Implement the functions

Build in this order:
1. `_middleware.ts` (Descope JWT validation — everything depends on this)
2. Results endpoints (save → get)
3. Events endpoint
4. Frontend: Descope AuthProvider + API client
5. Wire login into results page

### 7. Test locally

```bash
wrangler pages dev --d1=DB
```

### 8. Deploy

```bash
npm run build && wrangler pages deploy dist
```

---

## Claude Code Instructions

When working with Claude Code on this, give it this context:

> This is a React/Vite single-file SPA (App.jsx) deployed on Cloudflare Pages. The app uses useState to switch between LandingPage, QuizPage, and ResultsPage — no router. Scoring (computeProfile) and prompt generation (generatePrompt) are fully client-side. I'm adding a backend using Pages Functions (in /functions) and D1 for the database. Auth is handled by Descope (React SDK on frontend, JWT validation on backend via jose). TypeScript for all new backend code. The app is already deployed at memories.new.

### Frontend Integration Points (in current App.jsx)

1. **App root:** Wrap in Descope's `<AuthProvider projectId="...">`. Use `useSession()` and `useUser()` hooks to check auth state.

2. **App mount (`App` component):** Add a `useEffect` that checks `isAuthenticated`. If true, fetch `GET /api/results/learn` with the session JWT to load saved results.

3. **Results page (`ResultsPage` component):** Add a "Save your results" section below the prompt card. If not logged in, render Descope's `<Descope flowId="sign-up-or-in" />` component. On success, auto-save via `POST /api/results`. If already logged in, save immediately and show confirmation.

4. **API client (`src/lib/api.ts`):** Every authenticated request attaches the Descope session token as `Authorization: Bearer <token>`. Get the token via `getSessionToken()` from the Descope SDK.

5. **onComplete callback:** Currently just sets answers + switches page. No change needed here — scoring stays client-side. The save happens from the results page after optional auth.

6. **Returning user flow:** If `isAuthenticated` AND `GET /api/results/learn` returns a result, skip the landing page and show their saved results with a "Retake quiz" option.

Then work through the setup steps above in order. For each Pages Function, Claude Code should:
- Use TypeScript
- Type the `Env` bindings (DB, DESCOPE_PROJECT_ID, APP_URL)
- Use the `onRequest` export pattern for Pages Functions
- Return proper JSON responses with appropriate status codes
- Handle errors gracefully

### Env type definition (create as `functions/types.ts`):

```typescript
export interface Env {
  DB: D1Database;
  DESCOPE_PROJECT_ID: string;
  APP_URL: string;
}
```

---

## Security Notes

- Auth tokens: Descope-issued JWTs, validated via JWKS endpoint (no secrets stored in Workers)
- JWT validation uses `jose` library — verify issuer, expiry, and signature on every protected request
- All /api/results and /api/profile endpoints require valid JWT (enforced in middleware)
- /api/events accepts anonymous events (JWT optional)
- User IDs come from Descope (`payload.sub`) — never trust client-provided user IDs
- CORS: only allow memories.new origin in production
- The `jose` JWKS client caches keys automatically — no need for manual caching

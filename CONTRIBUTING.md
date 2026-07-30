# Contributing

Thanks for taking an interest. This is a small project with a few firm
conventions — following them keeps it small.

## Setup

You need Python ≥ 3.13 with [uv](https://docs.astral.sh/uv/), and Node ≥ 22.

```bash
# backend
cd backend
cp .env.example .env        # LiveKit + sign-in credentials
uv run main.py              # http://localhost:8000

# frontend (second terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173, /api proxied to :8000
```

No LiveKit server handy? The backend boots without `LIVEKIT_*` set — every
page then shows the configuration gate, which is enough to work on auth and
UI chrome.

## Conventions

**Backend** (`backend/`)

- `main.py` and `config.py` stay at the root; everything else lives in
  `src/`. Each domain is a folder under `src/modules/<name>/` with a
  `routes.py` exposing a `router` that `main.py` includes. Cross-cutting
  concerns (auth enforcement) live in `src/middleware/`.
- **No hand-written LiveKit models.** Requests are parsed with `ParseDict`
  into LiveKit's protobuf messages, responses serialised with
  `MessageToDict` (`src/livekit_api.py`). If you find yourself writing a
  Pydantic model that mirrors a LiveKit type, stop — pass the schema
  through instead.
- Every route mounted under `/api` is authenticated by the middleware
  automatically. Add a path to `PUBLIC_API_PATHS` only with a comment
  saying why it must be public.

**Frontend** (`frontend/`)

- Route files under `src/routes/` stay thin — query wiring plus layout.
  Real code lives in `src/components/<domain>/`, one folder per domain,
  even for a single file.
- All data fetching goes through TanStack Query; the `queryOptions` live in
  `src/lib/queries.ts` and the fetch wrapper in `src/lib/api.ts`. No
  ad-hoc `fetch` calls in components.
- LiveKit's JSON shapes (camelCase, int64 as strings, enums by name) are
  typed in `src/lib/types.ts` — declare only the fields the UI reads, and
  put display helpers for LiveKit quirks in `src/lib/livekit.ts`.
- `src/components/ui/` is vendored shadcn/ui — prefer regenerating with the
  shadcn CLI over hand-editing.
- Forms that edit LiveKit resources must preserve fields they have no
  inputs for (see the `base` payload pattern in the form sheets). Updates
  are full replaces — dropping a field deletes it on the server.

## Before opening a PR

```bash
cd frontend && npm run build && npm run typecheck
```

Keep PRs focused; describe what changed and why. If a change alters what a
mutation sends to LiveKit, say so explicitly in the description.

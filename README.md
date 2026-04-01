# Lockstep Prototype

This repo contains a runnable prototype of Lockstep with a React Native (Expo) app and a Node/Express API backed by Supabase/PostgreSQL.

## Structure
- `apps/mobile` – Expo mobile app with the core screens and UI flow
- `apps/api` – Express API backed by Supabase/PostgreSQL
- `apps/api/supabase` – SQL schema + seed data

## Getting Started
1. Install dependencies from the repo root:

```bash
npm install
```

2. Create a Supabase project and run the SQL in `apps/api/supabase/schema.sql` (and optionally `seed.sql`) using the Supabase SQL editor.

3. Set API env vars (example):

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

4. Start the API:

```bash
npm run dev:api
```

5. Start the mobile app:

```bash
npm run dev:mobile
```

The app expects the API at `http://localhost:4000/v1`. You can override it with `EXPO_PUBLIC_API_BASE`.

## Prototype Notes
- HealthKit and Screen Time API integration are stubbed in the UI and require native iOS entitlements.
- The API expects a Supabase/PostgreSQL database. See `apps/api/supabase/schema.sql`.
- Manual step simulation is available on the Home screen for testing unlock logic.

## API Snapshot
- `GET /v1/health`
- `GET /v1/users`
- `POST /v1/users`
- `GET /v1/dashboard?userId=...`
- `POST /v1/steps`
- `GET /v1/apps?userId=...`
- `GET /v1/app-groups?userId=...`
- `GET /v1/groups?userId=...`
- `GET /v1/leaderboard?scope=daily|weekly&groupId=...`
- `POST /v1/grace-unlock`

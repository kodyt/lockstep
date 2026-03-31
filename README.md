# Lockstep Prototype

This repo contains a runnable prototype of Lockstep with a React Native (Expo) app and a lightweight Node/Express API.

## Structure
- `apps/mobile` – Expo mobile app with the core screens and UI flow
- `apps/api` – Express + lowdb API that mocks the backend data model and unlock logic

## Getting Started
1. Install dependencies from the repo root:

```bash
npm install
```

2. Start the API:

```bash
npm run dev:api
```

3. Start the mobile app:

```bash
npm run dev:mobile
```

The app expects the API at `http://localhost:4000/v1`. You can override it with `EXPO_PUBLIC_API_BASE`.

## Prototype Notes
- HealthKit and Screen Time API integration are stubbed in the UI and require native iOS entitlements.
- The API uses a JSON file at `apps/api/data/db.json` (auto-created) for sample data.
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

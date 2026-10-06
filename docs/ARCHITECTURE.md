# Architecture

AgriGuide uses a Vite React app with a shared Express API. `/api` is routed to the API service; the frontend uses generated client hooks from the OpenAPI contract.

## Request flow

1. A farmer submits farm details.
2. The API validates the body, verifies ownership of any selected farm profile, and resolves nearby weather through Open-Meteo (falling back to neutral weather data if lookup fails).
3. A deterministic server-side engine evaluates the crop dataset and stores the farm snapshot, weather, top three scores, and factor risks in PostgreSQL.
4. The optional AI endpoint reads the saved analysis for the authenticated user and asks Gemini for explanations and actions only. The response is Zod-validated and the ranked crop remains fixed.

## Data and ownership

Drizzle schemas define `users`, `farm_profiles`, `analyses`, and `ai_outputs`. User-owned reads, updates, and deletes constrain both record ID and the authenticated user ID. Password hashes are excluded from response objects. All database credentials remain server-side.

## Authentication

The API hashes passwords using bcrypt-compatible hashing and signs seven-day HS256 JWTs containing user ID and email. Protected endpoints verify signature and expiry before deriving the owner ID. Clients store the access token locally and attach it as a bearer token through the shared API fetcher.

## Environment

Use `SUPABASE_DATABASE_URL` to override the platform-managed `DATABASE_URL` with a Supabase PostgreSQL connection string. Open-Meteo requires no key. `GEMINI_API_KEY` is read only by the Express service.

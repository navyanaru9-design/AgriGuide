# AgriGuide

AgriGuide is a crop recommendation and farm advisory app for Indian farmers. It compares crops against a farm's soil, region, weather, water access, previous crop, and season.

## Features

- Email registration, login, JWT-protected pages, profile updates, and password changes.
- Farm profile create, read, update, and delete.
- A deterministic crop engine that returns the top three options with factor scores and risk levels.
- Open-Meteo weather lookup with a clear fallback when location or live weather is unavailable.
- Gemini farm advice generated on the server from saved analysis data. AI never changes crop ranking.
- Saved analysis history, search, filters, sorting, and dashboard summaries.
- English, Telugu, and Hindi UI labels.

## Tech stack and architecture

- React, TypeScript, Vite, Wouter, Tailwind CSS, Lucide React.
- Express API, Zod validation, bcrypt-compatible password hashing, signed JWTs.
- PostgreSQL through Drizzle ORM. Set `SUPABASE_DATABASE_URL` to use a Supabase PostgreSQL connection; otherwise the app uses the Replit-provided `DATABASE_URL`.
- Open-Meteo for forecast and geocoding; Google Gemini `gemini-2.5-flash` for optional advice.
- `artifacts/agriguide` contains the web app; `artifacts/api-server` contains the API; `lib/db` contains the data model; `lib/api-spec/openapi.yaml` is the API contract.

## Recommendation algorithm

Each candidate is scored from 0–100 using fixed weights:

| Factor | Weight |
| --- | ---: |
| Soil compatibility | 25% |
| Region compatibility | 20% |
| Weather compatibility | 20% |
| Water availability | 15% |
| Previous-crop rotation | 10% |
| Season compatibility | 10% |

Scores are deterministic, clamped to 0–100, and sorted highest first. Missing weather uses a neutral score and a visible fallback notice. The demo values are inputs only; recommendations are calculated at runtime.

## Database and security

The database has `users`, `farm_profiles`, `analyses`, and `ai_outputs`, with foreign keys and user/time indexes. The API obtains the owner from the verified JWT, never from request data, and every user-owned query includes that owner ID. Passwords are hashed and password hashes are never returned. Gemini credentials stay on the server. Supabase RLS policies based on `auth.uid()` are not used because this app authenticates with its own JWTs; authorization is enforced in the API.

## Setup

1. Install dependencies with `pnpm install`.
2. Configure the environment variables below in Replit Secrets.
3. Apply the schema with `pnpm --filter @workspace/db run push`.
4. Start the existing API and web workflows.

The app can run against the Replit-provided PostgreSQL database. To use Supabase Postgres, set `SUPABASE_DATABASE_URL` to its PostgreSQL connection string; it takes precedence over the platform `DATABASE_URL`. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are included for the requested Supabase configuration but are not used by this server-side PostgreSQL/JWT flow.

## Environment variables

See `.env.example`. `JWT_SECRET` is preferred; when it is absent, `SESSION_SECRET` is used. `GEMINI_API_KEY` enables the farm-advisor response. Analysis scoring and saved records work without Gemini.

## Demo flow

Open the landing page and choose **Try Demo Farm**. It uses India, Andhra Pradesh, Kadapa, red soil, moderate water, borewell irrigation, maize as the previous crop, Kharif, and Kadapa coordinates. Change water availability to **Very Low** and analyze again to see its weighted effect on the ranking.

## Deployment

The web app and API run as separate managed services in this workspace. Configure the same PostgreSQL connection and authentication secret for the API service in development and deployment environments. Run `pnpm run build` for the workspace build.

## Responsible AI

“AgriGuide provides AI-assisted decision support and does not guarantee yield, profit or crop success. Farmers should validate recommendations with local agricultural experts and current field conditions.”

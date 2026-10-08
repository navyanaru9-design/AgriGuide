import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// Try loading .env from current or parent directories if env variables are not already loaded
function tryLoadEnv() {
  if (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.JWT_SECRET) {
    return;
  }
  let currentDir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const candidate = path.join(currentDir, ".env");
    if (fs.existsSync(candidate)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(candidate);
        } else {
          // Fallback parser for Node versions without loadEnvFile
          const content = fs.readFileSync(candidate, "utf8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
              const eqIdx = trimmed.indexOf("=");
              if (eqIdx > 0) {
                const key = trimmed.slice(0, eqIdx).trim();
                const val = trimmed.slice(eqIdx + 1).trim();
                if (!process.env[key]) {
                  process.env[key] = val;
                }
              }
            }
          }
        }
      } catch {
        // ignore load errors
      }
      break;
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
}

tryLoadEnv();

const { Pool } = pg;
const connectionString = (process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL)?.trim();

const migrationSql = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL DEFAULT 'My farm',
  country TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  latitude REAL,
  longitude REAL,
  soil_type TEXT NOT NULL,
  water_availability TEXT NOT NULL,
  irrigation_source TEXT NOT NULL,
  previous_crop TEXT NOT NULL,
  season TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_profile_id UUID REFERENCES farm_profiles(id) ON DELETE SET NULL,
  farm_data JSONB NOT NULL,
  weather_data JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  top_crop TEXT NOT NULL,
  top_score REAL NOT NULL,
  risk_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  recommended_crop TEXT NOT NULL,
  reasons JSONB NOT NULL,
  action_plan JSONB NOT NULL,
  risks JSONB NOT NULL,
  water_advice TEXT NOT NULL,
  weather_advice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS farm_profiles_user_id_idx ON farm_profiles(user_id);
CREATE INDEX IF NOT EXISTS analyses_user_created_idx ON analyses(user_id, created_at);
CREATE INDEX IF NOT EXISTS analyses_user_farm_idx ON analyses(user_id, farm_profile_id);
CREATE INDEX IF NOT EXISTS ai_outputs_user_analysis_idx ON ai_outputs(user_id, analysis_id);
`;

let dbInstance: any;
let poolInstance: any = null;

if (connectionString) {
  poolInstance = new Pool({ connectionString });
  dbInstance = drizzlePg(poolInstance, { schema });
  // Ensure tables exist in Postgres
  poolInstance.query(migrationSql).catch((err: unknown) => {
    console.warn("Database table initialization notice:", (err as Error).message);
  });
} else {
  // Use persistent local PGlite PostgreSQL database
  const dataDir = path.resolve(process.cwd(), ".data/postgres");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const pglite = new PGlite(dataDir);
  dbInstance = drizzlePglite(pglite, { schema });
  pglite.exec(migrationSql).catch((err: unknown) => {
    console.warn("PGlite table initialization notice:", (err as Error).message);
  });
}

export const pool = poolInstance;
export const db = dbInstance;

export * from "./schema";

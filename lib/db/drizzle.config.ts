import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

// Load .env if present
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // ignore
}

const connectionString = (process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL) || "postgresql://postgres:postgres@localhost:5432/postgres";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});

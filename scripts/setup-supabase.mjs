import pg from "pg";
const { Client } = pg;

const url = "postgresql://postgres:Navya%4004050@db.lyzoykzxgkrbictjpqrd.supabase.co:5432/postgres";

async function setupTables() {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("Connected to Supabase PostgreSQL!");
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log("Existing tables:", res.rows.map(r => r.table_name));

  const ddl = `
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
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
      top_score NUMERIC NOT NULL,
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

  console.log("Applying DDL...");
  await client.query(ddl);
  console.log("DDL applied successfully!");

  const check = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log("Verified public tables in Supabase:", check.rows.map(r => r.table_name));

  await client.end();
}

setupTables().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});

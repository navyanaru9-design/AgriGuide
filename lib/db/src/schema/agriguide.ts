import {
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const farmProfilesTable = pgTable(
  "farm_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    farmName: text("farm_name").notNull().default("My farm"),
    country: text("country").notNull(),
    state: text("state").notNull().default(""),
    district: text("district").notNull().default(""),
    village: text("village").notNull().default(""),
    latitude: real("latitude"),
    longitude: real("longitude"),
    soilType: text("soil_type").notNull(),
    waterAvailability: text("water_availability").notNull(),
    irrigationSource: text("irrigation_source").notNull(),
    previousCrop: text("previous_crop").notNull(),
    season: text("season").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("farm_profiles_user_id_idx").on(table.userId)],
);

export const analysesTable = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    farmProfileId: uuid("farm_profile_id").references(() => farmProfilesTable.id, { onDelete: "set null" }),
    farmData: jsonb("farm_data").notNull().$type<Record<string, unknown>>(),
    weatherData: jsonb("weather_data").notNull().$type<Record<string, unknown>>(),
    recommendations: jsonb("recommendations").notNull().$type<Record<string, unknown>[]>(),
    topCrop: text("top_crop").notNull(),
    topScore: real("top_score").notNull(),
    riskData: jsonb("risk_data").notNull().$type<Record<string, unknown>[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analyses_user_created_idx").on(table.userId, table.createdAt),
    index("analyses_user_farm_idx").on(table.userId, table.farmProfileId),
  ],
);

export const aiOutputsTable = pgTable(
  "ai_outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    analysisId: uuid("analysis_id").notNull().references(() => analysesTable.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    recommendedCrop: text("recommended_crop").notNull(),
    reasons: jsonb("reasons").notNull().$type<string[]>(),
    actionPlan: jsonb("action_plan").notNull().$type<string[]>(),
    risks: jsonb("risks").notNull().$type<string[]>(),
    waterAdvice: text("water_advice").notNull(),
    weatherAdvice: text("weather_advice").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ai_outputs_user_analysis_idx").on(table.userId, table.analysisId)],
);

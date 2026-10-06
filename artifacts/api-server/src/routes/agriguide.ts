import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  aiOutputsTable,
  analysesTable,
  db,
  farmProfilesTable,
  usersTable,
} from "@workspace/db";
import {
  CreateAnalysisBody,
  CreateFarmBody,
  CreateFarmResponse,
  CreateAnalysisResponse,
  DeleteAnalysisParams,
  DeleteAnalysisResponse,
  DeleteFarmParams,
  DeleteFarmResponse,
  GetAiAdviceBody,
  GetAiAdviceResponse,
  GetAnalysisParams,
  GetAnalysisResponse,
  GetCurrentUserResponse,
  GetDashboardResponse,
  GetFarmParams,
  GetFarmResponse,
  GetProfileResponse,
  GetWeatherQueryParams,
  GetWeatherResponse,
  ListAnalysesResponse,
  ListCropsResponse,
  ListFarmsResponse,
  LoginUserBody,
  LoginUserResponse,
  LogoutUserResponse,
  RegisterUserBody,
  RegisterUserResponse,
  UpdateFarmBody,
  UpdateFarmParams,
  UpdateFarmResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { getCropDataset, recommendCrops, type FarmInput, type WeatherInput } from "../lib/agri";

const router: IRouter = Router();
const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
const advisorOutputSchema = GetAiAdviceResponse;

type AuthUser = { id: string; email: string };
type AuthedRequest = Request & { authUser?: AuthUser };
type DbFarm = typeof farmProfilesTable.$inferSelect;

function jwtSecret(): string | undefined {
  return process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
}

function signJwt(user: AuthUser): string {
  const secret = jwtSecret();
  if (!secret) throw new Error("Authentication secret is not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    iat: now,
    exp: now + oneWeekMs / 1000,
  })).toString("base64url");
  const content = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(content).digest("base64url");
  return `${content}.${signature}`;
}

function readJwt(token: string): AuthUser | null {
  const secret = jwtSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const content = `${header}.${payload}`;
  const expected = createHmac("sha256", secret).update(content).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: unknown;
      email?: unknown;
      exp?: unknown;
    };
    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.exp !== "number" ||
      decoded.exp <= Math.floor(Date.now() / 1000)
    ) return null;
    return { id: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const user = token ? readJwt(token) : null;
  if (!user) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  (req as AuthedRequest).authUser = user;
  next();
}

function authed(req: Request): AuthUser {
  const user = (req as AuthedRequest).authUser;
  if (!user) throw new Error("Authentication middleware was not applied");
  return user;
}

function publicUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function farmApi(farm: DbFarm) {
  return {
    id: farm.id,
    farmName: farm.farmName,
    country: farm.country,
    state: farm.state,
    district: farm.district,
    village: farm.village,
    latitude: farm.latitude,
    longitude: farm.longitude,
    soilType: farm.soilType,
    waterAvailability: farm.waterAvailability,
    irrigationSource: farm.irrigationSource,
    previousCrop: farm.previousCrop,
    season: farm.season,
    createdAt: farm.createdAt.toISOString(),
    updatedAt: farm.updatedAt.toISOString(),
  };
}

function farmData(farm: FarmInput) {
  return {
    farmName: farm.farmName ?? "My farm",
    country: farm.country,
    state: farm.state ?? "",
    district: farm.district ?? "",
    village: farm.village ?? "",
    latitude: farm.latitude ?? null,
    longitude: farm.longitude ?? null,
    soilType: farm.soilType,
    waterAvailability: farm.waterAvailability,
    irrigationSource: farm.irrigationSource,
    previousCrop: farm.previousCrop,
    season: farm.season,
  };
}

function fallbackWeather(reason = "Live weather is unavailable. The analysis used neutral weather assumptions.") : WeatherInput {
  return {
    temperatureC: null,
    rainfallMm: null,
    humidityPercent: null,
    windKmh: null,
    condition: reason,
    source: "Fallback",
    fallback: true,
  };
}

function wmoCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Current conditions";
}

async function getWeatherAt(latitude: number, longitude: number, source = "Open-Meteo"): Promise<WeatherInput> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
    url.searchParams.set("daily", "rain_sum,weather_code");
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("timezone", "auto");
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return fallbackWeather("Live weather could not be reached. The analysis used neutral weather assumptions.");
    const data = await response.json() as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; wind_speed_10m?: number; weather_code?: number };
      daily?: { rain_sum?: number[]; weather_code?: number[] };
    };
    const current = data.current;
    if (!current) return fallbackWeather();
    const rainValues = data.daily?.rain_sum?.filter(Number.isFinite) ?? [];
    const code = current.weather_code ?? data.daily?.weather_code?.[0] ?? -1;
    return {
      temperatureC: current.temperature_2m ?? null,
      rainfallMm: rainValues.length ? rainValues.reduce((sum, value) => sum + value, 0) : null,
      humidityPercent: current.relative_humidity_2m ?? null,
      windKmh: current.wind_speed_10m ?? null,
      condition: wmoCondition(code),
      source,
      fallback: false,
    };
  } catch {
    return fallbackWeather("Live weather lookup failed. The analysis used neutral weather assumptions.");
  }
}

async function weatherForFarm(farm: FarmInput): Promise<WeatherInput> {
  if (typeof farm.latitude === "number" && typeof farm.longitude === "number") {
    return getWeatherAt(farm.latitude, farm.longitude);
  }
  const place = [farm.village, farm.district, farm.state, farm.country].filter(Boolean).join(", ");
  if (place.length < 3) return fallbackWeather("Add a location or coordinates for a live weather lookup.");
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", place);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = response.ok ? await response.json() as { results?: Array<{ latitude: number; longitude: number }> } : {};
    const result = data.results?.[0];
    if (!result) return fallbackWeather("No nearby weather station was found. The analysis used neutral weather assumptions.");
    return getWeatherAt(result.latitude, result.longitude, "Open-Meteo · nearest matched place");
  } catch {
    return fallbackWeather("Location lookup failed. The analysis used neutral weather assumptions.");
  }
}

function analysisApi(row: typeof analysesTable.$inferSelect) {
  return {
    id: row.id,
    farmProfileId: row.farmProfileId,
    farm: row.farmData,
    weather: row.weatherData,
    recommendations: row.recommendations,
    topCrop: row.topCrop,
    topScore: row.topScore,
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a name, a valid email, and a password of at least 8 characters." });
    return;
  }
  const fullName = parsed.data.fullName.trim();
  const email = parsed.data.email.toLowerCase().trim();
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db.insert(usersTable).values({ fullName, email, passwordHash }).returning();
  const output = RegisterUserResponse.parse({ token: signJwt({ id: user.id, email: user.email }), user: publicUser(user) });
  res.status(201).json(output);
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }
  res.json(LoginUserResponse.parse({ token: signJwt({ id: user.id, email: user.email }), user: publicUser(user) }));
});

router.post("/auth/logout", (_req, res): void => {
  res.json(LogoutUserResponse.parse({ ok: true }));
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authed(req).id)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Account is no longer available." });
    return;
  }
  res.json(GetCurrentUserResponse.parse(publicUser(user)));
});

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authed(req).id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  res.json(GetProfileResponse.parse(publicUser(user)));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the profile details and password requirements." });
    return;
  }
  const userId = authed(req).id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  const { fullName, currentPassword, newPassword } = parsed.data;
  const update: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
  if (fullName !== undefined) update.fullName = fullName.trim();
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }
    update.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  const [updated] = await db.update(usersTable).set(update).where(eq(usersTable.id, userId)).returning();
  res.json(UpdateProfileResponse.parse(publicUser(updated)));
});

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = authed(req).id;
  const rows = await db.select().from(analysesTable).where(eq(analysesTable.userId, userId)).orderBy(desc(analysesTable.createdAt)).limit(6);
  const total = await db.select({ id: analysesTable.id }).from(analysesTable).where(eq(analysesTable.userId, userId));
  const latest = rows[0] ? analysisApi(rows[0]) : null;
  res.json(GetDashboardResponse.parse({
    totalAnalyses: total.length,
    latest,
    recent: rows.map(analysisApi),
  }));
});

router.get("/farms", requireAuth, async (req, res): Promise<void> => {
  const farms = await db.select().from(farmProfilesTable).where(eq(farmProfilesTable.userId, authed(req).id)).orderBy(desc(farmProfilesTable.updatedAt));
  res.json(ListFarmsResponse.parse(farms.map(farmApi)));
});

router.post("/farms", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Complete the required farm details." });
    return;
  }
  const [farm] = await db.insert(farmProfilesTable).values({ ...farmData(parsed.data), userId: authed(req).id }).returning();
  res.status(201).json(CreateFarmResponse.parse(farmApi(farm)));
});

router.get("/farms/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid farm identifier." });
    return;
  }
  const [farm] = await db.select().from(farmProfilesTable).where(and(eq(farmProfilesTable.id, params.data.id), eq(farmProfilesTable.userId, authed(req).id))).limit(1);
  if (!farm) {
    res.status(404).json({ error: "Farm not found." });
    return;
  }
  res.json(GetFarmResponse.parse(farmApi(farm)));
});

router.patch("/farms/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateFarmParams.safeParse(req.params);
  const parsed = UpdateFarmBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Check the farm details." });
    return;
  }
  const update = Object.fromEntries(
    Object.entries(parsed.data).map(([key, value]) => [key, key === "farmName" ? (value as string).trim() : value]),
  );
  const [farm] = await db.update(farmProfilesTable)
    .set({ ...update, updatedAt: new Date() })
    .where(and(eq(farmProfilesTable.id, params.data.id), eq(farmProfilesTable.userId, authed(req).id)))
    .returning();
  if (!farm) {
    res.status(404).json({ error: "Farm not found." });
    return;
  }
  res.json(UpdateFarmResponse.parse(farmApi(farm)));
});

router.delete("/farms/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid farm identifier." });
    return;
  }
  const [farm] = await db.delete(farmProfilesTable)
    .where(and(eq(farmProfilesTable.id, params.data.id), eq(farmProfilesTable.userId, authed(req).id)))
    .returning({ id: farmProfilesTable.id });
  if (!farm) {
    res.status(404).json({ error: "Farm not found." });
    return;
  }
  res.json(DeleteFarmResponse.parse({ ok: true }));
});

router.get("/analyses", requireAuth, async (req, res): Promise<void> => {
  const analyses = await db.select().from(analysesTable).where(eq(analysesTable.userId, authed(req).id)).orderBy(desc(analysesTable.createdAt));
  res.json(ListAnalysesResponse.parse(analyses.map(analysisApi)));
});

router.post("/analyses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Complete the farm details before analyzing." });
    return;
  }
  const userId = authed(req).id;
  let farm: FarmInput = parsed.data;
  if (parsed.data.farmProfileId) {
    const [profile] = await db.select().from(farmProfilesTable).where(and(
      eq(farmProfilesTable.id, parsed.data.farmProfileId),
      eq(farmProfilesTable.userId, userId),
    )).limit(1);
    if (!profile) {
      res.status(404).json({ error: "Farm profile not found." });
      return;
    }
    farm = farmApi(profile);
  }
  const weather = await weatherForFarm(farm);
  const recommendations = recommendCrops(farm, weather);
  const top = recommendations[0];
  const risks = top.risks.map((risk) => ({ category: risk.split(":")[0], level: risk.split(": ")[1] }));
  const [analysis] = await db.insert(analysesTable).values({
    userId,
    farmProfileId: parsed.data.farmProfileId ?? null,
    farmData: farmData(farm),
    weatherData: weather,
    recommendations,
    topCrop: top.crop,
    topScore: top.score,
    riskData: risks,
  }).returning();
  res.status(201).json(CreateAnalysisResponse.parse(analysisApi(analysis)));
});

router.get("/analyses/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid analysis identifier." });
    return;
  }
  const [analysis] = await db.select().from(analysesTable).where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.userId, authed(req).id))).limit(1);
  if (!analysis) {
    res.status(404).json({ error: "Analysis not found." });
    return;
  }
  res.json(GetAnalysisResponse.parse(analysisApi(analysis)));
});

router.delete("/analyses/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid analysis identifier." });
    return;
  }
  const [analysis] = await db.delete(analysesTable).where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.userId, authed(req).id))).returning({ id: analysesTable.id });
  if (!analysis) {
    res.status(404).json({ error: "Analysis not found." });
    return;
  }
  res.json(DeleteAnalysisResponse.parse({ ok: true }));
});

router.get("/crops", (_req, res): void => {
  res.json(ListCropsResponse.parse(getCropDataset()));
});

router.get("/weather", async (req, res): Promise<void> => {
  const parsed = GetWeatherQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide valid latitude and longitude values." });
    return;
  }
  const weather = await getWeatherAt(parsed.data.latitude, parsed.data.longitude);
  res.json(GetWeatherResponse.parse(weather));
});

router.post("/ai/advice", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetAiAdviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Select a saved analysis for farm advice." });
    return;
  }
  const userId = authed(req).id;
  const [analysis] = await db.select().from(analysesTable).where(and(
    eq(analysesTable.id, parsed.data.analysisId),
    eq(analysesTable.userId, userId),
  )).limit(1);
  if (!analysis) {
    res.status(404).json({ error: "Analysis not found." });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Farm advice is unavailable until a Gemini key is configured. Your crop recommendations are saved." });
    return;
  }
  const prompt = [
    "You are AgriGuide's agricultural decision-support assistant. Use only the provided farm data, weather data, crop information and calculated scores. Do not change the crop ranking. Do not invent missing information. Do not guarantee crop yield or profit. Give simple practical farmer-friendly advice. Return only valid JSON.",
    'Expected JSON: {"summary":"string","recommendedCrop":"string","reasons":["string"],"actionPlan":["string"],"risks":["string"],"waterAdvice":"string","weatherAdvice":"string"}',
    "The crop recommendation and ranking below are already calculated deterministically. Your role is explanation and practical advice only; recommendedCrop must exactly match the top-ranked crop.",
    JSON.stringify({
      farm: analysis.farmData,
      weather: analysis.weatherData,
      rankedCrops: analysis.recommendations,
      selectedTopCrop: analysis.topCrop,
      topScore: analysis.topScore,
      factorBreakdown: (analysis.recommendations as Array<{ crop: string; factors: Record<string, number> }>).map(({ crop, factors }) => ({ crop, factors })),
      risks: analysis.riskData,
      cropInformation: getCropDataset().filter((crop) =>
        (analysis.recommendations as Array<{ crop: string }>).some((recommendation) => recommendation.crop === crop.name),
      ),
    }),
  ].join("\n\n");
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      req.log.warn({ statusCode: response.status }, "Gemini advice request failed");
      res.status(502).json({ error: "The farm advisor could not respond just now. Your crop ranking is unaffected." });
      return;
    }
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) throw new Error("Gemini returned no advice");
    const advice = advisorOutputSchema.parse(JSON.parse(text));
    if (advice.recommendedCrop !== analysis.topCrop) {
      advice.recommendedCrop = analysis.topCrop;
    }
    await db.insert(aiOutputsTable).values({
      userId,
      analysisId: analysis.id,
      summary: advice.summary,
      recommendedCrop: analysis.topCrop,
      reasons: advice.reasons,
      actionPlan: advice.actionPlan,
      risks: advice.risks,
      waterAdvice: advice.waterAdvice,
      weatherAdvice: advice.weatherAdvice,
    });
    res.json(advisorOutputSchema.parse({ ...advice, recommendedCrop: analysis.topCrop }));
  } catch (error) {
    req.log.warn({ err: error }, "Farm advisor output was unavailable or invalid");
    res.status(502).json({ error: "The farm advisor could not respond just now. Your crop ranking is unaffected." });
  }
});

export default router;

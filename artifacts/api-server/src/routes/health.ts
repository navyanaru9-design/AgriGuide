import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    backend: "connected",
  });
});

router.get("/health/db", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      success: true,
      database: "connected",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      database: "disconnected",
    });
  }
});

export default router;

import fs from "node:fs";
import path from "node:path";

// Load .env before importing app or database modules
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
        // ignore
      }
      break;
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
}

tryLoadEnv();

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

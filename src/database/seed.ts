import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import keys from "../config/keys.js";
import { redis } from "../redis/redis.js";
import { createDatabase, applySchema, seedCodes } from "./schema.js";

// Create the database if it doesn't exist
await createDatabase();

const pool = new Pool({
  user: keys.dbUser as string,
  host: keys.dbHost as string,
  database: keys.dbDatabase as string,
  password: keys.dbPassword as string,
  port: keys.dbPort as number,
  ssl:
    process.env.NODE_ENV_DB === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

// Test the database connection
try {
  const client = await pool.connect();
  console.log(`[postgres] connected to database: ${keys.dbDatabase}`);
  client.release();
} catch (err) {
  console.error("[postgres] database connection failed:", err);
  process.exit(1);
}

const databasePath = fileURLToPath(new URL("./", import.meta.url));

// Create triggers and tables
try {
  await applySchema(pool, { verbose: true });
} catch (err) {
  console.error(err);
}

// ----------------------------------
//     POPULATING ULTRA CODES TABLE
// ----------------------------------
await seedCodes(pool, { verbose: true });

// Now flush redis to clear any existing data in case the same database is being reused.
// Only do this if Redis is enabled.
if (keys.redisEnabled) {
  redis
    .flushdb()
    .then(() => {
      console.log("\n[redis] flushed the database.");
      // end redis connection after flushing
      redis.quit();
    })
    .catch((err: Error) => {
      console.error("[redis] failed to flush the database:", err.message);
    });
}

// Delete perf/codes.txt (codes are stale after the DB is reseeded)
const perfCodesPath = path.join(databasePath, "../../perf/codes.txt");
fs.unlink(perfCodesPath, (err) => {
  if (err && err.code !== "ENOENT") {
    console.error(
      "[perf] failed to delete codes.txt. Please delete it manually.",
      err,
    );
  } else {
    console.log("\n[perf] deleted codes.txt.");
  }
});


/*
  Seed the `codes` table used by the performance demo (see src/perf/routes.ts).

  Run:
  npm run perf:seed            -- default (0 records, just creates the table)
  npm run perf:seed -- -r 20M  -- insert 20 million records

  Note: only the PostgreSQL side is seeded here. After seeding, run
  `npm run perf:migrate` to backfill Redis, or use /code-fast entirely
  through Redis with codes written on the fly.
*/

import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import keys from "../config/keys.js";
import { redis } from "./redis.js";
import { generateCode } from "./utils.js";

// Create the database if it doesn't exist
async function createDatabase() {
  const adminPool = new Pool({
    user: keys.dbUser,
    host: keys.dbHost,
    database: "postgres", // default DB
    password: keys.dbPassword,
    port: keys.dbPort,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  const result = await adminPool.query(
    `
    SELECT 1 FROM pg_database WHERE datname = $1
  `,
    [keys.dbDatabase],
  );

  if (result.rowCount === 0) {
    await adminPool.query(`CREATE DATABASE ${keys.dbDatabase};`);
    console.log(`[postgres] created database: ${keys.dbDatabase}`);
  }

  await adminPool.end();
}

await createDatabase();

const pool = new Pool({
  user: keys.dbUser,
  host: keys.dbHost,
  database: keys.dbDatabase,
  password: keys.dbPassword,
  port: keys.dbPort,
  ssl:
    process.env.NODE_ENV === "production"
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

const databasePath = fileURLToPath(new URL("tables/", import.meta.url));

// Create the table(s)
(async () => {
  // Grab the tables sql file
  const codesTableSQL = fs
    .readFileSync(path.join(databasePath, "./codes.sql"))
    .toString();

  try {
    // Drop all our tables
    console.log("\nDropping the tables...");
    await pool.query("DROP TABLE IF EXISTS codes");
    console.log("[postgres] codes table was dropped.");

    // Execute the sql file to create our tables
    console.log("\nCreating the tables...");
    await pool.query(codesTableSQL);
    console.log("[postgres] codes table was created successfully.");

    await insertSeed();
  } catch (err) {
    console.error(err);
  }
})();

// Insert records. Read -r from the terminal and that is the number of records to insert.
async function insertSeed() {
  const batchSize = 10000;

  // We read this from the terminal option -r
  const totalRecords = process.argv.includes("-r")
    ? parseInt(process.argv[process.argv.indexOf("-r") + 1], 10)
    : parseRecordsDefault();

  if (totalRecords === 0) {
    console.log("No records to insert for seeding. Exiting.");
    await pool.end();
    process.exit();
  }

  console.log(`\nSeeding the database with ${totalRecords} records...`);

  for (let offset = 0; offset < totalRecords; offset += batchSize) {
    const values: string[] = [];
    const placeholders: string[] = [];

    for (let i = 0; i < batchSize; i++) {
      const code = generateCode();
      values.push(code);
      placeholders.push(`($${i + 1})`);
    }

    const query = `
      INSERT INTO codes (code)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (code) DO NOTHING
    `;

    await pool.query(query, values);
    console.log(
      `[postgres] inserted records: ${Math.min(
        offset + batchSize,
        totalRecords,
      )}/${totalRecords}`,
    );
  }

  console.log("\nDatabase seeding completed.");
  await pool.end();

  // Only flush Redis when records were actually seeded. This keeps a stale
  // per-RECORD cache from referencing codes that were just wiped.
  await redis.flushdb().catch((err: Error) => {
    console.error("[redis] failed to flush the database:", err.message);
  });
  redis.quit();
}

// PERF_RECORD_LIMIT doubles as the default seed target so that /code-v4 stays valid.
function parseRecordsDefault() {
  const limit = keys.perfRecordLimit;
  return limit > 0 ? limit : 0;
}
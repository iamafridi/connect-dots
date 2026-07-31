/**
 * Background worker that syncs /code-fast writes from Redis back to Postgres
 * at a controlled pace, so the database never sees the write burst directly.
 *
 * Run: npm run perf:sync
 */

import { DB } from "../database/index.js";
import { redis } from "./redis.js";

async function syncWorker() {
  console.log("Worker started...");

  while (true) {
    try {
      // pop an ID from the queue
      const result: [string, string] | null = await redis.brpop(
        "codes:sync_queue",
        0,
      );
      if (!result) continue;
      const id = result[1];

      // Fetch the full data from Redis
      const data = (await redis.hgetall(`code:${id}`)) as Record<
        string,
        string
      >;

      if (!data || !data.code) {
        console.error(`Missing data for ID ${id}`);
        continue;
      }

      // Safe Insert into Postgres
      // We use ON CONFLICT DO NOTHING to be idempotent
      await DB.query(
        `INSERT INTO codes (id, code, created_at) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [data.id, data.code, data.created_at],
      );
    } catch (err) {
      console.error("Sync failed:", err);
      // In a real app, you would push the ID back to someplace to retry later
    }
  }
}

syncWorker();
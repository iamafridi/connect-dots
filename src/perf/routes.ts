import type {
  Cpeak,
  CpeakRequest as Request,
  CpeakResponse as Response,
} from "cpeak";
import crypto from "crypto";
import { DB } from "../database/index.js";
import { redis } from "./redis.js";
import { generateCode, getMaxId } from "./utils.js";
import keys from "../config/keys.js";

// ConnectDots' own load-test suite, written on the same Cpeak runtime the
// product uses. Every route is gated behind PERF_DEMO=true so production stays
// lean. The demo reuses whatever Postgres instance the product runs on — seed
// it first with `npm run perf:seed`.

// Windows does not define process.title with worker CPUs the way Linux does,
// so we keep the title the same for process managers to recognize.
process.title = "node-cpeak";

export default function registerPerfRoutes(app: Cpeak) {
  const PERF_RECORD_LIMIT = keys.perfRecordLimit || 10_000_000;

  app.route("get", `/simple`, (req: Request, res: Response) => {
    res.json({ message: "hi" });
  });

  app.route("patch", `/update-something/:id/:name`, (req: Request, res: Response) => {
    const { id, name } = req.params;
    const { value1, value2 } = req.query;

    // Validate id and name
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "id must be a number" });
    } else if (!name || name.length < 3) {
      return res
        .status(400)
        .json({ error: "name is required and must be at least 3 characters" });
    }

    const formattedFooValues: any[] = [];

    for (let i = 1; i <= 10; i++) {
      const val = req.body[`foo${i}`];
      const formattedVal = typeof val === "string" ? `${val}. ` : val;
      formattedFooValues.push(formattedVal);
    }

    // Adding all the formatted foo values together
    const totalFoo = formattedFooValues.join("");

    // Generating a few kilobytes of dummy data
    const dummyHistory = Array.from({ length: 100 }).map((_, i) => ({
      event_id: Number(id) + i,
      timestamp: new Date().toISOString(),
      action: `Action performed by ${name}`,
      metadata:
        "This is a string intended to take up space to simulate a medium-sized production API response object.".repeat(
          2,
        ),
      status: i % 2 === 0 ? "success" : "pending",
    }));

    res.json({
      id,
      name,
      value1,
      value2,
      total_foo: String(totalFoo).toUpperCase(),
      history: dummyHistory,
    });
  });

  // Inserts a simple record to the database
  app.route("post", "/code", async (req: Request, res: Response) => {
    const code = generateCode();

    // Create a new code record
    try {
      const result = await DB.query(
        `
        INSERT INTO codes (code)
        VALUES ($1)
        RETURNING id, code, created_at
      `,
        [code],
      );

      res.status(201).json({ created_code: result[0] });
    } catch (err: any) {
      if (err.code === "23505") {
        // Unique violation
        return res.status(409).json({ error: "Code already exists." });
      }

      throw err;
    }
  });

  // Reads a simple random code from the database and returns it
  app.route("get", "/code-v1", async (req: Request, res: Response) => {
    // This is Big O(n) - Full Table Scan
    const result = await DB.query(
      `
        SELECT id, code, created_at
        FROM codes
        ORDER BY RANDOM()
        LIMIT 1
      `,
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "No codes found." });
    }

    res.json({ data: result[0] });
  });

  app.route("get", "/code-v2", async (req: Request, res: Response) => {
    const countResult = await DB.query(`SELECT COUNT(*) FROM codes`);
    const count = parseInt(countResult[0].count, 10);

    if (count === 0) return res.status(404).json({ error: "No codes found." });

    // Generate a random ID between 1 and Count
    const randomId = crypto.randomInt(1, count + 1);

    // Fetch the record by ID (Index Lookup)
    const result = await DB.query(
      `
        SELECT id, code, created_at
        FROM codes
        WHERE id = $1
      `,
      [randomId],
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "record not found" });
    }

    res.json({ data: result[0] });
  });

  app.route("get", "/code-v3", async (req: Request, res: Response) => {
    const maxResult = await DB.query(
      `SELECT id FROM codes ORDER BY id DESC LIMIT 1`,
    );

    if (maxResult.length === 0)
      return res.status(404).json({ error: "No codes found." });

    const maxId = maxResult[0].id;

    // Generate random ID up to Max
    const randomId = crypto.randomInt(1, maxId + 1);

    // Fetch (Index Lookup)
    const result = await DB.query(
      `SELECT id, code, created_at FROM codes WHERE id = $1`,
      [randomId],
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "record not found" });
    }

    res.json({ data: result[0] });
  });

  app.route("get", "/code-v4", async (req: Request, res: Response) => {
    const randomId = crypto.randomInt(1, PERF_RECORD_LIMIT + 1); // only valid if you seeded up to PERF_RECORD_LIMIT

    // Fetch the record by ID (Index Lookup). This is Big O(1)
    const result = await DB.query(
      `
        SELECT id, code, created_at
        FROM codes
        WHERE id = $1
      `,
      [randomId],
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "record not found" });
    }

    res.json({ data: result[0] });
  });

  // Inserts a simple record to the database through Redis for super fast O(1) operations
  app.route("post", "/code-fast", async (req: Request, res: Response) => {
    const code = generateCode();

    // Check uniqueness (O(1))
    // SADD returns 1 if added (new), 0 if exists (duplicate)
    const isNew = await redis.sadd("codes:unique", code);

    if (isNew === 0) {
      return res.status(409).json({ error: "Code already exists." });
    }

    // Generate ID (Incrementing Sequence O(1))
    const id = await redis.incr("codes:seq");
    const created_at = new Date().toISOString();

    // Pipeline these for speed (1 network round trip instead of 2)
    const pipeline = redis.pipeline();
    // Store Data (O(1) Hash Set)
    pipeline.hset(`code:${id}`, { id, code, created_at });

    // We will add the ids to a queue so that later a background worker can sync to Postgres
    pipeline.lpush("codes:sync_queue", id);

    await pipeline.exec();

    res.status(201).json({
      created_code: { id, code, created_at },
    });
  });

  app.route("post", "/code-ultra-fast", async (req: Request, res: Response) => {
    /**
     * We won't bother with id uniqueness here because at a rate of 1 million
     * requests per second, it would take approximately 86,000 years to reach a 50%
     * probability of at least one id duplicate.
     */
    const id = crypto.randomUUID(); // generates a 122-bit random UUID

    const code = generateCode();
    const created_at = new Date().toISOString();

    const record = JSON.stringify({ id, code, created_at });

    await redis.set(`code:{${id}}`, record);

    // The sync queue
    const shard = Math.floor(Math.random() * 100) + 1;
    await redis.lpush(`codes:sync_queue:{${shard}}`, id);

    res.status(201).json({ created_code: { id, code, created_at } });
  });

  // Gets a code but through Redis for super fast O(1) lookups
  app.route("get", "/code-fast", async (req: Request, res: Response) => {
    // Get max ID
    const maxId = await getMaxId();
    if (maxId === 0) return res.status(404).json({ error: "No codes found." });

    // Generating a random ID
    const randomId = crypto.randomInt(1, maxId + 1);

    // Fetch the code (O(1) Hash Lookup)
    const result = await redis.hgetall(`code:${randomId}`);

    if (Object.keys(result).length === 0) {
      return res.status(404).json({ error: "record not found" });
    }

    res.json({ data: result });
  });
}
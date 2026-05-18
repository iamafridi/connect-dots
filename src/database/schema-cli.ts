import { pool } from "./index.js";
import { applySchema, createDatabase } from "./schema.js";

await createDatabase();
await applySchema(pool, { verbose: true });
await pool.end();

console.log("[schema] migrations complete");
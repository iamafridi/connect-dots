#!/bin/sh
set -e

# Wait for PostgreSQL to accept connections before applying the schema.
node --input-type=module -e "
import pg from 'pg';
const { Client } = pg;
const host = process.env.DB_HOST || 'db';
const port = Number(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || 'connectdots';
const pass = process.env.DB_PASSWORD || 'connectdots';
const database = process.env.DB_DATABASE || 'connectdots';
const waitSec = Number(process.env.DB_WAIT_SECONDS || 60);
const start = Date.now();
(async () => {
  while (true) {
    const client = new Client({ host, port, user, password: pass, database });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('[entrypoint] database is ready');
      process.exit(0);
    } catch (err) {
      await client.end().catch(() => {});
    }
    if (Date.now() - start > waitSec * 1000) {
      console.error('[entrypoint] database not reachable in time');
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
})();
"

# Apply (idempotent) migrations, then run the container command.
echo "[entrypoint] applying schema"
node dist/database/schema-cli.js

exec "$@"
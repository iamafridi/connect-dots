import app from "./app.js";
import log from "./lib/log.js";
import keys from "./config/keys.js";
import { pool } from "./database/index.js";
import { redis, subscriber } from "./redis/redis.js";
import { initCacheInvalidationListener } from "./redis/cache.js";

const port = Number(process.env.PORT || 2080);

if (keys.redisEnabled) {
  initCacheInvalidationListener();
}

const server = app.listen(port, () => {
  log(
    "Starting the server..." +
      "\n----------------------------------\n" +
      "Server has started on port " +
      port +
      "\n----------------------------------",
  );
  console.log("Server is on port " + port);
});

// Graceful shutdown: stop accepting connections, let in-flight requests
// finish, then close Postgres and Redis so no query dies mid-flight.
async function shutdown(signal: string) {
  console.log(`[shutdown] ${signal} received — draining...`);

  server.close(async () => {
    try {
      await pool.end();
      if (keys.redisEnabled) {
        redis.disconnect();
        subscriber?.disconnect();
      }
      console.log("[shutdown] pool and redis closed. Goodbye.");
      process.exit(0);
    } catch (err) {
      console.error("[shutdown] error while closing connections:", err);
      process.exit(1);
    }
  });

  // Hard exit if connections refuse to drain (e.g. a keep-alive socket).
  setTimeout(() => {
    console.error("[shutdown] timed out after 10s — forcing exit.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

if (keys.perfDemo) {
  console.log(
    "[perf] PERF_DEMO is on — benchmark routes are exposed (see /simple, /code, /code-fast).",
  );
}

export { server };
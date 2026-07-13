import { Redis, Cluster } from "ioredis";
import type { Redis as RedisClient, Cluster as RedisCluster } from "ioredis";
import keys from "../config/keys.js";

export type RedisInstance = RedisClient | RedisCluster;

function parseClusterNodes(nodesStr: string) {
  return nodesStr.split(",").map((nodeStr) => {
    const [host, port] = nodeStr.trim().split(":");
    return { host: host || "127.0.0.1", port: Number(port) || 6379 };
  });
}

export function createRedisInstance(): RedisInstance {
  if (keys.redisCluster) {
    const nodes = parseClusterNodes(
      keys.redisClusterNodes || "127.0.0.1:7000",
    );
    return new Cluster(nodes, {
      lazyConnect: true,
      enableReadyCheck: true,
      redisOptions: {
        password: keys.redisPassword || undefined,
      },
      scaleReads: "slave",
    });
  }

  return new Redis(keys.redisUrl, {
    lazyConnect: true,
    password: keys.redisPassword || undefined,
  });
}

export const redis = createRedisInstance();

// Dedicated subscriber connection for Redis Pub/Sub (cache invalidation across cluster workers)
export const subscriber = keys.redisEnabled ? createRedisInstance() : null;

if (keys.redisEnabled) {
  // Redis is optional in development: a failed initial connection must not take
  // the whole process down, it just means the views stream / cache / perf routes are off.
  redis
    .connect()
    .then(() =>
      console.log(
        `[redis] connected successfully (${keys.redisCluster ? "AWS/Redis Cluster" : "Standalone"})`,
      ),
    )
    .catch((err: Error) =>
      console.error("[redis] initial connection failed:", err.message),
    );

  if (subscriber) {
    subscriber
      .connect()
      .then(() => console.log("[redis-subscriber] connected successfully"))
      .catch((err: Error) =>
        console.error(
          "[redis-subscriber] initial connection failed:",
          err.message,
        ),
      );
  }
}

redis.on("error", (err: Error) =>
  console.error("[redis] connection error:", err.message),
);

if (subscriber) {
  subscriber.on("error", (err: Error) =>
    console.error("[redis-subscriber] connection error:", err.message),
  );
}
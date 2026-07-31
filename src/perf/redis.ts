// The performance demo reuses the application's Redis client so that the
// request-serving processes keep a single connection while PERF_DEMO is on.
//
// For the standalone perf scripts (perf:seed / perf:migrate / perf:sync) you can
// point them at a Redis Cluster by setting REDIS_CLUSTER=true — see
// scripts/redis-cluster.ps1 for spinning up a local 30-node cluster.

import { redis } from "../redis/redis.js";

export { redis };
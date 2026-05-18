const getEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    console.error(`Missing environment variable: ${key}`);
  }
  return value || "";
};

const getOptionalEnv = (key: string, defaultValue = ""): string => {
  return process.env[key] ?? defaultValue;
};

export default {
  domain: getEnv("DOMAIN"),
  googleClientID: getEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  cookieKey: getEnv("COOKIE_KEY"),
  tokenSecret: getEnv("TOKEN_SECRET"),
  webRiskApiKey: getEnv("WEB_RISK_API_KEY"),
  sesRegion: getEnv("AWS_REGION"),
  sesFromEmail: getEnv("SES_FROM_EMAIL"),
  // Postgres
  dbUser: getEnv("DB_USER"),
  dbHost: getEnv("DB_HOST"),
  dbDatabase: getEnv("DB_DATABASE"),
  dbPassword: getEnv("DB_PASSWORD"),
  dbPort: Number(getEnv("DB_PORT")),
  // Redis (supports single-node and multi-node AWS ElastiCache / Redis Cluster)
  redisUrl: getOptionalEnv("REDIS_URL", "redis://127.0.0.1:6379"),
  redisEnabled: getEnv("REDIS") === "true",
  redisPassword: getOptionalEnv("REDIS_PASSWORD"),
  redisCluster: getOptionalEnv("REDIS_CLUSTER") === "true",
  redisClusterNodes: getOptionalEnv("REDIS_CLUSTER_NODES"), // e.g. "127.0.0.1:7000,127.0.0.1:7001" or AWS ElastiCache cluster configuration endpoint
  // Trust proxy headers (e.g. when running behind a load balancer or Cloudflare).
  // x-forwarded-for is spoofable by clients, so it is ignored unless explicitly trusted.
  trustProxy: getEnv("TRUST_PROXY") === "true",
  // Performance demo suite (from the 1M RPS benchmark)
  perfDemo: getEnv("PERF_DEMO") === "true",
  perfRecordLimit: Number(getEnv("PERF_RECORD_LIMIT")) || 10_000_000,
};
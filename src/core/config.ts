import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  REQUEST_TIMEOUT_MS: z.coerce.number().positive().default(30_000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60_000),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:", result.error.format());
  process.exit(1);
}

export const config = result.data;

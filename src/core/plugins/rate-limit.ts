import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { config } from "../config.js";

const EXEMPT_ROUTES = new Set(["/health", "/ready", "/metrics"]);

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (request: FastifyRequest) => request.ip,
    allowList: (request: FastifyRequest) => EXEMPT_ROUTES.has(request.url),
  });
}

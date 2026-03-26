import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { collectDefaultMetrics, Histogram, Registry } from "prom-client";

export function registerMetrics(app: FastifyInstance): void {
  const register = new Registry();

  collectDefaultMetrics({ register });

  const httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });

  app.addHook(
    "onResponse",
    (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
      const route = request.routeOptions?.url ?? request.url;
      if (route !== "/metrics") {
        httpRequestDuration.observe(
          {
            method: request.method,
            route,
            status_code: String(reply.statusCode),
          },
          reply.elapsedTime / 1000,
        );
      }
      done();
    },
  );

  app.get("/metrics", async (_request, reply) => {
    const metrics = await register.metrics();
    void reply.header("content-type", register.contentType).send(metrics);
  });
}

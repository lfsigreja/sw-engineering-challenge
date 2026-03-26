import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { DomainError } from "../../shared/utils/domain-error-handler.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      return reply.status(error.httpStatus).send({ error: error.domainCode, message: error.message });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({ error: "VALIDATION_ERROR", issues: error.issues });
    }

    const pluginError = error as { statusCode?: number; message?: string };
    if (pluginError.statusCode === 429) {
      return reply.status(429).send({
        error: "RATE_LIMIT_EXCEEDED",
        message: pluginError.message ?? "Too many requests.",
      });
    }
    if (pluginError.statusCode !== undefined && pluginError.statusCode >= 400 && pluginError.statusCode < 500) {
      return reply.status(pluginError.statusCode).send({ error: pluginError.message });
    }

    const stack = error instanceof Error ? error.stack : undefined;
    request.log.error({ err: error, stack }, "Unhandled error");

    return reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    });
  });
}

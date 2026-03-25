import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { DomainError } from "../../shared/utils/domain-error-handler.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) {
      return reply.status(error.httpStatus).send({ error: error.domainCode, message: error.message });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({ error: "VALIDATION_ERROR", issues: error.issues });
    }

    return reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    });
  });
}

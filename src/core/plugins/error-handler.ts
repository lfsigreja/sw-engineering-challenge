import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { DomainError } from "../../shared/utils/domain-error-handler.js";

const ERROR_CODE_TO_STATUS: Record<string, number> = {
  BLOQ_NOT_FOUND: 404,
  RENT_NOT_FOUND: 404,
  LOCKER_NOT_FOUND: 404,
  INVALID_RENT_STATUS: 409,
  LOCKER_OCCUPIED: 409,
  LOCKER_NOT_OPEN: 409,
  LOCKER_NOT_OCCUPIED: 409,
  RENT_NO_LOCKER: 409,
  INVALID_WEIGHT: 400,
};

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) {
      const status = ERROR_CODE_TO_STATUS[error.domainCode] ?? 400;
      return reply.status(status).send({ error: error.domainCode, message: error.message });
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

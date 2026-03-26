import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";

const CORRELATION_ID_HEADER = "x-correlation-id";

export function registerCorrelationId(app: FastifyInstance): void {
  app.addHook("onRequest", (request, reply, done) => {
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string | undefined) ?? uuidv4();

    request.log = request.log.child({ correlationId });

    void reply.header(CORRELATION_ID_HEADER, correlationId);
    done();
  });
}

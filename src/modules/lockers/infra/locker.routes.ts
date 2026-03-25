import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { IBloqRepository } from "../../bloqs/domain/bloq.repository.js";
import { CreateLockerUseCase } from "../application/create-locker.use-case.js";
import { DeleteLockerUseCase } from "../application/delete-locker.use-case.js";
import { FindLockerUseCase } from "../application/find-locker.use-case.js";
import { ListLockersUseCase } from "../application/list-lockers.use-case.js";
import { UpdateLockerUseCase } from "../application/update-locker.use-case.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

const createBodySchema = z.object({
  bloqId: z.uuid(),
  status: z.enum(["OPEN", "CLOSED"]),
  isOccupied: z.boolean(),
});

const updateBodySchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  isOccupied: z.boolean().optional(),
});

export function registerLockerRoutes(
  app: FastifyInstance,
  lockerRepo: ILockerRepository,
  bloqRepo: IBloqRepository,
): void {
  const list = new ListLockersUseCase(lockerRepo);
  const find = new FindLockerUseCase(lockerRepo);
  const create = new CreateLockerUseCase(lockerRepo, bloqRepo);
  const update = new UpdateLockerUseCase(lockerRepo);
  const remove = new DeleteLockerUseCase(lockerRepo);

  app.get("/lockers", async (_req, reply) => {
    const lockers = await list.execute();
    return reply.status(200).send(lockers);
  });

  app.get<{ Params: { id: string } }>("/lockers/:id", async (req, reply) => {
    const locker = await find.execute(req.params.id);
    return reply.status(200).send(locker);
  });

  app.post("/lockers", async (req, reply) => {
    const body = createBodySchema.parse(req.body);
    const locker = await create.execute(body);
    return reply.status(201).send(locker);
  });

  app.patch<{ Params: { id: string } }>("/lockers/:id", async (req, reply) => {
    const body = updateBodySchema.parse(req.body);
    const locker = await update.execute(req.params.id, body);
    return reply.status(200).send(locker);
  });

  app.delete<{ Params: { id: string } }>("/lockers/:id", async (req, reply) => {
    await remove.execute(req.params.id);
    return reply.status(204).send();
  });
}

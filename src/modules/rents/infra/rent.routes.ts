import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ILockerRepository } from "../../lockers/domain/locker.repository.js";
import { CreateRentUseCase } from "../application/create-rent.use-case.js";
import { DeleteRentUseCase } from "../application/delete-rent.use-case.js";
import { FindRentUseCase } from "../application/find-rent.use-case.js";
import { ListRentsUseCase } from "../application/list-rents.use-case.js";
import { TransitionRentUseCase } from "../application/transition-rent.use-case.js";
import type { IRentRepository } from "../domain/rent.repository.js";

const createBodySchema = z.object({
  weight: z.number().positive(),
  size: z.enum(["XS", "S", "M", "L", "XL"]),
});

const transitionBodySchema = z.object({
  status: z.enum(["WAITING_DROPOFF", "WAITING_PICKUP", "DELIVERED"]),
  lockerId: z.uuid().optional(),
});

export function registerRentRoutes(
  app: FastifyInstance,
  rentRepo: IRentRepository,
  lockerRepo: ILockerRepository,
): void {
  const list = new ListRentsUseCase(rentRepo);
  const find = new FindRentUseCase(rentRepo);
  const create = new CreateRentUseCase(rentRepo);
  const transition = new TransitionRentUseCase(rentRepo, lockerRepo);
  const remove = new DeleteRentUseCase(rentRepo);

  app.get("/rents", async (_req, reply) => {
    const rents = await list.execute();
    return reply.status(200).send(rents);
  });

  app.get<{ Params: { id: string } }>("/rents/:id", async (req, reply) => {
    const rent = await find.execute(req.params.id);
    return reply.status(200).send(rent);
  });

  app.post("/rents", async (req, reply) => {
    const body = createBodySchema.parse(req.body);
    const rent = await create.execute(body);
    return reply.status(201).send(rent);
  });

  app.patch<{ Params: { id: string } }>("/rents/:id", async (req, reply) => {
    const body = transitionBodySchema.parse(req.body);
    const rent = await transition.execute(req.params.id, body);
    return reply.status(200).send(rent);
  });

  app.delete<{ Params: { id: string } }>("/rents/:id", async (req, reply) => {
    await remove.execute(req.params.id);
    return reply.status(204).send();
  });
}

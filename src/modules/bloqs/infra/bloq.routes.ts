import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateBloqUseCase } from "../application/create-bloq.use-case.js";
import { DeleteBloqUseCase } from "../application/delete-bloq.use-case.js";
import { FindBloqUseCase } from "../application/find-bloq.use-case.js";
import { ListBloqsUseCase } from "../application/list-bloqs.use-case.js";
import { UpdateBloqUseCase } from "../application/update-bloq.use-case.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

const createBodySchema = z.object({
  title: z.string().min(1),
  address: z.string().min(1),
});

const updateBodySchema = z.object({
  title: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});

export function registerBloqRoutes(app: FastifyInstance, repo: IBloqRepository): void {
  const list = new ListBloqsUseCase(repo);
  const find = new FindBloqUseCase(repo);
  const create = new CreateBloqUseCase(repo);
  const update = new UpdateBloqUseCase(repo);
  const remove = new DeleteBloqUseCase(repo);

  app.get("/bloqs", async (_req, reply) => {
    const bloqs = await list.execute();
    return reply.status(200).send(bloqs);
  });

  app.get<{ Params: { id: string } }>("/bloqs/:id", async (req, reply) => {
    const bloq = await find.execute(req.params.id);
    return reply.status(200).send(bloq);
  });

  app.post("/bloqs", async (req, reply) => {
    const body = createBodySchema.parse(req.body);
    const bloq = await create.execute(body);
    return reply.status(201).send(bloq);
  });

  app.patch<{ Params: { id: string } }>("/bloqs/:id", async (req, reply) => {
    const body = updateBodySchema.parse(req.body);
    const bloq = await update.execute(req.params.id, body);
    return reply.status(200).send(bloq);
  });

  app.delete<{ Params: { id: string } }>("/bloqs/:id", async (req, reply) => {
    await remove.execute(req.params.id);
    return reply.status(204).send();
  });
}

import { randomUUID } from "node:crypto";
import type { Bloq } from "../domain/bloq.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

export interface CreateBloqInput {
  title: string;
  address: string;
}

export class CreateBloqUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  execute(input: CreateBloqInput): Promise<Bloq> {
    const bloq: Bloq = { id: randomUUID(), ...input };
    return this.repo.create(bloq);
  }
}

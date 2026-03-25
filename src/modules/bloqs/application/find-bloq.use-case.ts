import type { Bloq } from "../domain/bloq.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";
import { BloqNotFoundError } from "../domain/bloq.errors.js";

export class FindBloqUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  async execute(id: string): Promise<Bloq> {
    const bloq = await this.repo.findById(id);
    if (!bloq) throw new BloqNotFoundError(id);
    return bloq;
  }
}

import type { IBloqRepository } from "../domain/bloq.repository.js";
import { BloqNotFoundError } from "../domain/bloq.errors.js";

export class DeleteBloqUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new BloqNotFoundError(id);
    return this.repo.delete(id);
  }
}

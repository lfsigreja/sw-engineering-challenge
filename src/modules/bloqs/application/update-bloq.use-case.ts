import type { Bloq } from "../domain/bloq.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";
import { BloqNotFoundError } from "../domain/bloq.errors.js";

export interface UpdateBloqInput {
  title?: string;
  address?: string;
}

export class UpdateBloqUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  async execute(id: string, input: UpdateBloqInput): Promise<Bloq> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new BloqNotFoundError(id);
    return this.repo.update(id, input);
  }
}

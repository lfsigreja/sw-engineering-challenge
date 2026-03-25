import { findEntity } from "../../../shared/application/find-entity.js";
import type { Bloq } from "../domain/bloq.js";
import { BloqNotFoundError } from "../domain/bloq.errors.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

export interface UpdateBloqInput {
  title?: string;
  address?: string;
}

export class UpdateBloqUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  async execute(id: string, input: UpdateBloqInput): Promise<Bloq> {
    await findEntity(this.repo.findById.bind(this.repo), id, BloqNotFoundError);
    return this.repo.update(id, input);
  }
}

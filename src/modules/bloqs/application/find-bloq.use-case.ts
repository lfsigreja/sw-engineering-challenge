import { findEntity } from "../../../shared/application/find-entity.js";
import type { Bloq } from "../domain/bloq.js";
import { BloqNotFoundError } from "../domain/bloq.errors.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

export class FindBloqUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  execute(id: string): Promise<Bloq> {
    return findEntity(this.repo.findById.bind(this.repo), id, BloqNotFoundError);
  }
}

import type { Bloq } from "../domain/bloq.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

export class ListBloqsUseCase {
  constructor(private readonly repo: IBloqRepository) {}

  execute(): Promise<Bloq[]> {
    return this.repo.findAll();
  }
}

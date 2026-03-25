import type { Rent } from "../domain/rent.js";
import type { IRentRepository } from "../domain/rent.repository.js";

export class ListRentsUseCase {
  constructor(private readonly repo: IRentRepository) {}

  execute(): Promise<Rent[]> {
    return this.repo.findAll();
  }
}

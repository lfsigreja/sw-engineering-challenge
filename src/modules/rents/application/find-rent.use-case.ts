import { findEntity } from "../../../shared/application/find-entity.js";
import type { Rent } from "../domain/rent.js";
import { RentNotFoundError } from "../domain/rent.errors.js";
import type { IRentRepository } from "../domain/rent.repository.js";

export class FindRentUseCase {
  constructor(private readonly repo: IRentRepository) {}

  execute(id: string): Promise<Rent> {
    return findEntity(this.repo.findById.bind(this.repo), id, RentNotFoundError);
  }
}

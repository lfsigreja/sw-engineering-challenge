import { findEntity } from "../../../shared/application/find-entity.js";
import { RentCannotBeDeletedError, RentNotFoundError } from "../domain/rent.errors.js";
import type { IRentRepository } from "../domain/rent.repository.js";

export class DeleteRentUseCase {
  constructor(private readonly repo: IRentRepository) {}

  async execute(id: string): Promise<void> {
    const rent = await findEntity(this.repo.findById.bind(this.repo), id, RentNotFoundError);
    if (rent.status !== "CREATED" || rent.lockerId !== null) throw new RentCannotBeDeletedError(id);
    return this.repo.delete(id);
  }
}

import { findEntity } from "../../../shared/application/find-entity.js";
import { LockerNotFoundError } from "../domain/locker.errors.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

export class DeleteLockerUseCase {
  constructor(private readonly repo: ILockerRepository) {}

  async execute(id: string): Promise<void> {
    await findEntity(this.repo.findById.bind(this.repo), id, LockerNotFoundError);
    return this.repo.delete(id);
  }
}

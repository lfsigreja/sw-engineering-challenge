import { findEntity } from "../../../shared/application/find-entity.js";
import type { Locker } from "../domain/locker.js";
import { LockerNotFoundError } from "../domain/locker.errors.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

export class FindLockerUseCase {
  constructor(private readonly repo: ILockerRepository) {}

  execute(id: string): Promise<Locker> {
    return findEntity(this.repo.findById.bind(this.repo), id, LockerNotFoundError);
  }
}

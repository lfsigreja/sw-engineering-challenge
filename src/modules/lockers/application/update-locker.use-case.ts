import { findEntity } from "../../../shared/application/find-entity.js";
import type { Locker, LockerStatus } from "../domain/locker.js";
import { LockerNotFoundError } from "../domain/locker.errors.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

export interface UpdateLockerInput {
  status?: LockerStatus;
  isOccupied?: boolean;
}

export class UpdateLockerUseCase {
  constructor(private readonly repo: ILockerRepository) {}

  async execute(id: string, input: UpdateLockerInput): Promise<Locker> {
    await findEntity(this.repo.findById.bind(this.repo), id, LockerNotFoundError);
    return this.repo.update(id, input);
  }
}

import { findEntity } from "../../../shared/application/find-entity.js";
import type { IRentRepository } from "../../rents/domain/rent.repository.js";
import { LockerHasActiveRentError, LockerNotFoundError, LockerOccupiedError } from "../domain/locker.errors.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

export class DeleteLockerUseCase {
  constructor(
    private readonly lockerRepo: ILockerRepository,
    private readonly rentRepo: IRentRepository,
  ) { }

  async execute(id: string): Promise<void> {
    const locker = await findEntity(this.lockerRepo.findById.bind(this.lockerRepo), id, LockerNotFoundError);
    const activeRent = await this.rentRepo.findActiveByLockerId(id);
    if (activeRent) throw new LockerHasActiveRentError(id);
    if (locker.isOccupied) throw new LockerOccupiedError(id);
    return this.lockerRepo.delete(id);
  }
}

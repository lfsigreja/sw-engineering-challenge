import { findEntity } from "../../../shared/application/find-entity.js";
import type { ILockerRepository } from "../../lockers/domain/locker.repository.js";
import { BloqHasLockersError, BloqNotFoundError } from "../domain/bloq.errors.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

export class DeleteBloqUseCase {
  constructor(
    private readonly bloqRepo: IBloqRepository,
    private readonly lockerRepo: ILockerRepository,
  ) { }

  async execute(id: string): Promise<void> {
    await findEntity(this.bloqRepo.findById.bind(this.bloqRepo), id, BloqNotFoundError);
    const lockers = await this.lockerRepo.findByBloqId(id);
    if (lockers.length > 0) throw new BloqHasLockersError(id);
    return this.bloqRepo.delete(id);
  }
}

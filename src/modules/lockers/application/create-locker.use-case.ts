import { randomUUID } from "node:crypto";
import { findEntity } from "../../../shared/application/find-entity.js";
import { BloqNotFoundError } from "../../bloqs/domain/bloq.errors.js";
import type { IBloqRepository } from "../../bloqs/domain/bloq.repository.js";
import type { Locker, LockerStatus } from "../domain/locker.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

export interface CreateLockerInput {
  bloqId: string;
  status: LockerStatus;
  isOccupied: boolean;
}

export class CreateLockerUseCase {
  constructor(
    private readonly lockerRepo: ILockerRepository,
    private readonly bloqRepo: IBloqRepository,
  ) {}

  async execute(input: CreateLockerInput): Promise<Locker> {
    await findEntity(this.bloqRepo.findById.bind(this.bloqRepo), input.bloqId, BloqNotFoundError);
    const locker: Locker = { id: randomUUID(), ...input };
    return this.lockerRepo.create(locker);
  }
}

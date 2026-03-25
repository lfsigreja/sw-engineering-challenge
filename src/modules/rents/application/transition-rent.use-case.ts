import { findEntity } from "../../../shared/application/find-entity.js";
import type { ILockerRepository } from "../../lockers/domain/locker.repository.js";
import type { Rent, RentStatus } from "../domain/rent.js";
import { VALID_TRANSITIONS } from "../domain/rent.js";
import {
  InvalidRentStatusError,
  LockerNotOccupiedError,
  LockerNotOpenError,
  LockerOccupiedError,
  RentNoLockerError,
  RentNotFoundError,
} from "../domain/rent.errors.js";
import type { IRentRepository } from "../domain/rent.repository.js";
import { LockerNotFoundError } from "../../lockers/domain/locker.errors.js";

export interface TransitionRentInput {
  status: Exclude<RentStatus, "CREATED">;
  lockerId?: string;
}

export class TransitionRentUseCase {
  constructor(
    private readonly rentRepo: IRentRepository,
    private readonly lockerRepo: ILockerRepository,
  ) {}

  async execute(id: string, input: TransitionRentInput): Promise<Rent> {
    const rent = await findEntity(this.rentRepo.findById.bind(this.rentRepo), id, RentNotFoundError);

    const expectedNext = VALID_TRANSITIONS[rent.status];
    if (input.status !== expectedNext) {
      throw new InvalidRentStatusError(rent.status, input.status);
    }

    if (input.status === "WAITING_DROPOFF") {
      if (!input.lockerId) throw new RentNoLockerError(id);

      const locker = await findEntity(
        this.lockerRepo.findById.bind(this.lockerRepo),
        input.lockerId,
        LockerNotFoundError,
      );

      if (locker.status !== "OPEN") throw new LockerNotOpenError(input.lockerId);
      if (locker.isOccupied) throw new LockerOccupiedError(input.lockerId);

      await this.lockerRepo.update(input.lockerId, { status: "CLOSED", isOccupied: true });
    }

    if (input.status === "WAITING_PICKUP") {
      if (!rent.lockerId) throw new RentNoLockerError(id);
    }

    if (input.status === "DELIVERED") {
      if (!rent.lockerId) throw new RentNoLockerError(id);
      const locker = await findEntity(
        this.lockerRepo.findById.bind(this.lockerRepo),
        rent.lockerId,
        LockerNotFoundError,
      );
      if (!locker.isOccupied) throw new LockerNotOccupiedError(rent.lockerId);
      await this.lockerRepo.update(rent.lockerId, { status: "OPEN", isOccupied: false });
    }

    return this.rentRepo.update(id, {
      status: input.status,
      ...(input.status === "WAITING_DROPOFF" && input.lockerId ? { lockerId: input.lockerId } : {}),
    });
  }
}

import { DomainError } from "../../../shared/utils/domain-error-handler.js";

export class RentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Rent with id "${id}" not found`, "RENT_NOT_FOUND");
  }
}

export class InvalidRentStatusError extends DomainError {
  constructor(current: string, requested: string) {
    super(`Cannot transition rent from "${current}" to "${requested}"`, "INVALID_RENT_STATUS");
  }
}

export class RentCannotBeDeletedError extends DomainError {
  constructor(id: string) {
    super(
      `Rent "${id}" cannot be deleted: it must be in CREATED status with no locker assigned`,
      "RENT_CANNOT_BE_DELETED",
    );
  }
}

export class RentNoLockerError extends DomainError {
  constructor(id: string) {
    super(`Rent "${id}" has no locker assigned`, "RENT_NO_LOCKER");
  }
}

export class LockerOccupiedError extends DomainError {
  constructor(lockerId: string) {
    super(`Locker "${lockerId}" is already occupied`, "LOCKER_OCCUPIED");
  }
}

export class LockerNotOpenError extends DomainError {
  constructor(lockerId: string) {
    super(`Locker "${lockerId}" is not open`, "LOCKER_NOT_OPEN");
  }
}

export class LockerNotOccupiedError extends DomainError {
  constructor(lockerId: string) {
    super(`Locker "${lockerId}" is not occupied`, "LOCKER_NOT_OCCUPIED");
  }
}

export class InvalidWeightError extends DomainError {
  constructor() {
    super("Weight must be greater than 0", "INVALID_WEIGHT");
  }
}

import { DomainError } from "../../../shared/utils/domain-error-handler.js";

export class LockerNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Locker with id "${id}" not found`, "LOCKER_NOT_FOUND");
  }
}

export class LockerHasActiveRentError extends DomainError {
  constructor(id: string) {
    super(`Locker "${id}" has an active rent and cannot be deleted`, "LOCKER_HAS_ACTIVE_RENT");
  }
}

export class LockerOccupiedError extends DomainError {
  constructor(id: string) {
    super(`Locker "${id}" is occupied and cannot be deleted`, "LOCKER_OCCUPIED");
  }
}
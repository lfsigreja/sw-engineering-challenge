import { DomainError } from "../../../shared/utils/domain-error-handler.js";

export class LockerNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Locker with id "${id}" not found`, "LOCKER_NOT_FOUND");
  }
}

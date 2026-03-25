import { DomainError } from "../../../shared/utils/domain-error-handler.js";

export class BloqNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Bloq with id "${id}" not found`, "BLOQ_NOT_FOUND");
  }
}

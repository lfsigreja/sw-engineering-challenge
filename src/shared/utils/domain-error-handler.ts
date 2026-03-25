export class DomainError extends Error {
    constructor(
      message: string,
      public readonly domainCode: string,
    ) {
      super(message);
      this.name = "DomainError";
    }
  }
  
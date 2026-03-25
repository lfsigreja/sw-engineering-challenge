export class DomainError extends Error {
    constructor(
      message: string,
      public readonly domainCode: string,
      public readonly httpStatus: number,
    ) {
      super(message);
      this.name = "DomainError";
    }
  }
  
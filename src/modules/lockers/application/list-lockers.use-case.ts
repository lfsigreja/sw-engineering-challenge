import type { Locker } from "../domain/locker.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

export class ListLockersUseCase {
  constructor(private readonly repo: ILockerRepository) {}

  execute(): Promise<Locker[]> {
    return this.repo.findAll();
  }
}

import type { JsonStore } from "../../../shared/infrastructure/json-store.js";
import type { Locker } from "../domain/locker.js";
import type { ILockerRepository } from "../domain/locker.repository.js";

const FILE = "lockers.json";

export class LockerJsonRepository implements ILockerRepository {
  constructor(private readonly store: JsonStore) {}

  findAll(): Promise<Locker[]> {
    return this.store.readCollection<Locker>(FILE);
  }

  async findById(id: string): Promise<Locker | undefined> {
    const lockers = await this.store.readCollection<Locker>(FILE);
    return lockers.find((l) => l.id === id);
  }

  async findByBloqId(bloqId: string): Promise<Locker[]> {
    const lockers = await this.store.readCollection<Locker>(FILE);
    return lockers.filter((l) => l.bloqId === bloqId);
  }

  async create(locker: Locker): Promise<Locker> {
    const lockers = await this.store.readCollection<Locker>(FILE);
    lockers.push(locker);
    await this.store.writeCollection(FILE, lockers);
    return locker;
  }

  async update(id: string, data: Partial<Pick<Locker, "status" | "isOccupied">>): Promise<Locker> {
    const lockers = await this.store.readCollection<Locker>(FILE);
    const index = lockers.findIndex((l) => l.id === id);
    const updated: Locker = { ...lockers[index], ...data };
    lockers[index] = updated;
    await this.store.writeCollection(FILE, lockers);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const lockers = await this.store.readCollection<Locker>(FILE);
    await this.store.writeCollection(FILE, lockers.filter((l) => l.id !== id));
  }
}

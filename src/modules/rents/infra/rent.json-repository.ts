import type { JsonStore } from "../../../shared/infrastructure/json-store.js";
import { ACTIVE_STATUSES, type Rent } from "../domain/rent.js";
import type { IRentRepository } from "../domain/rent.repository.js";

const FILE = "rents.json";

export class RentJsonRepository implements IRentRepository {
  constructor(private readonly store: JsonStore) {}

  findAll(): Promise<Rent[]> {
    return this.store.readCollection<Rent>(FILE);
  }

  async findById(id: string): Promise<Rent | undefined> {
    const rents = await this.store.readCollection<Rent>(FILE);
    return rents.find((r) => r.id === id);
  }

  async findActiveByLockerId(lockerId: string): Promise<Rent | undefined> {
    const rents = await this.store.readCollection<Rent>(FILE);
    return rents.find((r) => r.lockerId === lockerId && ACTIVE_STATUSES.includes(r.status));
  }

  async create(rent: Rent): Promise<Rent> {
    const rents = await this.store.readCollection<Rent>(FILE);
    rents.push(rent);
    await this.store.writeCollection(FILE, rents);
    return rent;
  }

  async update(id: string, data: Partial<Pick<Rent, "lockerId" | "status">>): Promise<Rent> {
    const rents = await this.store.readCollection<Rent>(FILE);
    const index = rents.findIndex((r) => r.id === id);
    const updated: Rent = { ...rents[index], ...data };
    rents[index] = updated;
    await this.store.writeCollection(FILE, rents);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const rents = await this.store.readCollection<Rent>(FILE);
    await this.store.writeCollection(FILE, rents.filter((r) => r.id !== id));
  }
}

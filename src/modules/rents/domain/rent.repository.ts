import type { Rent } from "./rent.js";

export interface IRentRepository {
  findAll(): Promise<Rent[]>;
  findById(id: string): Promise<Rent | undefined>;
  findActiveByLockerId(lockerId: string): Promise<Rent | undefined>;
  create(rent: Rent): Promise<Rent>;
  update(id: string, data: Partial<Pick<Rent, "lockerId" | "status">>): Promise<Rent>;
  delete(id: string): Promise<void>;
}

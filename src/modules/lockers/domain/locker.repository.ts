import type { Locker } from "./locker.js";

export interface ILockerRepository {
  findAll(): Promise<Locker[]>;
  findById(id: string): Promise<Locker | undefined>;
  findByBloqId(bloqId: string): Promise<Locker[]>;
  create(locker: Locker): Promise<Locker>;
  update(id: string, data: Partial<Pick<Locker, "status" | "isOccupied">>): Promise<Locker>;
  delete(id: string): Promise<void>;
}

import type { Bloq } from "./bloq.js";

export interface IBloqRepository {
  findAll(): Promise<Bloq[]>;
  findById(id: string): Promise<Bloq | undefined>;
  create(bloq: Bloq): Promise<Bloq>;
  update(id: string, data: Partial<Pick<Bloq, "title" | "address">>): Promise<Bloq>;
  delete(id: string): Promise<void>;
}

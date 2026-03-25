import type { JsonStore } from "../../../shared/infrastructure/json-store.js";
import type { Bloq } from "../domain/bloq.js";
import type { IBloqRepository } from "../domain/bloq.repository.js";

const FILE = "bloqs.json";

export class BloqJsonRepository implements IBloqRepository {
  constructor(private readonly store: JsonStore) {}

  findAll(): Promise<Bloq[]> {
    return this.store.readCollection<Bloq>(FILE);
  }

  async findById(id: string): Promise<Bloq | undefined> {
    const bloqs = await this.store.readCollection<Bloq>(FILE);
    return bloqs.find((b) => b.id === id);
  }

  async create(bloq: Bloq): Promise<Bloq> {
    const bloqs = await this.store.readCollection<Bloq>(FILE);
    bloqs.push(bloq);
    await this.store.writeCollection(FILE, bloqs);
    return bloq;
  }

  async update(id: string, data: Partial<Pick<Bloq, "title" | "address">>): Promise<Bloq> {
    const bloqs = await this.store.readCollection<Bloq>(FILE);
    const index = bloqs.findIndex((b) => b.id === id);
    const updated: Bloq = { ...bloqs[index], ...data };
    bloqs[index] = updated;
    await this.store.writeCollection(FILE, bloqs);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const bloqs = await this.store.readCollection<Bloq>(FILE);
    await this.store.writeCollection(FILE, bloqs.filter((b) => b.id !== id));
  }
}

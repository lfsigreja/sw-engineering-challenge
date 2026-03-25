import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class JsonStore {
  constructor(private readonly baseDir: string) {}

  private resolve(fileName: string): string {
    return path.join(this.baseDir, fileName);
  }

  async readCollection<T>(fileName: string): Promise<T[]> {
    const filePath = this.resolve(fileName);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T[];
  }

  async writeCollection<T>(fileName: string, collection: T[]): Promise<void> {
    const filePath = this.resolve(fileName);
    const payload = `${JSON.stringify(collection, null, 2)}\n`;
    await writeFile(filePath, payload, "utf8");
  }
}
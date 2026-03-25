import { randomUUID } from "node:crypto";
import type { Rent, RentSize } from "../domain/rent.js";
import { InvalidWeightError } from "../domain/rent.errors.js";
import type { IRentRepository } from "../domain/rent.repository.js";

export interface CreateRentInput {
  weight: number;
  size: RentSize;
}

export class CreateRentUseCase {
  constructor(private readonly repo: IRentRepository) {}

  async execute(input: CreateRentInput): Promise<Rent> {
    if (input.weight <= 0) throw new InvalidWeightError();
    const rent: Rent = {
      id: randomUUID(),
      lockerId: null,
      status: "CREATED",
      ...input,
    };
    return this.repo.create(rent);
  }
}

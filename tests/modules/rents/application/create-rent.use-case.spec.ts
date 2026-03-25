import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateRentUseCase } from "../../../../src/modules/rents/application/create-rent.use-case.js";
import { InvalidWeightError } from "../../../../src/modules/rents/domain/rent.errors.js";
import type { IRentRepository } from "../../../../src/modules/rents/domain/rent.repository.js";
import type { Rent } from "../../../../src/modules/rents/domain/rent.js";

const makeMockRepo = (): IRentRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findActiveByLockerId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("CreateRentUseCase", () => {
  let repo: IRentRepository;
  let useCase: CreateRentUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new CreateRentUseCase(repo);
  });

  it("creates a rent with CREATED status and null lockerId", async () => {
    const created: Rent = { id: "r-new", lockerId: null, weight: 5, size: "M", status: "CREATED" };
    vi.mocked(repo.create).mockResolvedValue(created);

    const result = await useCase.execute({ weight: 5, size: "M" });

    expect(result).toEqual(created);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ lockerId: null, status: "CREATED", weight: 5, size: "M" }),
    );
  });

  it("throws InvalidWeightError when weight is zero", async () => {
    await expect(useCase.execute({ weight: 0, size: "S" })).rejects.toThrow(InvalidWeightError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws InvalidWeightError when weight is negative", async () => {
    await expect(useCase.execute({ weight: -1, size: "S" })).rejects.toThrow(InvalidWeightError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

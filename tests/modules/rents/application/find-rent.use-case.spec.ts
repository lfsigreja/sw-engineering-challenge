import { describe, it, expect, vi, beforeEach } from "vitest";
import { FindRentUseCase } from "../../../../src/modules/rents/application/find-rent.use-case.js";
import { RentNotFoundError } from "../../../../src/modules/rents/domain/rent.errors.js";
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

const existing: Rent = { id: "r-1", lockerId: null, weight: 1, size: "S", status: "CREATED" };

describe("FindRentUseCase", () => {
  let repo: IRentRepository;
  let useCase: FindRentUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new FindRentUseCase(repo);
  });

  it("returns the rent when found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(existing);

    const result = await useCase.execute("r-1");

    expect(result).toEqual(existing);
    expect(repo.findById).toHaveBeenCalledWith("r-1");
  });

  it("throws RentNotFoundError when the rent does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing")).rejects.toThrow(RentNotFoundError);
  });
});

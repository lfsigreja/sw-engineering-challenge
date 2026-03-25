import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListRentsUseCase } from "../../../../src/modules/rents/application/list-rents.use-case.js";
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

const SEED: Rent[] = [
  { id: "r-1", lockerId: null, weight: 1, size: "S", status: "CREATED" },
  { id: "r-2", lockerId: "l-1", weight: 2, size: "M", status: "WAITING_DROPOFF" },
];

describe("ListRentsUseCase", () => {
  let repo: IRentRepository;
  let useCase: ListRentsUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new ListRentsUseCase(repo);
  });

  it("returns all rents", async () => {
    vi.mocked(repo.findAll).mockResolvedValue(SEED);

    const result = await useCase.execute();

    expect(result).toEqual(SEED);
    expect(repo.findAll).toHaveBeenCalledOnce();
  });

  it("returns empty array when there are no rents", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});

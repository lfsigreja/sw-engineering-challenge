import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListLockersUseCase } from "../../../../src/modules/lockers/application/list-lockers.use-case.js";
import type { ILockerRepository } from "../../../../src/modules/lockers/domain/locker.repository.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";

const makeMockRepo = (): ILockerRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBloqId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("ListLockersUseCase", () => {
  let repo: ILockerRepository;
  let useCase: ListLockersUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new ListLockersUseCase(repo);
  });

  it("returns all lockers from the repository", async () => {
    const lockers: Locker[] = [
      { id: "l-1", bloqId: "b-1", status: "OPEN", isOccupied: false },
      { id: "l-2", bloqId: "b-1", status: "CLOSED", isOccupied: true },
    ];
    vi.mocked(repo.findAll).mockResolvedValue(lockers);

    const result = await useCase.execute();

    expect(result).toEqual(lockers);
    expect(repo.findAll).toHaveBeenCalledOnce();
  });

  it("returns an empty array when there are no lockers", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FindLockerUseCase } from "../../../../src/modules/lockers/application/find-locker.use-case.js";
import { LockerNotFoundError } from "../../../../src/modules/lockers/domain/locker.errors.js";
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

describe("FindLockerUseCase", () => {
  let repo: ILockerRepository;
  let useCase: FindLockerUseCase;

  const locker: Locker = { id: "l-1", bloqId: "b-1", status: "OPEN", isOccupied: false };

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new FindLockerUseCase(repo);
  });

  it("returns the locker when it exists", async () => {
    vi.mocked(repo.findById).mockResolvedValue(locker);

    const result = await useCase.execute("l-1");

    expect(result).toEqual(locker);
    expect(repo.findById).toHaveBeenCalledWith("l-1");
  });

  it("throws LockerNotFoundError when the locker does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id")).rejects.toThrow(LockerNotFoundError);
    await expect(useCase.execute("missing-id")).rejects.toThrow('Locker with id "missing-id" not found');
  });
});

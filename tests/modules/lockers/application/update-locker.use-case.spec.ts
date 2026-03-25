import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateLockerUseCase } from "../../../../src/modules/lockers/application/update-locker.use-case.js";
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

describe("UpdateLockerUseCase", () => {
  let repo: ILockerRepository;
  let useCase: UpdateLockerUseCase;

  const existing: Locker = { id: "l-1", bloqId: "b-1", status: "OPEN", isOccupied: false };

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new UpdateLockerUseCase(repo);
  });

  it("returns the updated locker when it exists", async () => {
    const updated: Locker = { ...existing, status: "CLOSED", isOccupied: true };
    vi.mocked(repo.findById).mockResolvedValue(existing);
    vi.mocked(repo.update).mockResolvedValue(updated);

    const result = await useCase.execute("l-1", { status: "CLOSED", isOccupied: true });

    expect(result).toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith("l-1", { status: "CLOSED", isOccupied: true });
  });

  it("throws LockerNotFoundError when the locker does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id", { status: "CLOSED" })).rejects.toThrow(LockerNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

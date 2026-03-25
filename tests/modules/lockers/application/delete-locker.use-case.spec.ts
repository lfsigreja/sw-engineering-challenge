import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteLockerUseCase } from "../../../../src/modules/lockers/application/delete-locker.use-case.js";
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

describe("DeleteLockerUseCase", () => {
  let repo: ILockerRepository;
  let useCase: DeleteLockerUseCase;

  const existing: Locker = { id: "l-1", bloqId: "b-1", status: "OPEN", isOccupied: false };

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new DeleteLockerUseCase(repo);
  });

  it("calls repo.delete when the locker exists", async () => {
    vi.mocked(repo.findById).mockResolvedValue(existing);
    vi.mocked(repo.delete).mockResolvedValue();

    await useCase.execute("l-1");

    expect(repo.delete).toHaveBeenCalledWith("l-1");
  });

  it("throws LockerNotFoundError when the locker does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id")).rejects.toThrow(LockerNotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

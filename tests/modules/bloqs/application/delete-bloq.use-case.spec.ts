import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteBloqUseCase } from "../../../../src/modules/bloqs/application/delete-bloq.use-case.js";
import { BloqHasLockersError, BloqNotFoundError } from "../../../../src/modules/bloqs/domain/bloq.errors.js";
import type { IBloqRepository } from "../../../../src/modules/bloqs/domain/bloq.repository.js";
import type { Bloq } from "../../../../src/modules/bloqs/domain/bloq.js";
import type { ILockerRepository } from "../../../../src/modules/lockers/domain/locker.repository.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";

const makeMockBloqRepo = (): IBloqRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makeMockLockerRepo = (): ILockerRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBloqId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("DeleteBloqUseCase", () => {
  let bloqRepo: IBloqRepository;
  let lockerRepo: ILockerRepository;
  let useCase: DeleteBloqUseCase;

  const existing: Bloq = { id: "abc-123", title: "Bloq A", address: "Street A" };
  const associatedLocker: Locker = { id: "l-1", bloqId: "abc-123", status: "OPEN", isOccupied: false };

  beforeEach(() => {
    bloqRepo = makeMockBloqRepo();
    lockerRepo = makeMockLockerRepo();
    useCase = new DeleteBloqUseCase(bloqRepo, lockerRepo);
  });

  it("calls repo.delete when the bloq exists and has no associated lockers", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(existing);
    vi.mocked(lockerRepo.findByBloqId).mockResolvedValue([]);
    vi.mocked(bloqRepo.delete).mockResolvedValue();

    await useCase.execute("abc-123");

    expect(bloqRepo.delete).toHaveBeenCalledWith("abc-123");
  });

  it("throws BloqNotFoundError when the bloq does not exist", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id")).rejects.toThrow(BloqNotFoundError);
    expect(bloqRepo.delete).not.toHaveBeenCalled();
  });

  it("throws BloqHasLockersError when the bloq still has associated lockers", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(existing);
    vi.mocked(lockerRepo.findByBloqId).mockResolvedValue([associatedLocker]);

    await expect(useCase.execute("abc-123")).rejects.toThrow(BloqHasLockersError);
    expect(bloqRepo.delete).not.toHaveBeenCalled();
  });
});

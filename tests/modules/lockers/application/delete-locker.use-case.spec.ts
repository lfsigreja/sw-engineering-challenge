import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteLockerUseCase } from "../../../../src/modules/lockers/application/delete-locker.use-case.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";
import {
  LockerHasActiveRentError,
  LockerNotFoundError,
  LockerOccupiedError,
} from "../../../../src/modules/lockers/domain/locker.errors.js";
import type { ILockerRepository } from "../../../../src/modules/lockers/domain/locker.repository.js";
import type { IRentRepository } from "../../../../src/modules/rents/domain/rent.repository.js";

const makeMockLockerRepo = (): ILockerRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBloqId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makeMockRentRepo = (): IRentRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findActiveByLockerId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("DeleteLockerUseCase", () => {
  let lockerRepo: ILockerRepository;
  let rentRepo: IRentRepository;
  let useCase: DeleteLockerUseCase;

  const existing: Locker = { id: "l-1", bloqId: "b-1", status: "OPEN", isOccupied: false };

  beforeEach(() => {
    lockerRepo = makeMockLockerRepo();
    rentRepo = makeMockRentRepo();
    useCase = new DeleteLockerUseCase(lockerRepo, rentRepo);
  });

  it("deletes the locker when it exists and has no active rent", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(existing);
    vi.mocked(rentRepo.findActiveByLockerId).mockResolvedValue(undefined);
    vi.mocked(lockerRepo.delete).mockResolvedValue();

    await useCase.execute("l-1");

    expect(lockerRepo.delete).toHaveBeenCalledWith("l-1");
  });

  it("throws LockerNotFoundError when the locker does not exist", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id")).rejects.toThrow(LockerNotFoundError);
    expect(lockerRepo.delete).not.toHaveBeenCalled();
  });

  it("throws when the locker is occupied but has no active rent tracked", async () => {
    const occupied: Locker = { ...existing, isOccupied: true };
    vi.mocked(lockerRepo.findById).mockResolvedValue(occupied);
    vi.mocked(rentRepo.findActiveByLockerId).mockResolvedValue(undefined);
    await expect(useCase.execute("l-1")).rejects.toThrow(LockerOccupiedError);
    expect(lockerRepo.delete).not.toHaveBeenCalled();
  });

  it("throws LockerHasActiveRentError when the locker has an active rent", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(existing);
    vi.mocked(rentRepo.findActiveByLockerId).mockResolvedValue({
      id: "r-1",
      lockerId: "l-1",
      status: "WAITING_DROPOFF",
      weight: 1,
      size: "S",
    });

    await expect(useCase.execute("l-1")).rejects.toThrow(LockerHasActiveRentError);
    expect(lockerRepo.delete).not.toHaveBeenCalled();
  });
});

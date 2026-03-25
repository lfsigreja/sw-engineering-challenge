import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransitionRentUseCase } from "../../../../src/modules/rents/application/transition-rent.use-case.js";
import { LockerNotFoundError } from "../../../../src/modules/lockers/domain/locker.errors.js";
import type { ILockerRepository } from "../../../../src/modules/lockers/domain/locker.repository.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";
import {
  InvalidRentStatusError,
  LockerNotOccupiedError,
  LockerNotOpenError,
  LockerOccupiedError,
  RentNoLockerError,
  RentNotFoundError,
} from "../../../../src/modules/rents/domain/rent.errors.js";
import type { IRentRepository } from "../../../../src/modules/rents/domain/rent.repository.js";
import type { Rent } from "../../../../src/modules/rents/domain/rent.js";

const makeMockRentRepo = (): IRentRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findActiveByLockerId: vi.fn(),
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

const LOCKER_ID = "l-1";
const RENT_ID = "r-1";

const openLocker: Locker = { id: LOCKER_ID, bloqId: "b-1", status: "OPEN", isOccupied: false };
const closedLocker: Locker = { id: LOCKER_ID, bloqId: "b-1", status: "CLOSED", isOccupied: true };

describe("TransitionRentUseCase – CREATED → WAITING_DROPOFF", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let useCase: TransitionRentUseCase;

  const createdRent: Rent = { id: RENT_ID, lockerId: null, weight: 1, size: "S", status: "CREATED" };

  beforeEach(() => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    useCase = new TransitionRentUseCase(rentRepo, lockerRepo);
  });

  it("transitions successfully and sets locker to CLOSED/occupied", async () => {
    const updated: Rent = { ...createdRent, lockerId: LOCKER_ID, status: "WAITING_DROPOFF" };
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);
    vi.mocked(lockerRepo.findById).mockResolvedValue(openLocker);
    vi.mocked(lockerRepo.update).mockResolvedValue(closedLocker);
    vi.mocked(rentRepo.update).mockResolvedValue(updated);

    const result = await useCase.execute(RENT_ID, {
      status: "WAITING_DROPOFF",
      lockerId: LOCKER_ID,
    });

    expect(lockerRepo.update).toHaveBeenCalledWith(LOCKER_ID, { status: "CLOSED", isOccupied: true });
    expect(rentRepo.update).toHaveBeenCalledWith(
      RENT_ID,
      expect.objectContaining({ status: "WAITING_DROPOFF", lockerId: LOCKER_ID }),
    );
    expect(result).toEqual(updated);
  });

  it("throws RentNotFoundError when rent is missing", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(undefined);

    await expect(
      useCase.execute(RENT_ID, { status: "WAITING_DROPOFF", lockerId: LOCKER_ID }),
    ).rejects.toThrow(RentNotFoundError);
  });

  it("throws InvalidRentStatusError when transition is invalid", async () => {
    const delivered: Rent = { ...createdRent, status: "DELIVERED" };
    vi.mocked(rentRepo.findById).mockResolvedValue(delivered);

    await expect(
      useCase.execute(RENT_ID, { status: "WAITING_DROPOFF", lockerId: LOCKER_ID }),
    ).rejects.toThrow(InvalidRentStatusError);
  });

  it("throws RentNoLockerError when lockerId is missing", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);

    await expect(useCase.execute(RENT_ID, { status: "WAITING_DROPOFF" })).rejects.toThrow(
      RentNoLockerError,
    );
  });

  it("throws LockerNotOpenError when locker is not OPEN", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);
    vi.mocked(lockerRepo.findById).mockResolvedValue(closedLocker);

    await expect(
      useCase.execute(RENT_ID, { status: "WAITING_DROPOFF", lockerId: LOCKER_ID }),
    ).rejects.toThrow(LockerNotOpenError);
  });

  it("throws LockerOccupiedError when locker is occupied", async () => {
    const occupiedOpen: Locker = { ...openLocker, isOccupied: true };
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);
    vi.mocked(lockerRepo.findById).mockResolvedValue(occupiedOpen);

    await expect(
      useCase.execute(RENT_ID, { status: "WAITING_DROPOFF", lockerId: LOCKER_ID }),
    ).rejects.toThrow(LockerOccupiedError);
  });
});

describe("TransitionRentUseCase – WAITING_DROPOFF → WAITING_PICKUP", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let useCase: TransitionRentUseCase;

  const waitingDropoff: Rent = {
    id: RENT_ID,
    lockerId: LOCKER_ID,
    weight: 1,
    size: "S",
    status: "WAITING_DROPOFF",
  };

  beforeEach(() => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    useCase = new TransitionRentUseCase(rentRepo, lockerRepo);
  });

  it("transitions successfully without changing locker", async () => {
    const updated: Rent = { ...waitingDropoff, status: "WAITING_PICKUP" };
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingDropoff);
    vi.mocked(rentRepo.update).mockResolvedValue(updated);

    const result = await useCase.execute(RENT_ID, { status: "WAITING_PICKUP" });

    expect(lockerRepo.update).not.toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it("throws RentNoLockerError when lockerId is not set on the rent", async () => {
    const noLocker: Rent = { ...waitingDropoff, lockerId: null };
    vi.mocked(rentRepo.findById).mockResolvedValue(noLocker);

    await expect(useCase.execute(RENT_ID, { status: "WAITING_PICKUP" })).rejects.toThrow(
      RentNoLockerError,
    );
  });

  it("does not change lockerId even if a different lockerId is sent in the body", async () => {
    const OTHER_LOCKER_ID = "other-locker-id";
    const updated: Rent = { ...waitingDropoff, status: "WAITING_PICKUP" };
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingDropoff);
    vi.mocked(rentRepo.update).mockResolvedValue(updated);

    await useCase.execute(RENT_ID, { status: "WAITING_PICKUP", lockerId: OTHER_LOCKER_ID });

    expect(rentRepo.update).toHaveBeenCalledWith(
      RENT_ID,
      expect.not.objectContaining({ lockerId: OTHER_LOCKER_ID }),
    );
  });
});

describe("TransitionRentUseCase – WAITING_PICKUP → DELIVERED", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let useCase: TransitionRentUseCase;

  const waitingPickup: Rent = {
    id: RENT_ID,
    lockerId: LOCKER_ID,
    weight: 1,
    size: "S",
    status: "WAITING_PICKUP",
  };

  beforeEach(() => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    useCase = new TransitionRentUseCase(rentRepo, lockerRepo);
  });

  it("transitions successfully and releases the locker", async () => {
    const updated: Rent = { ...waitingPickup, status: "DELIVERED" };
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingPickup);
    vi.mocked(lockerRepo.findById).mockResolvedValue(closedLocker);
    vi.mocked(lockerRepo.update).mockResolvedValue(openLocker);
    vi.mocked(rentRepo.update).mockResolvedValue(updated);

    const result = await useCase.execute(RENT_ID, { status: "DELIVERED" });

    expect(lockerRepo.update).toHaveBeenCalledWith(LOCKER_ID, { status: "OPEN", isOccupied: false });
    expect(result).toEqual(updated);
  });

  it("throws RentNoLockerError when lockerId is not set on the rent", async () => {
    const noLocker: Rent = { ...waitingPickup, lockerId: null };
    vi.mocked(rentRepo.findById).mockResolvedValue(noLocker);

    await expect(useCase.execute(RENT_ID, { status: "DELIVERED" })).rejects.toThrow(RentNoLockerError);
  });

  it("throws LockerNotOccupiedError when locker is already free", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingPickup);
    vi.mocked(lockerRepo.findById).mockResolvedValue(openLocker);

    await expect(useCase.execute(RENT_ID, { status: "DELIVERED" })).rejects.toThrow(
      LockerNotOccupiedError,
    );
  });

  it("throws LockerNotFoundError when the locker referenced by rent no longer exists", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingPickup);
    vi.mocked(lockerRepo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute(RENT_ID, { status: "DELIVERED" })).rejects.toThrow(
      LockerNotFoundError,
    );
  });

  it("does not change lockerId even if a different lockerId is sent in the body", async () => {
    const OTHER_LOCKER_ID = "other-locker-id";
    const updated: Rent = { ...waitingPickup, status: "DELIVERED" };
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingPickup);
    vi.mocked(lockerRepo.findById).mockResolvedValue(closedLocker);
    vi.mocked(lockerRepo.update).mockResolvedValue(openLocker);
    vi.mocked(rentRepo.update).mockResolvedValue(updated);

    await useCase.execute(RENT_ID, { status: "DELIVERED", lockerId: OTHER_LOCKER_ID });

    expect(rentRepo.update).toHaveBeenCalledWith(
      RENT_ID,
      expect.not.objectContaining({ lockerId: OTHER_LOCKER_ID }),
    );
    expect(rentRepo.update).toHaveBeenCalledWith(RENT_ID, expect.objectContaining({ status: "DELIVERED" }));
  });
});

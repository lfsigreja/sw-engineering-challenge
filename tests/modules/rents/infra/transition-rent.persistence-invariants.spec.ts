import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { JsonStore } from "../../../../src/shared/infrastructure/json-store.js";
import { LockerJsonRepository } from "../../../../src/modules/lockers/infra/locker.json-repository.js";
import { RentJsonRepository } from "../../../../src/modules/rents/infra/rent.json-repository.js";
import { TransitionRentUseCase } from "../../../../src/modules/rents/application/transition-rent.use-case.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";
import type { Rent } from "../../../../src/modules/rents/domain/rent.js";
import { LockerNotOccupiedError, LockerOccupiedError } from "../../../../src/modules/rents/domain/rent.errors.js";

async function seedStoreAndCreateRepos(seed: {
  lockers: Locker[];
  rents: Rent[];
}): Promise<{
  baseDir: string;
  rentRepo: RentJsonRepository;
  lockerRepo: LockerJsonRepository;
  transitionUseCase: TransitionRentUseCase;
  cleanup: () => Promise<void>;
}> {
  const baseDir = await mkdtemp(path.join(os.tmpdir(), "bloqit-rents-"));

  await writeFile(path.join(baseDir, "lockers.json"), JSON.stringify(seed.lockers, null, 2), "utf8");
  await writeFile(path.join(baseDir, "rents.json"), JSON.stringify(seed.rents, null, 2), "utf8");

  const store = new JsonStore(baseDir);
  const lockerRepo = new LockerJsonRepository(store);
  const rentRepo = new RentJsonRepository(store);
  const transitionUseCase = new TransitionRentUseCase(rentRepo, lockerRepo);

  return {
    baseDir,
    rentRepo,
    lockerRepo,
    transitionUseCase,
    cleanup: () => rm(baseDir, { recursive: true, force: true }),
  };
}

describe("TransitionRentUseCase persistence invariants", () => {
  it("persists the happy-path sequence and preserves rent.lockerId immutably", async () => {
    const bloqId = randomUUID();
    const lockerId = randomUUID();
    const otherLockerId = randomUUID();
    const rentId = randomUUID();

    const seedLocker: Locker = { id: lockerId, bloqId, status: "OPEN", isOccupied: false };
    const seedRent: Rent = {
      id: rentId,
      lockerId: null,
      weight: 5,
      size: "M",
      status: "CREATED",
    };

    const ctx = await seedStoreAndCreateRepos({
      lockers: [seedLocker],
      rents: [seedRent],
    });

    try {
      await ctx.transitionUseCase.execute(rentId, {
        status: "WAITING_DROPOFF",
        lockerId,
      });

      const persistedAfterDropoffRent = await ctx.rentRepo.findById(rentId);
      const persistedAfterDropoffLocker = await ctx.lockerRepo.findById(lockerId);
      expect(persistedAfterDropoffRent).not.toBeUndefined();
      expect(persistedAfterDropoffLocker).not.toBeUndefined();

      expect(persistedAfterDropoffRent!.status).toBe("WAITING_DROPOFF");
      expect(persistedAfterDropoffRent!.lockerId).toBe(lockerId);
      expect(persistedAfterDropoffLocker!.status).toBe("CLOSED");
      expect(persistedAfterDropoffLocker!.isOccupied).toBe(true);

      await ctx.transitionUseCase.execute(rentId, {
        status: "WAITING_PICKUP",
        lockerId: otherLockerId,
      });

      const persistedAfterPickupRent = await ctx.rentRepo.findById(rentId);
      const persistedAfterPickupLocker = await ctx.lockerRepo.findById(lockerId);
      expect(persistedAfterPickupRent).not.toBeUndefined();
      expect(persistedAfterPickupLocker).not.toBeUndefined();

      expect(persistedAfterPickupRent!.status).toBe("WAITING_PICKUP");
      expect(persistedAfterPickupRent!.lockerId).toBe(lockerId);
      expect(persistedAfterPickupLocker!.status).toBe("CLOSED");
      expect(persistedAfterPickupLocker!.isOccupied).toBe(true);

      await ctx.transitionUseCase.execute(rentId, {
        status: "DELIVERED",
        lockerId: otherLockerId,
      });

      const persistedAfterDeliveredRent = await ctx.rentRepo.findById(rentId);
      const persistedAfterDeliveredLocker = await ctx.lockerRepo.findById(lockerId);
      expect(persistedAfterDeliveredRent).not.toBeUndefined();
      expect(persistedAfterDeliveredLocker).not.toBeUndefined();

      expect(persistedAfterDeliveredRent!.status).toBe("DELIVERED");
      expect(persistedAfterDeliveredRent!.lockerId).toBe(lockerId);
      expect(persistedAfterDeliveredLocker!.status).toBe("OPEN");
      expect(persistedAfterDeliveredLocker!.isOccupied).toBe(false);
    } finally {
      await ctx.cleanup();
    }
  });

  it("does not persist partial updates when WAITING_DROPOFF guard fails (LOCKER_OCCUPIED)", async () => {
    const bloqId = randomUUID();
    const lockerId = randomUUID();
    const rentId = randomUUID();

    const occupiedLocker: Locker = { id: lockerId, bloqId, status: "OPEN", isOccupied: true };
    const rent: Rent = { id: rentId, lockerId: null, weight: 5, size: "M", status: "CREATED" };

    const ctx = await seedStoreAndCreateRepos({
      lockers: [occupiedLocker],
      rents: [rent],
    });

    try {
      await expect(
        ctx.transitionUseCase.execute(rentId, {
          status: "WAITING_DROPOFF",
          lockerId,
        }),
      ).rejects.toThrow(LockerOccupiedError);

      const persistedRent = await ctx.rentRepo.findById(rentId);
      const persistedLocker = await ctx.lockerRepo.findById(lockerId);

      expect(persistedRent).not.toBeUndefined();
      expect(persistedLocker).not.toBeUndefined();

      expect(persistedRent!.status).toBe("CREATED");
      expect(persistedRent!.lockerId).toBeNull();
      expect(persistedLocker!.status).toBe("OPEN");
      expect(persistedLocker!.isOccupied).toBe(true);
    } finally {
      await ctx.cleanup();
    }
  });

  it("does not persist partial updates when DELIVERED guard fails (LOCKER_NOT_OCCUPIED)", async () => {
    const bloqId = randomUUID();
    const lockerId = randomUUID();
    const rentId = randomUUID();

    const closedButFreeLocker: Locker = { id: lockerId, bloqId, status: "CLOSED", isOccupied: false };
    const waitingPickupRent: Rent = {
      id: rentId,
      lockerId,
      weight: 5,
      size: "M",
      status: "WAITING_PICKUP",
    };

    const ctx = await seedStoreAndCreateRepos({
      lockers: [closedButFreeLocker],
      rents: [waitingPickupRent],
    });

    try {
      await expect(ctx.transitionUseCase.execute(rentId, { status: "DELIVERED" })).rejects.toThrow(
        LockerNotOccupiedError,
      );

      const persistedRent = await ctx.rentRepo.findById(rentId);
      const persistedLocker = await ctx.lockerRepo.findById(lockerId);

      expect(persistedRent).not.toBeUndefined();
      expect(persistedLocker).not.toBeUndefined();

      expect(persistedRent!.status).toBe("WAITING_PICKUP");
      expect(persistedRent!.lockerId).toBe(lockerId);
      expect(persistedLocker!.status).toBe("CLOSED");
      expect(persistedLocker!.isOccupied).toBe(false);
    } finally {
      await ctx.cleanup();
    }
  });
});


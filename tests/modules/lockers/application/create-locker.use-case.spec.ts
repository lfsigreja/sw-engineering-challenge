import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateLockerUseCase } from "../../../../src/modules/lockers/application/create-locker.use-case.js";
import { BloqNotFoundError } from "../../../../src/modules/bloqs/domain/bloq.errors.js";
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

describe("CreateLockerUseCase", () => {
  let lockerRepo: ILockerRepository;
  let bloqRepo: IBloqRepository;
  let useCase: CreateLockerUseCase;

  const bloq: Bloq = { id: "b-1", title: "Bloq A", address: "Street A" };

  beforeEach(() => {
    lockerRepo = makeMockLockerRepo();
    bloqRepo = makeMockBloqRepo();
    useCase = new CreateLockerUseCase(lockerRepo, bloqRepo);
  });

  it("creates a locker with a generated UUID when the bloq exists", async () => {
    const input = { bloqId: "b-1", status: "OPEN" as const, isOccupied: false };
    vi.mocked(bloqRepo.findById).mockResolvedValue(bloq);
    vi.mocked(lockerRepo.create).mockImplementation((l: Locker) => Promise.resolve(l));

    const result = await useCase.execute(input);

    expect(result.bloqId).toBe("b-1");
    expect(result.status).toBe("OPEN");
    expect(result.isOccupied).toBe(false);
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("throws BloqNotFoundError when the bloqId does not reference a valid bloq", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(undefined);

    await expect(
      useCase.execute({ bloqId: "missing-bloq", status: "OPEN", isOccupied: false }),
    ).rejects.toThrow(BloqNotFoundError);
    expect(lockerRepo.create).not.toHaveBeenCalled();
  });
});

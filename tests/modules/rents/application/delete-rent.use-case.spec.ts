import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteRentUseCase } from "../../../../src/modules/rents/application/delete-rent.use-case.js";
import {
  RentCannotBeDeletedError,
  RentNotFoundError,
} from "../../../../src/modules/rents/domain/rent.errors.js";
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

describe("DeleteRentUseCase", () => {
  let repo: IRentRepository;
  let useCase: DeleteRentUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new DeleteRentUseCase(repo);
  });

  it("deletes a CREATED rent with no locker assigned", async () => {
    const created: Rent = { id: "r-1", lockerId: null, weight: 1, size: "S", status: "CREATED" };
    vi.mocked(repo.findById).mockResolvedValue(created);
    vi.mocked(repo.delete).mockResolvedValue();

    await useCase.execute("r-1");

    expect(repo.delete).toHaveBeenCalledWith("r-1");
  });

  it("throws RentNotFoundError when rent does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing")).rejects.toThrow(RentNotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("throws RentCannotBeDeletedError when rent is not CREATED", async () => {
    const waitingDropoff: Rent = { id: "r-1", lockerId: "l-1", weight: 1, size: "S", status: "WAITING_DROPOFF" };
    vi.mocked(repo.findById).mockResolvedValue(waitingDropoff);

    await expect(useCase.execute("r-1")).rejects.toThrow(RentCannotBeDeletedError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("throws RentCannotBeDeletedError when rent is CREATED but has a locker assigned", async () => {
    const createdWithLocker: Rent = { id: "r-1", lockerId: "l-1", weight: 1, size: "S", status: "CREATED" };
    vi.mocked(repo.findById).mockResolvedValue(createdWithLocker);

    await expect(useCase.execute("r-1")).rejects.toThrow(RentCannotBeDeletedError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

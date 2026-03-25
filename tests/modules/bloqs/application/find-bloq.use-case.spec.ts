import { describe, it, expect, vi, beforeEach } from "vitest";
import { FindBloqUseCase } from "../../../../src/modules/bloqs/application/find-bloq.use-case.js";
import { BloqNotFoundError } from "../../../../src/modules/bloqs/domain/bloq.errors.js";
import type { IBloqRepository } from "../../../../src/modules/bloqs/domain/bloq.repository.js";
import type { Bloq } from "../../../../src/modules/bloqs/domain/bloq.js";

const makeMockRepo = (): IBloqRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("FindBloqUseCase", () => {
  let repo: IBloqRepository;
  let useCase: FindBloqUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new FindBloqUseCase(repo);
  });

  it("returns the bloq when it exists", async () => {
    const bloq: Bloq = { id: "abc-123", title: "Bloq A", address: "Street A" };
    vi.mocked(repo.findById).mockResolvedValue(bloq);

    const result = await useCase.execute("abc-123");

    expect(result).toEqual(bloq);
    expect(repo.findById).toHaveBeenCalledWith("abc-123");
  });

  it("throws BloqNotFoundError when the bloq does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id")).rejects.toThrow(BloqNotFoundError);
    await expect(useCase.execute("missing-id")).rejects.toThrow('Bloq with id "missing-id" not found');
  });
});

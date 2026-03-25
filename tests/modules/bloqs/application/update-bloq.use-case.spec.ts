import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateBloqUseCase } from "../../../../src/modules/bloqs/application/update-bloq.use-case.js";
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

describe("UpdateBloqUseCase", () => {
  let repo: IBloqRepository;
  let useCase: UpdateBloqUseCase;

  const existing: Bloq = { id: "abc-123", title: "Old Title", address: "Old Address" };

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new UpdateBloqUseCase(repo);
  });

  it("returns the updated bloq when it exists", async () => {
    const updated: Bloq = { ...existing, title: "New Title" };
    vi.mocked(repo.findById).mockResolvedValue(existing);
    vi.mocked(repo.update).mockResolvedValue(updated);

    const result = await useCase.execute("abc-123", { title: "New Title" });

    expect(result).toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith("abc-123", { title: "New Title" });
  });

  it("throws BloqNotFoundError when the bloq does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id", { title: "X" })).rejects.toThrow(BloqNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

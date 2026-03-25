import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteBloqUseCase } from "../../../../src/modules/bloqs/application/delete-bloq.use-case.js";
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

describe("DeleteBloqUseCase", () => {
  let repo: IBloqRepository;
  let useCase: DeleteBloqUseCase;

  const existing: Bloq = { id: "abc-123", title: "Bloq A", address: "Street A" };

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new DeleteBloqUseCase(repo);
  });

  it("calls repo.delete when the bloq exists", async () => {
    vi.mocked(repo.findById).mockResolvedValue(existing);
    vi.mocked(repo.delete).mockResolvedValue();

    await useCase.execute("abc-123");

    expect(repo.delete).toHaveBeenCalledWith("abc-123");
  });

  it("throws BloqNotFoundError when the bloq does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(undefined);

    await expect(useCase.execute("missing-id")).rejects.toThrow(BloqNotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

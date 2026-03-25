import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListBloqsUseCase } from "../../../../src/modules/bloqs/application/list-bloqs.use-case.js";
import type { IBloqRepository } from "../../../../src/modules/bloqs/domain/bloq.repository.js";
import type { Bloq } from "../../../../src/modules/bloqs/domain/bloq.js";

const makeMockRepo = (): IBloqRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("ListBloqsUseCase", () => {
  let repo: IBloqRepository;
  let useCase: ListBloqsUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new ListBloqsUseCase(repo);
  });

  it("returns all bloqs from the repository", async () => {
    const bloqs: Bloq[] = [
      { id: "1", title: "Bloq A", address: "Street A" },
      { id: "2", title: "Bloq B", address: "Street B" },
    ];
    vi.mocked(repo.findAll).mockResolvedValue(bloqs);

    const result = await useCase.execute();

    expect(result).toEqual(bloqs);
    expect(repo.findAll).toHaveBeenCalledOnce();
  });

  it("returns an empty array when there are no bloqs", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});

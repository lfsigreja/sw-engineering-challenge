import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateBloqUseCase } from "../../../../src/modules/bloqs/application/create-bloq.use-case.js";
import type { IBloqRepository } from "../../../../src/modules/bloqs/domain/bloq.repository.js";
import type { Bloq } from "../../../../src/modules/bloqs/domain/bloq.js";

const makeMockRepo = (): IBloqRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("CreateBloqUseCase", () => {
  let repo: IBloqRepository;
  let useCase: CreateBloqUseCase;

  beforeEach(() => {
    repo = makeMockRepo();
    useCase = new CreateBloqUseCase(repo);
  });

  it("creates a bloq with a generated UUID and the provided input", async () => {
    const input = { title: "New Bloq", address: "123 Main St" };
    vi.mocked(repo.create).mockImplementation((bloq: Bloq) => Promise.resolve(bloq));

    const result = await useCase.execute(input);

    expect(result.title).toBe(input.title);
    expect(result.address).toBe(input.address);
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("calls repo.create with the constructed bloq", async () => {
    const input = { title: "Bloq X", address: "456 Side St" };
    vi.mocked(repo.create).mockImplementation((bloq: Bloq) => Promise.resolve(bloq));

    await useCase.execute(input);

    expect(repo.create).toHaveBeenCalledOnce();
    const [calledWith] = vi.mocked(repo.create).mock.calls[0];
    expect(calledWith.title).toBe(input.title);
    expect(calledWith.address).toBe(input.address);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import supertest from "supertest";
import { registerErrorHandler } from "../../../../src/core/plugins/error-handler.js";
import { registerBloqRoutes } from "../../../../src/modules/bloqs/infra/bloq.routes.js";
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

function buildTestApp(bloqRepo: IBloqRepository, lockerRepo: ILockerRepository): FastifyInstance {
  const app = Fastify();
  registerErrorHandler(app);
  registerBloqRoutes(app, bloqRepo, lockerRepo);
  return app;
}

const SEED: Bloq[] = [
  { id: "uuid-1", title: "Bloq A", address: "Street A" },
  { id: "uuid-2", title: "Bloq B", address: "Street B" },
];

const LOCKER: Locker = { id: "l-1", bloqId: "uuid-1", status: "OPEN", isOccupied: false };

describe("GET /bloqs", () => {
  let bloqRepo: IBloqRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    bloqRepo = makeMockBloqRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(bloqRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with the list of bloqs", async () => {
    vi.mocked(bloqRepo.findAll).mockResolvedValue(SEED);

    const res = await supertest(app.server).get("/bloqs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SEED);
  });

  it("returns 200 with an empty array when there are no bloqs", async () => {
    vi.mocked(bloqRepo.findAll).mockResolvedValue([]);

    const res = await supertest(app.server).get("/bloqs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /bloqs/:id", () => {
  let bloqRepo: IBloqRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    bloqRepo = makeMockBloqRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(bloqRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with the bloq when found", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(SEED[0]);

    const res = await supertest(app.server).get("/bloqs/uuid-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SEED[0]);
  });

  it("returns 404 when the bloq does not exist", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server).get("/bloqs/missing-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("BLOQ_NOT_FOUND");
  });
});

describe("POST /bloqs", () => {
  let bloqRepo: IBloqRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    bloqRepo = makeMockBloqRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(bloqRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 201 with the created bloq", async () => {
    const created: Bloq = { id: "new-uuid", title: "New Bloq", address: "New St" };
    vi.mocked(bloqRepo.create).mockResolvedValue(created);

    const res = await supertest(app.server)
      .post("/bloqs")
      .send({ title: "New Bloq", address: "New St" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it("returns 400 when the body is invalid", async () => {
    const res = await supertest(app.server).post("/bloqs").send({ title: "" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when the body is missing required fields", async () => {
    const res = await supertest(app.server).post("/bloqs").send({});

    expect(res.status).toBe(400);
  });
});

describe("PATCH /bloqs/:id", () => {
  let bloqRepo: IBloqRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    bloqRepo = makeMockBloqRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(bloqRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with the updated bloq", async () => {
    const updated: Bloq = { id: "uuid-1", title: "Updated", address: "Street A" };
    vi.mocked(bloqRepo.findById).mockResolvedValue(SEED[0]);
    vi.mocked(bloqRepo.update).mockResolvedValue(updated);

    const res = await supertest(app.server)
      .patch("/bloqs/uuid-1")
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it("returns 404 when the bloq does not exist", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server)
      .patch("/bloqs/missing-id")
      .send({ title: "Updated" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("BLOQ_NOT_FOUND");
  });
});

describe("DELETE /bloqs/:id", () => {
  let bloqRepo: IBloqRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    bloqRepo = makeMockBloqRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(bloqRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 204 when the bloq is deleted", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(SEED[0]);
    vi.mocked(lockerRepo.findByBloqId).mockResolvedValue([]);
    vi.mocked(bloqRepo.delete).mockResolvedValue();

    const res = await supertest(app.server).delete("/bloqs/uuid-1");

    expect(res.status).toBe(204);
  });

  it("returns 404 when the bloq does not exist", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server).delete("/bloqs/missing-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("BLOQ_NOT_FOUND");
  });

  it("returns 409 when the bloq still has associated lockers", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(SEED[0]);
    vi.mocked(lockerRepo.findByBloqId).mockResolvedValue([LOCKER]);

    const res = await supertest(app.server).delete("/bloqs/uuid-1");

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("BLOQ_HAS_LOCKERS");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import supertest from "supertest";
import { registerErrorHandler } from "../../../../src/core/plugins/error-handler.js";
import type { IBloqRepository } from "../../../../src/modules/bloqs/domain/bloq.repository.js";
import type { Bloq } from "../../../../src/modules/bloqs/domain/bloq.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";
import type { ILockerRepository } from "../../../../src/modules/lockers/domain/locker.repository.js";
import { registerLockerRoutes } from "../../../../src/modules/lockers/infra/locker.routes.js";
import type { IRentRepository } from "../../../../src/modules/rents/domain/rent.repository.js";

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

const makeMockRentRepo = (): IRentRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findActiveByLockerId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

function buildTestApp(
  lockerRepo: ILockerRepository,
  bloqRepo: IBloqRepository,
  rentRepo: IRentRepository,
): FastifyInstance {
  const app = Fastify();
  registerErrorHandler(app);
  registerLockerRoutes(app, lockerRepo, bloqRepo, rentRepo);
  return app;
}

const BLOQ_ID = "c3ee858c-f3d8-45a3-803d-e080649bbb6f";
const BLOQ: Bloq = { id: BLOQ_ID, title: "Bloq A", address: "Street A" };

const SEED: Locker[] = [
  { id: "1b8d1e89-2514-4d91-b813-044bf0ce8d20", bloqId: BLOQ_ID, status: "OPEN", isOccupied: false },
  { id: "8b4b59ae-8de5-4322-a426-79c29315a9f1", bloqId: BLOQ_ID, status: "CLOSED", isOccupied: true },
];

describe("GET /lockers", () => {
  let lockerRepo: ILockerRepository;
  let bloqRepo: IBloqRepository;
  let rentRepo: IRentRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    lockerRepo = makeMockLockerRepo();
    bloqRepo = makeMockBloqRepo();
    rentRepo = makeMockRentRepo();
    app = buildTestApp(lockerRepo, bloqRepo, rentRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with the list of lockers", async () => {
    vi.mocked(lockerRepo.findAll).mockResolvedValue(SEED);

    const res = await supertest(app.server).get("/lockers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SEED);
  });

  it("returns 200 with an empty array when there are no lockers", async () => {
    vi.mocked(lockerRepo.findAll).mockResolvedValue([]);

    const res = await supertest(app.server).get("/lockers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /lockers/:id", () => {
  let lockerRepo: ILockerRepository;
  let bloqRepo: IBloqRepository;
  let rentRepo: IRentRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    lockerRepo = makeMockLockerRepo();
    bloqRepo = makeMockBloqRepo();
    rentRepo = makeMockRentRepo();
    app = buildTestApp(lockerRepo, bloqRepo, rentRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with the locker when found", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(SEED[0]);

    const res = await supertest(app.server).get("/lockers/l-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SEED[0]);
  });

  it("returns 404 when the locker does not exist", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server).get("/lockers/missing-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("LOCKER_NOT_FOUND");
  });
});

describe("POST /lockers", () => {
  let lockerRepo: ILockerRepository;
  let bloqRepo: IBloqRepository;
  let rentRepo: IRentRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    lockerRepo = makeMockLockerRepo();
    bloqRepo = makeMockBloqRepo();
    rentRepo = makeMockRentRepo();
    app = buildTestApp(lockerRepo, bloqRepo, rentRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 201 with the created locker when the bloq exists", async () => {
    const created: Locker = {
      id: "2191e1b5-99c7-45df-8302-998be394be48",
      bloqId: BLOQ_ID,
      status: "OPEN",
      isOccupied: false,
    };
    vi.mocked(bloqRepo.findById).mockResolvedValue(BLOQ);
    vi.mocked(lockerRepo.create).mockResolvedValue(created);

    const res = await supertest(app.server)
      .post("/lockers")
      .send({ bloqId: BLOQ_ID, status: "OPEN", isOccupied: false });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it("returns 404 when the bloqId does not reference an existing bloq", async () => {
    vi.mocked(bloqRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server)
      .post("/lockers")
      .send({ bloqId: "00000000-0000-0000-0000-000000000000", status: "OPEN", isOccupied: false });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("BLOQ_NOT_FOUND");
  });

  it("returns 400 when the body is missing required fields", async () => {
    const res = await supertest(app.server).post("/lockers").send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 when status is invalid", async () => {
    const res = await supertest(app.server)
      .post("/lockers")
      .send({ bloqId: "b-1", status: "UNKNOWN", isOccupied: false });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /lockers/:id", () => {
  let lockerRepo: ILockerRepository;
  let bloqRepo: IBloqRepository;
  let rentRepo: IRentRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    lockerRepo = makeMockLockerRepo();
    bloqRepo = makeMockBloqRepo();
    rentRepo = makeMockRentRepo();
    app = buildTestApp(lockerRepo, bloqRepo, rentRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with the updated locker", async () => {
    const updated: Locker = { ...SEED[0]!, status: "CLOSED", isOccupied: true };
    vi.mocked(lockerRepo.findById).mockResolvedValue(SEED[0]);
    vi.mocked(lockerRepo.update).mockResolvedValue(updated);

    const res = await supertest(app.server)
      .patch("/lockers/l-1")
      .send({ status: "CLOSED", isOccupied: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it("returns 404 when the locker does not exist", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server)
      .patch("/lockers/missing-id")
      .send({ status: "CLOSED" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("LOCKER_NOT_FOUND");
  });
});

describe("DELETE /lockers/:id", () => {
  let lockerRepo: ILockerRepository;
  let bloqRepo: IBloqRepository;
  let rentRepo: IRentRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    lockerRepo = makeMockLockerRepo();
    bloqRepo = makeMockBloqRepo();
    rentRepo = makeMockRentRepo();
    app = buildTestApp(lockerRepo, bloqRepo, rentRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 204 when the locker is deleted", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(SEED[0]);
    vi.mocked(rentRepo.findActiveByLockerId).mockResolvedValue(undefined);
    vi.mocked(lockerRepo.delete).mockResolvedValue();

    const res = await supertest(app.server).delete("/lockers/l-1");

    expect(res.status).toBe(204);
  });

  it("returns 404 when the locker does not exist", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server).delete("/lockers/missing-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("LOCKER_NOT_FOUND");
  });

  it("returns 409 when the locker has an active rent", async () => {
    vi.mocked(lockerRepo.findById).mockResolvedValue(SEED[0]);
    vi.mocked(rentRepo.findActiveByLockerId).mockResolvedValue({
      id: "r-1",
      lockerId: SEED[0]!.id,
      status: "WAITING_DROPOFF",
      weight: 1,
      size: "S",
    });

    const res = await supertest(app.server).delete(`/lockers/${SEED[0]!.id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("LOCKER_HAS_ACTIVE_RENT");
  });
});

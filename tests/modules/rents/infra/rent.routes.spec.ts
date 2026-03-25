import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import supertest from "supertest";
import { registerErrorHandler } from "../../../../src/core/plugins/error-handler.js";
import type { Locker } from "../../../../src/modules/lockers/domain/locker.js";
import type { ILockerRepository } from "../../../../src/modules/lockers/domain/locker.repository.js";
import { registerRentRoutes } from "../../../../src/modules/rents/infra/rent.routes.js";
import type { Rent } from "../../../../src/modules/rents/domain/rent.js";
import type { IRentRepository } from "../../../../src/modules/rents/domain/rent.repository.js";

const makeMockRentRepo = (): IRentRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findActiveByLockerId: vi.fn(),
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

function buildTestApp(rentRepo: IRentRepository, lockerRepo: ILockerRepository): FastifyInstance {
  const app = Fastify();
  registerErrorHandler(app);
  registerRentRoutes(app, rentRepo, lockerRepo);
  return app;
}

const LOCKER_ID = "1b8d1e89-2514-4d91-b813-044bf0ce8d20";
const RENT_ID = "8b4b59ae-8de5-4322-a426-79c29315a9f1";

const openLocker: Locker = { id: LOCKER_ID, bloqId: "b-1", status: "OPEN", isOccupied: false };
const closedLocker: Locker = { id: LOCKER_ID, bloqId: "b-1", status: "CLOSED", isOccupied: true };

const SEED: Rent[] = [
  { id: RENT_ID, lockerId: null, weight: 5, size: "M", status: "CREATED" },
  { id: "2191e1b5-99c7-45df-8302-998be394be48", lockerId: LOCKER_ID, weight: 2, size: "S", status: "WAITING_DROPOFF" },
];

describe("GET /rents", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(rentRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 with all rents", async () => {
    vi.mocked(rentRepo.findAll).mockResolvedValue(SEED);

    const res = await supertest(app.server).get("/rents");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SEED);
  });
});

describe("GET /rents/:id", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(rentRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 200 when the rent exists", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(SEED[0]);

    const res = await supertest(app.server).get(`/rents/${RENT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SEED[0]);
  });

  it("returns 404 when the rent does not exist", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server).get("/rents/missing-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("RENT_NOT_FOUND");
  });
});

describe("POST /rents", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(rentRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 201 with the created rent", async () => {
    const created: Rent = { id: RENT_ID, lockerId: null, weight: 5, size: "M", status: "CREATED" };
    vi.mocked(rentRepo.create).mockResolvedValue(created);

    const res = await supertest(app.server).post("/rents").send({ weight: 5, size: "M" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it("returns 400 when the body is missing required fields", async () => {
    const res = await supertest(app.server).post("/rents").send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 when size is invalid", async () => {
    const res = await supertest(app.server).post("/rents").send({ weight: 1, size: "XXXX" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when weight is zero", async () => {
    vi.mocked(rentRepo.create).mockRejectedValue(
      Object.assign(new Error("INVALID_WEIGHT"), { domainCode: "INVALID_WEIGHT" }),
    );

    const res = await supertest(app.server).post("/rents").send({ weight: 0, size: "S" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /rents/:id", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  const createdRent: Rent = { id: RENT_ID, lockerId: null, weight: 1, size: "S", status: "CREATED" };
  const waitingDropoffRent: Rent = {
    id: RENT_ID,
    lockerId: LOCKER_ID,
    weight: 1,
    size: "S",
    status: "WAITING_DROPOFF",
  };

  beforeEach(async () => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(rentRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("transitions CREATED → WAITING_DROPOFF and returns 200", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);
    vi.mocked(lockerRepo.findById).mockResolvedValue(openLocker);
    vi.mocked(lockerRepo.update).mockResolvedValue(closedLocker);
    vi.mocked(rentRepo.update).mockResolvedValue(waitingDropoffRent);

    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "WAITING_DROPOFF", lockerId: LOCKER_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(waitingDropoffRent);
  });

  it("returns 404 when the rent does not exist", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "WAITING_DROPOFF", lockerId: LOCKER_ID });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("RENT_NOT_FOUND");
  });

  it("returns 409 when status transition is invalid", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingDropoffRent);

    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "WAITING_DROPOFF", lockerId: LOCKER_ID });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_RENT_STATUS");
  });

  it("returns 400 when body is invalid", async () => {
    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "CREATED" });

    expect(res.status).toBe(400);
  });

  it("returns 422 when lockerId is missing for WAITING_DROPOFF transition", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);

    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "WAITING_DROPOFF" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("RENT_NO_LOCKER");
  });

  it("returns 409 when locker is not OPEN", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);
    vi.mocked(lockerRepo.findById).mockResolvedValue(closedLocker);

    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "WAITING_DROPOFF", lockerId: LOCKER_ID });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("LOCKER_NOT_OPEN");
  });

  it("returns 409 when locker is occupied", async () => {
    const occupiedOpen: Locker = { ...openLocker, isOccupied: true };
    vi.mocked(rentRepo.findById).mockResolvedValue(createdRent);
    vi.mocked(lockerRepo.findById).mockResolvedValue(occupiedOpen);

    const res = await supertest(app.server)
      .patch(`/rents/${RENT_ID}`)
      .send({ status: "WAITING_DROPOFF", lockerId: LOCKER_ID });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("LOCKER_OCCUPIED");
  });
});

describe("DELETE /rents/:id", () => {
  let rentRepo: IRentRepository;
  let lockerRepo: ILockerRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    rentRepo = makeMockRentRepo();
    lockerRepo = makeMockLockerRepo();
    app = buildTestApp(rentRepo, lockerRepo);
    await app.ready();
  });

  afterEach(() => app.close());

  it("returns 204 when the rent is CREATED and lockerId is null", async () => {
    const created: Rent = { id: RENT_ID, lockerId: null, weight: 1, size: "S", status: "CREATED" };
    vi.mocked(rentRepo.findById).mockResolvedValue(created);
    vi.mocked(rentRepo.delete).mockResolvedValue();

    const res = await supertest(app.server).delete(`/rents/${RENT_ID}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 when the rent does not exist", async () => {
    vi.mocked(rentRepo.findById).mockResolvedValue(undefined);

    const res = await supertest(app.server).delete(`/rents/${RENT_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("RENT_NOT_FOUND");
  });

  it("returns 409 when the rent is not CREATED", async () => {
    const waitingDropoff: Rent = {
      id: RENT_ID,
      lockerId: LOCKER_ID,
      weight: 1,
      size: "S",
      status: "WAITING_DROPOFF",
    };
    vi.mocked(rentRepo.findById).mockResolvedValue(waitingDropoff);

    const res = await supertest(app.server).delete(`/rents/${RENT_ID}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("RENT_CANNOT_BE_DELETED");
  });

  it("returns 409 when the rent is CREATED but already has a lockerId", async () => {
    const createdWithLocker: Rent = { id: RENT_ID, lockerId: LOCKER_ID, weight: 1, size: "S", status: "CREATED" };
    vi.mocked(rentRepo.findById).mockResolvedValue(createdWithLocker);

    const res = await supertest(app.server).delete(`/rents/${RENT_ID}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("RENT_CANNOT_BE_DELETED");
  });
});

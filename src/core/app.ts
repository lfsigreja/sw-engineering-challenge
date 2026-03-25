import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { BloqJsonRepository } from "../modules/bloqs/infra/bloq.json-repository.js";
import { registerBloqRoutes } from "../modules/bloqs/infra/bloq.routes.js";
import { LockerJsonRepository } from "../modules/lockers/infra/locker.json-repository.js";
import { registerLockerRoutes } from "../modules/lockers/infra/locker.routes.js";
import { RentJsonRepository } from "../modules/rents/infra/rent.json-repository.js";
import { registerRentRoutes } from "../modules/rents/infra/rent.routes.js";
import { JsonStore } from "../shared/infrastructure/json-store.js";
import { registerErrorHandler } from "./plugins/error-handler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");

export function buildApp() {
  const app = Fastify();

  registerErrorHandler(app);

  const store = new JsonStore(dataDir);
  const bloqRepo = new BloqJsonRepository(store);
  const lockerRepo = new LockerJsonRepository(store);
  const rentRepo = new RentJsonRepository(store);

  app.get("/health", async () => ({ ok: true }));
  registerBloqRoutes(app, bloqRepo, lockerRepo);
  registerLockerRoutes(app, lockerRepo, bloqRepo, rentRepo);
  registerRentRoutes(app, rentRepo, lockerRepo);

  return app;
}

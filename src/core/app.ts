import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { JsonStore } from "../shared/infrastructure/json-store.js";
import { BloqJsonRepository } from "../modules/bloqs/infra/bloq.json-repository.js";
import { registerBloqRoutes } from "../modules/bloqs/infra/bloq.routes.js";
import { registerErrorHandler } from "./plugins/error-handler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");

export function buildApp() {
  const app = Fastify();

  registerErrorHandler(app);

  const store = new JsonStore(dataDir);
  const bloqRepo = new BloqJsonRepository(store);

  app.get("/health", async () => ({ ok: true }));
  registerBloqRoutes(app, bloqRepo);

  return app;
}
